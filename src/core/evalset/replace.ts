import { z } from "zod";
import { mulberry32, shuffle } from "../dataset/rng";
import type { Chunk } from "../domain/schemas";
import type { LlmClient } from "../llm/port";
import { tokenize } from "../retrieval/tokenize";
import type { SearchService } from "../search/service";
import { bannedWords, type DraftQuestion, MANY, ONE_Q, type Pools, proseShare, request, short, SYSTEM } from "./draft";
import { judgeQuestion, type Judgment } from "./judge";

export const Rejected = z.object({ id: z.string(), question: z.string(), queryClass: z.string(), reason: z.string() });
export type Rejected = z.infer<typeof Rejected>;

/**
 * Abstain-class questions (unanswerable, cross_workspace) must have no answer in the asked workspace.
 * Any that the judge says are answered there are replaced, at the same id, by new drafts that the
 * judge confirms have no answering chunk. The replaced ones are returned for the record.
 */
export async function replaceFlagged(
  drafts: DraftQuestion[],
  judgments: Judgment[],
  pools: Pools,
  search: SearchService,
  llm: LlmClient,
  model: string,
  log: (s: string) => void = () => {},
): Promise<{ drafts: DraftQuestion[]; judgments: Judgment[]; rejected: Rejected[] }> {
  const jById = new Map(judgments.map((j) => [j.id, j]));
  const rejected: Rejected[] = [];
  const used = new Set(drafts.map((d) => d.seedChunkId).filter(Boolean) as string[]);
  const seenQ = new Set(drafts.map((d) => d.question.toLowerCase()));
  const rng = mulberry32(11);
  const out = [...drafts];

  const flagged = out.filter((d) => (d.queryClass === "unanswerable" || d.queryClass === "cross_workspace") && (jById.get(d.id)?.judged.length ?? 0) > 0);
  // Candidate queues per (class, asked workspace), filled lazily.
  const queues = new Map<string, Omit<DraftQuestion, "id">[]>();
  let round = 0;

  async function refill(d: DraftQuestion) {
    const key = `${d.queryClass}/${d.workspaceId}`;
    const ask = d.workspaceId as "langchain" | "cookbook";
    if (d.queryClass === "cross_workspace") {
      const other = (ask === "langchain" ? pools.cookbook : pools.langchain) as Chunk[];
      const seeds = shuffle(other, rng).filter((c) => !used.has(c.chunkId) && c.text.length >= 250 && proseShare(c.text) > 0.6).slice(0, 6);
      const items: Omit<DraftQuestion, "id">[] = [];
      for (const c of seeds) {
        used.add(c.chunkId);
        const r = await llm.complete(
          request(model, SYSTEM, `Passage:\n${c.title} > ${c.heading}\n\n${short(c.text)}\n\nWrite one question this passage answers, specific to what only this passage covers (its example, dataset or exact procedure). Do not use these words: ${bannedWords(c).join(", ") || "(none)"}.`, ONE_Q, "question"),
        );
        const q = r.content ? (JSON.parse(r.content) as { question: string }).question.trim() : "";
        if (q) items.push({ workspaceId: ask, question: q, queryClass: "cross_workspace", seedChunkId: c.chunkId, seedWorkspaceId: c.workspaceId, identifier: null });
      }
      queues.set(key, [...(queues.get(key) ?? []), ...items]);
    } else {
      const pool = pools[ask];
      const vocab = new Set(pool.flatMap((c) => tokenize(`${c.heading}\n${c.text}`)));
      const titles = [...new Set(pool.map((c) => c.title))].slice(0, 60).join("; ");
      round++;
      const r = await llm.complete(
        request(model, SYSTEM, `These are page titles of a documentation set: ${titles}.\n\nWrite 12 questions about features that do NOT exist in this library and that its docs could not answer even partly: name one invented function, class, parameter or setting each (invented_identifier), about a capability unrelated to anything the titles cover. Batch ${round}.`, MANY, "invented_questions", 1500),
      );
      const items = ((r.content ? JSON.parse(r.content).items : []) as { question: string; invented_identifier: string }[])
        .filter((it) => {
          const parts = tokenize(it.invented_identifier);
          return parts.length && !vocab.has(parts[0]);
        })
        .map((it) => ({ workspaceId: ask, question: it.question.trim(), queryClass: "unanswerable" as const, seedChunkId: null, seedWorkspaceId: null, identifier: it.invented_identifier }));
      queues.set(key, [...(queues.get(key) ?? []), ...items]);
    }
  }

  for (const d of flagged) {
    rejected.push({ id: d.id, question: d.question, queryClass: d.queryClass, reason: `judge found an answering chunk in ${d.workspaceId}` });
    const key = `${d.queryClass}/${d.workspaceId}`;
    let replaced = false;
    for (let attempts = 0; attempts < 6 && !replaced; attempts++) {
      if (!(queues.get(key)?.length)) await refill(d);
      const cand = queues.get(key)?.shift();
      if (!cand) continue;
      if (seenQ.has(cand.question.toLowerCase())) continue;
      seenQ.add(cand.question.toLowerCase());
      const trial: DraftQuestion = { id: d.id, ...cand };
      const j = await judgeQuestion(trial, search, llm, model);
      if (j.judged.length) {
        rejected.push({ id: d.id, question: cand.question, queryClass: cand.queryClass, reason: `replacement also answered in ${d.workspaceId}` });
        continue;
      }
      out[out.findIndex((x) => x.id === d.id)] = trial;
      jById.set(d.id, j);
      replaced = true;
    }
    if (!replaced) log(`could not replace ${d.id}; it stays flagged`);
  }
  return { drafts: out, judgments: [...jById.values()].sort((a, b) => (a.id < b.id ? -1 : 1)), rejected };
}
