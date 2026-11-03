import type { RunManifest } from "@/core/artifacts/manifest";
import { listRuns, readRunFile } from "@/core/artifacts/runs";
import { loadEnv } from "@/core/env";
import type { AnswerRecord } from "@/core/eval/answers";
import type { RetrievalCase, RetrievalScores } from "@/core/eval/retrieval";
import type { AnswerSummary } from "@/core/metrics/answers";

const dataDir = () => loadEnv(process.env).dataDir;
const jsonl = <T,>(s: string | null): T[] => (s ? s.trim().split("\n").map((l) => JSON.parse(l) as T) : []);

export interface EvalView {
  split: "tuning" | "holdout";
  retrieval: { manifest: RunManifest; scores: RetrievalScores; cases: RetrievalCase[] } | null;
  answers: { manifest: RunManifest; scores: { overall: AnswerSummary; byClass: Record<string, AnswerSummary> }; cases: AnswerRecord[] } | null;
  /**
   * Latency and cost come from the newest LIVE answer run of the split. A replayed run reads model replies from the
   * cache, so its timings measure the cache, not the model.
   */
  timing: { runId: string; summary: AnswerSummary } | null;
}

/** Newest committed runs of one split. Every number on the Evaluation page comes from here. */
export function loadEval(split: "tuning" | "holdout"): EvalView {
  const d = dataDir();
  const r = listRuns(d, "retrieval").find((x) => x.manifest.split === split);
  const a = listRuns(d, "answers").find((x) => x.manifest.split === split);
  const live = listRuns(d, "answers").find((x) => x.manifest.split === split && !x.manifest.replay);
  return {
    split,
    retrieval: r ? { manifest: r.manifest, scores: JSON.parse(readRunFile(d, "retrieval", r.id, "scores.json")!), cases: jsonl(readRunFile(d, "retrieval", r.id, "per_question.jsonl")) } : null,
    answers: a ? { manifest: a.manifest, scores: JSON.parse(readRunFile(d, "answers", a.id, "scores.json")!), cases: jsonl(readRunFile(d, "answers", a.id, "per_question.jsonl")) } : null,
    timing: live ? { runId: live.id, summary: JSON.parse(readRunFile(d, "answers", live.id, "scores.json")!).overall } : null,
  };
}

export const LABEL_TEXT: Record<RunManifest["labels"], string> = {
  llm_draft_pending_review: "Labels: LLM-drafted, pending owner review",
  partly_reviewed: "Labels: partly reviewed",
  model_reviewed: "Labels: LLM-drafted, cross-checked by a second model (Claude), not hand-checked",
  owner_reviewed: "Labels: owner-reviewed",
};
