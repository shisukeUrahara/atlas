import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import { mulberry32, shuffle } from "../dataset/rng";
import type { Chunk, QueryClass, WorkspaceId } from "../domain/schemas";
import type { LlmClient, LlmRequest } from "../llm/port";
import { tokenize } from "../retrieval/tokenize";

/** One drafted question before pooling and review. */
export const DraftQuestion = z.object({
  id: z.string().regex(/^q\d{3}$/),
  workspaceId: z.string(),
  question: z.string().min(8),
  queryClass: z.enum(["exact_id", "paraphrase", "version_new", "unanswerable", "cross_workspace"]),
  /** Chunk the question was written from (null for unanswerable). */
  seedChunkId: z.string().nullable(),
  seedWorkspaceId: z.string().nullable(),
  /** exact_id: the named identifier; unanswerable: the invented one. */
  identifier: z.string().nullable(),
});
export type DraftQuestion = z.infer<typeof DraftQuestion>;

export interface Pools {
  langchain: Chunk[];
  cookbook: Chunk[];
  /** Ids of LangChain documents that did not exist in the Sep 2025 snapshot. */
  newDocIds: Set<string>;
}

/** Plan from docs/labeling_guide.md: (class, asked-in workspace, seeds-from workspace, count). */
export const PLAN: { cls: QueryClass; ask: WorkspaceId; seedFrom: WorkspaceId | null; n: number }[] = [
  { cls: "exact_id", ask: "langchain", seedFrom: "langchain", n: 16 },
  { cls: "exact_id", ask: "cookbook", seedFrom: "cookbook", n: 8 },
  { cls: "paraphrase", ask: "langchain", seedFrom: "langchain", n: 16 },
  { cls: "paraphrase", ask: "cookbook", seedFrom: "cookbook", n: 8 },
  { cls: "version_new", ask: "langchain", seedFrom: "langchain", n: 24 },
  { cls: "unanswerable", ask: "langchain", seedFrom: null, n: 16 },
  { cls: "unanswerable", ask: "cookbook", seedFrom: null, n: 8 },
  { cls: "cross_workspace", ask: "langchain", seedFrom: "cookbook", n: 16 },
  { cls: "cross_workspace", ask: "cookbook", seedFrom: "langchain", n: 8 },
];

export const ONE_Q = z.object({ question: z.string() });
export const MANY = z.object({ items: z.array(z.object({ question: z.string(), invented_identifier: z.string() })) });
const fmt = (schema: z.ZodType, name: string) => JSON.parse(JSON.stringify(zodResponseFormat(schema, name)));

export const DRAFT_MODEL_TEMPERATURE = 0;

export function request(model: string, system: string, user: string, schema: z.ZodType, name: string, maxTokens = 300): LlmRequest {
  return {
    model,
    temperature: DRAFT_MODEL_TEMPERATURE,
    max_completion_tokens: maxTokens,
    response_format: fmt(schema, name),
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  };
}

export const SYSTEM =
  "You write evaluation questions for a documentation search system. Write what a real developer would type: one short, specific question, no preamble, no quotes, no answer.";

/** Identifiers worth asking about: CamelCase, snake_case or dotted names, 5+ chars, from inline code or code. */
export function identifiersIn(text: string): string[] {
  const found = text.match(/\b(?:[A-Z][a-z0-9]+[A-Z][A-Za-z0-9]*|[a-z][a-z0-9]*_[a-z0-9_]+|[a-z]+\.[a-z_]+[a-z0-9_.]*)\b/g) ?? [];
  return [...new Set(found.filter((t) => t.length >= 5 && !/^(e\.g|i\.e)/.test(t)))];
}

/** Lowercased words that make a heading distinctive: 6+ letters. A paraphrase may not reuse them. */
export function bannedWords(c: Chunk): string[] {
  return [...new Set(`${c.title} ${c.heading}`.toLowerCase().match(/[a-z]{6,}/g) ?? [])];
}

export const proseShare = (t: string) => {
  const code = (t.match(/```[\s\S]*?```/g) ?? []).join("").length;
  return 1 - code / Math.max(1, t.length);
};

export const short = (t: string, n = 1800) => (t.length > n ? `${t.slice(0, n)}…` : t);

/**
 * Drafts the whole set. Deterministic: seeded sampling, temperature 0, and a cached model client.
 * Candidates that break a rejection rule are skipped and the next seed is tried.
 */
export async function draftQuestions(llm: LlmClient, model: string, pools: Pools, seed = 7, log: (s: string) => void = () => {}): Promise<DraftQuestion[]> {
  const rng = mulberry32(seed);
  const out: DraftQuestion[] = [];
  const usedSeeds = new Set<string>();
  const seen = new Set<string>();
  const nextId = () => `q${String(out.length + 1).padStart(3, "0")}`;
  const ask = async (req: LlmRequest) => {
    const res = await llm.complete(req);
    return res.content ? JSON.parse(res.content) : null;
  };
  const keep = (d: Omit<DraftQuestion, "id">) => {
    const key = d.question.toLowerCase().replace(/\W+/g, " ").trim();
    if (seen.has(key)) return false;
    seen.add(key);
    out.push({ id: nextId(), ...d });
    return true;
  };

  for (const step of PLAN) {
    let made = 0;
    if (step.cls === "unanswerable") {
      const pool = pools[step.ask as "langchain" | "cookbook"];
      const vocab = new Set(pool.flatMap((c) => tokenize(`${c.heading}\n${c.text}`)));
      const titles = [...new Set(pool.map((c) => c.title))].slice(0, 60).join("; ");
      const r = await ask(
        request(
          model,
          SYSTEM,
          `These are page titles of a documentation set: ${titles}.\n\nWrite ${step.n * 2} questions a developer might ask about features that sound plausible for this library but do NOT exist. Each question must name one invented function, class, parameter or setting (invented_identifier) that does not appear in the docs. Vary topics.`,
          MANY,
          "invented_questions",
          2500,
        ),
      );
      for (const it of (r?.items ?? []) as { question: string; invented_identifier: string }[]) {
        if (made >= step.n) break;
        const parts = tokenize(it.invented_identifier);
        // Rejection rule: the whole invented identifier must not exist in the workspace's index.
        if (!parts.length || vocab.has(parts[0])) {
          log(`reject unanswerable (exists): ${it.invented_identifier}`);
          continue;
        }
        if (keep({ workspaceId: step.ask, question: it.question.trim(), queryClass: "unanswerable", seedChunkId: null, seedWorkspaceId: null, identifier: it.invented_identifier }))
          made++;
      }
      if (made < step.n) log(`only ${made}/${step.n} unanswerable for ${step.ask}`);
      continue;
    }

    const source = pools[step.seedFrom as "langchain" | "cookbook"];
    let candidates = shuffle(source, rng).filter((c) => !usedSeeds.has(c.chunkId) && c.text.length >= 250);
    if (step.cls === "version_new") candidates = candidates.filter((c) => pools.newDocIds.has(c.documentId));
    if (step.cls === "paraphrase" || step.cls === "cross_workspace") candidates = candidates.filter((c) => proseShare(c.text) > 0.6);
    const idCount = new Map<string, number>();
    if (step.cls === "exact_id") for (const c of source) for (const id of identifiersIn(c.text)) idCount.set(id, (idCount.get(id) ?? 0) + 1);

    for (const c of candidates) {
      if (made >= step.n) break;
      const passage = `${c.title} > ${c.heading}\n\n${short(c.text)}`;
      let q: string | null = null;
      let identifier: string | null = null;
      if (step.cls === "exact_id") {
        identifier = identifiersIn(c.text).find((id) => (idCount.get(id) ?? 0) <= 5) ?? null;
        if (!identifier) continue;
        q = (await ask(request(model, SYSTEM, `Passage:\n${passage}\n\nWrite one question that names \`${identifier}\` exactly and is answered by this passage.`, ONE_Q, "question")))?.question ?? null;
        if (q && !q.includes(identifier)) {
          log(`reject exact_id (identifier missing): ${q}`);
          continue;
        }
      } else {
        const banned = bannedWords(c);
        q = (await ask(request(model, SYSTEM, `Passage:\n${passage}\n\nWrite one question this passage answers. Use your own words: do not use any of these words: ${banned.join(", ") || "(none)"}.`, ONE_Q, "question")))?.question ?? null;
        if (q && step.cls === "paraphrase" && banned.some((w) => q!.toLowerCase().includes(w))) {
          log(`reject paraphrase (copied heading word): ${q}`);
          continue;
        }
      }
      if (!q) continue;
      usedSeeds.add(c.chunkId);
      if (keep({ workspaceId: step.ask, question: q.trim(), queryClass: step.cls, seedChunkId: c.chunkId, seedWorkspaceId: c.workspaceId, identifier })) made++;
    }
    if (made < step.n) log(`only ${made}/${step.n} ${step.cls} for ${step.ask}`);
  }
  return out;
}
