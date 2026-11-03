import type { AnswerService } from "../answer/service";
import type { LabeledCase } from "../evalset/questions";
import type { AnswerCase } from "../metrics/answers";
import type { Store } from "../store/sqlite";

export interface AnswerRecord extends AnswerCase {
  question: string;
  workspaceId: string;
  abstainReason: string | null;
  failure: string | null;
  claims: { text: string; chunkIds: string[] }[];
  cached: boolean;
}

/**
 * Runs the full answer pipeline on every question of a split. Leaks are checked independently:
 * a cited chunk must exist in the asked workspace's own index.
 */
export async function runAnswers(
  cases: readonly LabeledCase[],
  answers: AnswerService,
  store: Store,
  costOf: (usage: { prompt_tokens: number; completion_tokens: number }) => number,
): Promise<AnswerRecord[]> {
  const out: AnswerRecord[] = [];
  for (const c of cases.filter((x) => x.review !== "dropped")) {
    const r = await answers.answer(c.workspaceId, c.question);
    const cited = [...new Set(r.claims.flatMap((cl) => cl.chunkIds))];
    out.push({
      id: c.id,
      queryClass: c.queryClass,
      question: c.question,
      workspaceId: c.workspaceId,
      status: r.status,
      abstainReason: r.abstainReason,
      failure: r.failure,
      goldChunkIds: c.goldChunkIds,
      citedChunkIds: cited,
      claims: r.claims.map((cl) => ({ text: cl.text, chunkIds: cl.chunkIds })),
      claimsShown: r.claims.length,
      claimsDropped: r.dropped.length,
      leakedChunkIds: cited.filter((id) => store.chunk(c.workspaceId, id) === null),
      latencyMs: r.stages.reduce((n, s) => n + s.ms, 0),
      costUsd: r.usage ? costOf(r.usage) : 0,
      cached: r.cached,
    });
  }
  return out;
}
