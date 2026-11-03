import path from "node:path";
import { readJsonl, writeJsonl } from "@/core/dataset/jsonl";
import { DraftQuestion } from "@/core/evalset/draft";
import { judgeQuestion, type Judgment } from "@/core/evalset/judge";
import { SearchService } from "@/core/search/service";
import { openStore } from "@/core/store/open";
import { MemoryVectorStore } from "@/core/vectors/memory";
import type { Command } from "../deps";
import { EXIT } from "../exit";

/** atlas judge-pool: pools BM25/Dense/Hybrid top 10 per question and writes fixtures/eval/judgments.jsonl. */
export const judgePool: Command = async (_argv, deps) => {
  const dir = path.join(deps.dataDir, "fixtures", "eval");
  const drafts = readJsonl(path.join(dir, "drafts.jsonl"), DraftQuestion);
  const store = openStore(deps.dataDir);
  try {
    const search = new SearchService(store, deps.makeEmbedder(), new MemoryVectorStore());
    const llm = deps.makeLlm();
    const out: Judgment[] = [];
    for (const q of drafts) out.push(await judgeQuestion(q, search, llm, deps.model));
    writeJsonl(path.join(dir, "judgments.jsonl"), out);
    const pooled = out.reduce((n, j) => n + j.pool.length, 0);
    deps.out(`${out.length} questions judged, ${pooled} pooled chunks, ${out.filter((j) => j.judged.length).length} with at least one relevant chunk`);
    return EXIT.OK;
  } finally {
    store.close();
  }
};
