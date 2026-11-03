import path from "node:path";
import { parseArgs } from "node:util";
import type { RunManifest } from "@/core/artifacts/manifest";
import { runId, runLabel, runsDir, writeRunFolder } from "@/core/artifacts/runs";
import { Split } from "@/core/domain/schemas";
import { CachingEmbedder } from "@/core/embeddings/cache";
import { runIdentity } from "@/core/eval/context";
import { METHODS, runRetrieval, scoreRetrieval } from "@/core/eval/retrieval";
import { readJsonl } from "@/core/dataset/jsonl";
import { LabeledCase } from "@/core/evalset/questions";
import { SearchService } from "@/core/search/service";
import { openStore } from "@/core/store/open";
import { MemoryVectorStore } from "@/core/vectors/memory";
import type { Command } from "../deps";
import { EXIT } from "../exit";

/** atlas eval --split tuning|holdout [--allow-dirty]: retrieval run -> runs/retrieval/<run-id>/ */
export const evalRetrieval: Command = async (argv, deps) => {
  const { values } = parseArgs({ args: argv, options: { split: { type: "string" }, "allow-dirty": { type: "boolean", default: false } } });
  const split = Split.safeParse(values.split);
  if (!split.success) {
    deps.err("usage: atlas eval --split tuning|holdout [--allow-dirty]");
    return EXIT.USAGE;
  }
  const questionsFile = path.join(deps.dataDir, "fixtures", "eval", "questions.jsonl");
  const cases = readJsonl(questionsFile, LabeledCase).filter((c) => c.split === split.data);
  const store = openStore(deps.dataDir);
  try {
    const identity = runIdentity({ store, questionsFile, cases, split: split.data, allowDirty: values["allow-dirty"]!, cwd: deps.dataDir });
    const embedder = deps.makeEmbedder();
    const search = new SearchService(store, embedder, new MemoryVectorStore());
    const results = await runRetrieval(cases, search);
    const scores = scoreRetrieval(results);
    const now = deps.now();
    const id = runId(now, split.data);
    const stats = embedder instanceof CachingEmbedder ? embedder.stats : { hits: 0, misses: 0 };
    const manifest: RunManifest = {
      run_id: id, kind: "retrieval", label: runLabel("retrieval", split.data, now), created_at_utc: now.toISOString(),
      split: split.data, sample_count: results.length, methods: METHODS, embed_model: embedder.model, answer_model: null,
      prompt_version: null, prompt_sha: null, ...identity, replay: deps.replay, cache_hits: stats.hits, cache_misses: stats.misses,
    };
    writeRunFolder(path.join(runsDir(deps.dataDir, "retrieval"), id), {
      "run_manifest.json": JSON.stringify(manifest, null, 2) + "\n",
      "per_question.jsonl": results.map((r) => JSON.stringify(r)).join("\n") + "\n",
      "scores.json": JSON.stringify(scores, null, 2) + "\n",
    });
    const f = (x: number) => x.toFixed(3);
    for (const m of METHODS) {
      const o = scores.overall[m];
      deps.out(`${m.padEnd(6)} recall@5 ${f(o["recall@5"].point)} [${f(o["recall@5"].lo)}, ${f(o["recall@5"].hi)}]  mrr@10 ${f(o["mrr@10"].point)}`);
    }
    deps.out(`${id}: ${results.length} questions, labels ${manifest.labels}`);
    return EXIT.OK;
  } finally {
    store.close();
  }
};
