import { readFileSync } from "node:fs";
import { repoState } from "../artifacts/git";
import { guardRun } from "../artifacts/guard";
import type { RunManifest } from "../artifacts/manifest";
import { sha256Hex } from "../corpus/sources";
import type { Split } from "../domain/schemas";
import type { LabeledCase } from "../evalset/questions";
import type { Store } from "../store/sqlite";

/** Label status of the scored questions, for the manifest and every page that shows a number. */
export function labelsStatus(cases: readonly LabeledCase[]): RunManifest["labels"] {
  const live = cases.filter((c) => c.review !== "dropped");
  const pending = live.filter((c) => c.review === "pending").length;
  if (pending === live.length) return "llm_draft_pending_review";
  if (pending > 0) return "partly_reviewed";
  return live.every((c) => c.labelSource === "owner") ? "owner_reviewed" : "model_reviewed";
}

/** The run-identity fields shared by retrieval and answer runs. Throws if a holdout run is not allowed. */
export function runIdentity(opts: {
  store: Store;
  questionsFile: string;
  cases: readonly LabeledCase[];
  split: Split;
  allowDirty: boolean;
  cwd: string;
}): Pick<RunManifest, "labels" | "index_versions" | "questions_sha256" | "chunks_sha256" | "git_sha" | "git_dirty" | "allow_dirty"> {
  const state = repoState(opts.cwd);
  guardRun(opts.split, state, opts.allowDirty);
  const workspaces = [...new Set(opts.cases.map((c) => c.workspaceId))].sort();
  const ids = workspaces.flatMap((w) => opts.store.chunks(w).map((c) => `${w}:${c.chunkId}`)).sort();
  return {
    labels: labelsStatus(opts.cases),
    index_versions: Object.fromEntries(workspaces.map((w) => [w, opts.store.indexVersion(w)])),
    questions_sha256: sha256Hex(readFileSync(opts.questionsFile)),
    chunks_sha256: sha256Hex(ids.join("\n")),
    git_sha: state.git_sha,
    git_dirty: state.git_dirty,
    allow_dirty: opts.allowDirty,
  };
}
