import type { QueryClass } from "../domain/schemas";

export const ANSWERABLE: readonly QueryClass[] = ["exact_id", "paraphrase", "version_new"];
export const ABSTAIN: readonly QueryClass[] = ["unanswerable", "cross_workspace"];

/** One question's answer, reduced to what the metrics need. */
export interface AnswerCase {
  id: string;
  queryClass: QueryClass;
  status: "answered" | "abstained" | "failed";
  goldChunkIds: string[];
  /** Chunk ids cited by the claims that were shown. */
  citedChunkIds: string[];
  claimsShown: number;
  claimsDropped: number;
  /** Cited chunks that do not belong to the asked workspace. Must be 0. */
  leakedChunkIds: string[];
  latencyMs: number;
  costUsd: number;
}

/** Answerable questions should be answered; abstain-class questions should end in "Not enough evidence". */
export function rightOutcome(c: AnswerCase): boolean {
  return ABSTAIN.includes(c.queryClass) ? c.status === "abstained" : c.status === "answered";
}

/** Answered and at least one cited chunk is a labeled gold chunk. */
export function goldCited(c: AnswerCase): boolean {
  return c.status === "answered" && c.citedChunkIds.some((id) => c.goldChunkIds.includes(id));
}

export function percentile(xs: readonly number[], q: number): number {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const pos = (s.length - 1) * q;
  const i = Math.floor(pos);
  return i + 1 < s.length ? s[i] + (pos - i) * (s[i + 1] - s[i]) : s[i];
}

export interface AnswerSummary {
  n: number;
  rightOutcome: number;
  /** Abstain-class questions that ended in "Not enough evidence". */
  abstainRecall: number;
  /** Answerable questions wrongly abstained. */
  falseAbstain: number;
  /** Shown claims / drafted claims, over answered questions. */
  citedClaimRate: number;
  /** Answerable + answered questions that cite a gold chunk. */
  goldCitedRate: number;
  leaks: number;
  failed: number;
  p50Ms: number;
  p95Ms: number;
  costUsd: number;
}

const rate = (num: number, den: number) => (den ? num / den : 0);

export function summarizeAnswers(cases: readonly AnswerCase[]): AnswerSummary {
  const abst = cases.filter((c) => ABSTAIN.includes(c.queryClass));
  const ans = cases.filter((c) => ANSWERABLE.includes(c.queryClass));
  const answered = cases.filter((c) => c.status === "answered");
  const shown = answered.reduce((n, c) => n + c.claimsShown, 0);
  const drafted = answered.reduce((n, c) => n + c.claimsShown + c.claimsDropped, 0);
  const ansAnswered = ans.filter((c) => c.status === "answered");
  return {
    n: cases.length,
    rightOutcome: rate(cases.filter(rightOutcome).length, cases.length),
    abstainRecall: rate(abst.filter((c) => c.status === "abstained").length, abst.length),
    falseAbstain: rate(ans.filter((c) => c.status === "abstained").length, ans.length),
    citedClaimRate: rate(shown, drafted),
    goldCitedRate: rate(ansAnswered.filter(goldCited).length, ansAnswered.length),
    leaks: cases.reduce((n, c) => n + c.leakedChunkIds.length, 0),
    failed: cases.filter((c) => c.status === "failed").length,
    p50Ms: percentile(cases.map((c) => c.latencyMs), 0.5),
    p95Ms: percentile(cases.map((c) => c.latencyMs), 0.95),
    costUsd: cases.reduce((n, c) => n + c.costUsd, 0),
  };
}
