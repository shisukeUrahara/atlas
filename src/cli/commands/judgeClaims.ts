import { writeFileSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { listRuns, readRunFile } from "@/core/artifacts/runs";
import { readJsonl, writeJsonl } from "@/core/dataset/jsonl";
import type { AnswerRecord } from "@/core/eval/answers";
import { ClaimJudgment, judgeClaims, supportRate } from "@/core/eval/claims";
import { openStore } from "@/core/store/open";
import type { Command } from "../deps";
import { EXIT } from "../exit";

const esc = (raw: string) => {
  const v = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  return /[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
};

/**
 * atlas judge-claims [--run <answers run id>]: LLM verdict per shown claim (default: newest answers run).
 * Appends to fixtures/eval/claim_support.jsonl and writes fixtures/eval/claims_review.csv for the owner.
 */
export const judgeClaimsCmd: Command = async (argv, deps) => {
  const { values } = parseArgs({ args: argv, options: { run: { type: "string" } } });
  const runId = values.run ?? listRuns(deps.dataDir, "answers")[0]?.id;
  const body = runId ? readRunFile(deps.dataDir, "answers", runId, "per_question.jsonl") : null;
  if (!runId || !body) {
    deps.err("no answers run found; run atlas eval-answers first");
    return EXIT.USAGE;
  }
  const records = body.trim().split("\n").map((l) => JSON.parse(l) as AnswerRecord);
  const store = openStore(deps.dataDir);
  try {
    const file = path.join(deps.dataDir, "fixtures", "eval", "claim_support.jsonl");
    const kept = readJsonl(file, ClaimJudgment).filter((j) => j.runId !== runId);
    const fresh = await judgeClaims(runId, records, store, deps.makeLlm(), deps.model);
    writeJsonl(file, [...kept, ...fresh]);
    const csv = ["run,question,claim_index,claim,chunk_ids,llm_verdict,owner_verdict", ...fresh.map((j) => [j.runId, j.questionId, String(j.claimIndex), j.claim, j.chunkIds.join(" "), j.verdict, ""].map(esc).join(","))];
    writeFileSync(path.join(deps.dataDir, "fixtures", "eval", "claims_review.csv"), csv.join("\n") + "\n");
    const s = supportRate(fresh);
    const pct = (x: number) => `${(x * 100).toFixed(1)}%`;
    deps.out(`${runId}: ${s.n} claims · supported ${pct(s.supported)} · partial ${pct(s.partial)} · unsupported ${pct(s.unsupported)} (LLM-judged, pending owner review)`);
    return EXIT.OK;
  } finally {
    store.close();
  }
};
