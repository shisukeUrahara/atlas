import path from "node:path";
import { parseArgs } from "node:util";
import { promptSha, PROMPT_VERSION } from "@/core/answer/prompt";
import { AnswerService } from "@/core/answer/service";
import type { RunManifest } from "@/core/artifacts/manifest";
import { runId, runLabel, runsDir, writeRunFolder } from "@/core/artifacts/runs";
import { actualUsd, loadPricing } from "@/core/cost/pricing";
import { readJsonl } from "@/core/dataset/jsonl";
import { Split } from "@/core/domain/schemas";
import { runAnswers } from "@/core/eval/answers";
import { runIdentity } from "@/core/eval/context";
import { LabeledCase } from "@/core/evalset/questions";
import { CachingLlm } from "@/core/llm/cache";
import { summarizeAnswers } from "@/core/metrics/answers";
import { SearchService } from "@/core/search/service";
import { openStore } from "@/core/store/open";
import { MemoryVectorStore } from "@/core/vectors/memory";
import type { Command } from "../deps";
import { EXIT } from "../exit";

/** atlas eval-answers --split tuning|holdout [--allow-dirty]: answer run -> runs/answers/<run-id>/ */
export const evalAnswers: Command = async (argv, deps) => {
  const { values } = parseArgs({ args: argv, options: { split: { type: "string" }, "allow-dirty": { type: "boolean", default: false } } });
  const split = Split.safeParse(values.split);
  if (!split.success) {
    deps.err("usage: atlas eval-answers --split tuning|holdout [--allow-dirty]");
    return EXIT.USAGE;
  }
  const questionsFile = path.join(deps.dataDir, "fixtures", "eval", "questions.jsonl");
  const cases = readJsonl(questionsFile, LabeledCase).filter((c) => c.split === split.data);
  const pricing = loadPricing(path.join(deps.dataDir, "pricing.json"));
  const store = openStore(deps.dataDir);
  try {
    const identity = runIdentity({ store, questionsFile, cases, split: split.data, allowDirty: values["allow-dirty"]!, cwd: deps.dataDir });
    const embedder = deps.makeEmbedder();
    const llm = deps.makeLlm();
    const answers = new AnswerService(new SearchService(store, embedder, new MemoryVectorStore()), llm, deps.model);
    const records = await runAnswers(cases, answers, store, (u) => actualUsd(pricing, deps.model, u));
    const summary = summarizeAnswers(records);
    const now = deps.now();
    const id = runId(now, split.data);
    const stats = llm instanceof CachingLlm ? llm.stats : { hits: 0, misses: 0 };
    const manifest: RunManifest = {
      run_id: id, kind: "answers", label: runLabel("answers", split.data, now), created_at_utc: now.toISOString(), split: split.data,
      sample_count: records.length, methods: ["hybrid"], embed_model: embedder.model, answer_model: deps.model,
      prompt_version: PROMPT_VERSION, prompt_sha: promptSha(), ...identity, replay: deps.replay, cache_hits: stats.hits, cache_misses: stats.misses,
    };
    const byClass = Object.fromEntries(
      [...new Set(records.map((r) => r.queryClass))].sort().map((cls) => [cls, summarizeAnswers(records.filter((r) => r.queryClass === cls))]),
    );
    writeRunFolder(path.join(runsDir(deps.dataDir, "answers"), id), {
      "run_manifest.json": JSON.stringify(manifest, null, 2) + "\n",
      "per_question.jsonl": records.map((r) => JSON.stringify(r)).join("\n") + "\n",
      "scores.json": JSON.stringify({ overall: summary, byClass, pricing_retrieved_at: pricing.retrieved_at }, null, 2) + "\n",
    });
    const pct = (x: number) => `${(x * 100).toFixed(1)}%`;
    deps.out(
      `right outcome ${pct(summary.rightOutcome)} · abstain recall ${pct(summary.abstainRecall)} · false abstain ${pct(summary.falseAbstain)} · cited claims ${pct(summary.citedClaimRate)} · gold cited ${pct(summary.goldCitedRate)} · leaks ${summary.leaks} · failed ${summary.failed}`,
    );
    deps.out(`p50 ${summary.p50Ms.toFixed(0)} ms · p95 ${summary.p95Ms.toFixed(0)} ms · cost $${summary.costUsd.toFixed(4)} · ${id} (${records.length} questions, labels ${manifest.labels})`);
    return EXIT.OK;
  } finally {
    store.close();
  }
};
