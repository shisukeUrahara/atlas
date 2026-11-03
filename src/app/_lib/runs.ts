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
}

/** Newest committed runs of one split. Every number on the Evaluation page comes from here. */
export function loadEval(split: "tuning" | "holdout"): EvalView {
  const d = dataDir();
  const r = listRuns(d, "retrieval").find((x) => x.manifest.split === split);
  const a = listRuns(d, "answers").find((x) => x.manifest.split === split);
  return {
    split,
    retrieval: r ? { manifest: r.manifest, scores: JSON.parse(readRunFile(d, "retrieval", r.id, "scores.json")!), cases: jsonl(readRunFile(d, "retrieval", r.id, "per_question.jsonl")) } : null,
    answers: a ? { manifest: a.manifest, scores: JSON.parse(readRunFile(d, "answers", a.id, "scores.json")!), cases: jsonl(readRunFile(d, "answers", a.id, "per_question.jsonl")) } : null,
  };
}

export const LABEL_TEXT: Record<RunManifest["labels"], string> = {
  llm_draft_pending_review: "Labels: LLM-drafted, pending owner review",
  partly_reviewed: "Labels: partly owner-reviewed",
  owner_reviewed: "Labels: owner-reviewed",
};
