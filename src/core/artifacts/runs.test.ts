import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, test } from "vitest";
import { sha256Hex } from "../corpus/sources";
import { guardRun } from "./guard";
import type { RunManifest } from "./manifest";
import { listRuns, readRunFile, runId, runLabel, runsDir, writeRunFolder } from "./runs";

const when = new Date("2026-11-03T10:15:30.123Z");

test("run id and label", () => {
  expect(runId(when, "holdout")).toBe("20261103T101530Z-holdout");
  expect(runLabel("retrieval", "holdout", when)).toBe("Holdout · retrieval · 3 Nov 2026 10:15 UTC");
});

test("a written run lists newest first and its checksums verify", () => {
  const dataDir = mkdtempSync(path.join(tmpdir(), "atlas-runs-"));
  const m = (id: string, created: string) =>
    ({
      run_id: id, kind: "retrieval", label: "l", created_at_utc: created, split: "tuning", sample_count: 1, labels: "llm_draft_pending_review",
      methods: ["bm25"], embed_model: "e", answer_model: null, prompt_version: null, prompt_sha: null, index_versions: { langchain: 2 },
      questions_sha256: "a".repeat(64), chunks_sha256: "b".repeat(64), git_sha: "c".repeat(40), git_dirty: false, allow_dirty: false,
      replay: true, cache_hits: 1, cache_misses: 0,
    }) satisfies RunManifest;
  for (const [id, at] of [["r1", "2026-11-01"], ["r2", "2026-11-02"]]) {
    writeRunFolder(path.join(runsDir(dataDir, "retrieval"), id), { "run_manifest.json": JSON.stringify(m(id, at)), "scores.json": "{}" });
  }
  expect(listRuns(dataDir, "retrieval").map((r) => r.id)).toEqual(["r2", "r1"]);
  const sums = readFileSync(path.join(runsDir(dataDir, "retrieval"), "r1", "checksums.txt"), "utf8");
  expect(sums).toContain(`${sha256Hex("{}")}  scores.json`);
  expect(readRunFile(dataDir, "retrieval", "../r1", "scores.json")).toBeNull();
  expect(readRunFile(dataDir, "retrieval", "r1", "scores.json")).toBe("{}");
});

test("holdout runs need a committed guide and a clean tree", () => {
  expect(() => guardRun("holdout", { git_sha: "x", git_dirty: false, preregistration_sha: null }, false)).toThrow(/labeling_guide/);
  expect(() => guardRun("holdout", { git_sha: "x", git_dirty: true, preregistration_sha: "y" }, false)).toThrow(/uncommitted/);
  expect(() => guardRun("tuning", { git_sha: "x", git_dirty: true, preregistration_sha: null }, false)).not.toThrow();
});
