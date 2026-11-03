import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import type { Chunk, WorkspaceId } from "../domain/schemas";
import type { LlmClient } from "../llm/port";
import type { SearchService } from "../search/service";
import type { DraftQuestion } from "./draft";

export const POOL_DEPTH = 10;

export const Judgment = z.object({
  id: z.string(),
  /** Union of BM25, Dense and Hybrid top 10, in first-seen order. */
  pool: z.array(z.string()),
  /** Pool chunks the judge says state the answer. */
  judged: z.array(z.string()),
});
export type Judgment = z.infer<typeof Judgment>;

const VERDICT = z.object({ relevant: z.array(z.number().int()) });
const responseFormat = () => JSON.parse(JSON.stringify(zodResponseFormat(VERDICT, "relevant_passages")));

const SYSTEM = `You label search results for an evaluation set.
A passage is relevant only if it states the answer to the question (or the exact thing asked about).
A passage that merely mentions the same words is not relevant. If none is relevant, return an empty list.`;

/** Pools the three methods' top results and asks the judge which ones state the answer. */
export async function judgeQuestion(q: DraftQuestion, search: SearchService, llm: LlmClient, model: string): Promise<Judgment> {
  const { results } = await search.search(q.workspaceId as WorkspaceId, q.question, ["bm25", "dense", "hybrid"], POOL_DEPTH);
  const byId = new Map<string, Chunk>();
  for (const r of results) for (const h of r.hits) if (!byId.has(h.chunk.chunkId)) byId.set(h.chunk.chunkId, h.chunk);
  const pool = [...byId.values()];
  const list = pool.map((c, i) => `[${i + 1}] ${c.title} > ${c.heading}\n${c.text.slice(0, 1200)}`).join("\n\n---\n\n");
  const res = await llm.complete({
    model,
    temperature: 0,
    max_completion_tokens: 200,
    response_format: responseFormat(),
    messages: [
      { role: "system", content: SYSTEM },
      { role: "user", content: `Question: ${q.question}\n\nPassages:\n\n${list}\n\nReturn the numbers of the relevant passages.` },
    ],
  });
  const verdict = res.content ? VERDICT.safeParse(JSON.parse(res.content)) : null;
  const picked = verdict?.success ? verdict.data.relevant : [];
  const judged = [...new Set(picked.filter((n) => n >= 1 && n <= pool.length).map((n) => pool[n - 1].chunkId))];
  return { id: q.id, pool: pool.map((c) => c.chunkId), judged };
}

/**
 * Draft gold set: judged chunks plus the seed chunk when it lives in the asked workspace.
 * unanswerable / cross_workspace have no gold by definition; a judged chunk there flags the question for review.
 */
export function draftGold(q: DraftQuestion, j: Judgment): { gold: string[]; flag: string | null } {
  if (q.queryClass === "unanswerable" || q.queryClass === "cross_workspace") {
    return { gold: [], flag: j.judged.length ? `judge found ${j.judged.length} answering chunk(s) in ${q.workspaceId}` : null };
  }
  const gold = [...new Set([...(q.seedChunkId && q.seedWorkspaceId === q.workspaceId ? [q.seedChunkId] : []), ...j.judged])];
  return { gold, flag: j.judged.length === 0 ? "judge found no answering chunk in the pool (seed kept)" : null };
}
