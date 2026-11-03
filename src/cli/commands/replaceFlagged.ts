import { readFileSync } from "node:fs";
import path from "node:path";
import { documentId } from "@/core/corpus/ids";
import { SourceManifest } from "@/core/corpus/sources";
import { readJsonl, writeJsonl } from "@/core/dataset/jsonl";
import { DraftQuestion } from "@/core/evalset/draft";
import { Judgment } from "@/core/evalset/judge";
import { replaceFlagged } from "@/core/evalset/replace";
import { SearchService } from "@/core/search/service";
import { openStore } from "@/core/store/open";
import { MemoryVectorStore } from "@/core/vectors/memory";
import type { Command } from "../deps";
import { EXIT } from "../exit";

/** atlas replace-flagged: swaps abstain-class questions that the judge found answered; logs them in rejected.jsonl. */
export const replaceFlaggedCmd: Command = async (_argv, deps) => {
  const dir = path.join(deps.dataDir, "fixtures", "eval");
  const store = openStore(deps.dataDir);
  try {
    const old = SourceManifest.parse(JSON.parse(readFileSync(path.join(deps.dataDir, "fixtures", "langchain-old", "source_manifest.json"), "utf8")));
    const pools = { langchain: store.chunks("langchain"), cookbook: store.chunks("cookbook"), newDocIds: new Set(old.missing.map((p) => documentId("langchain", p))) };
    const search = new SearchService(store, deps.makeEmbedder(), new MemoryVectorStore());
    const r = await replaceFlagged(
      readJsonl(path.join(dir, "drafts.jsonl"), DraftQuestion),
      readJsonl(path.join(dir, "judgments.jsonl"), Judgment),
      pools, search, deps.makeLlm(), deps.model, (l) => deps.err(l),
    );
    writeJsonl(path.join(dir, "drafts.jsonl"), r.drafts);
    writeJsonl(path.join(dir, "judgments.jsonl"), r.judgments);
    writeJsonl(path.join(dir, "rejected.jsonl"), r.rejected);
    const byReason = new Map<string, number>();
    for (const x of r.rejected) byReason.set(`${x.queryClass}: ${x.reason.replace(/ in \w+$/, "")}`, (byReason.get(`${x.queryClass}: ${x.reason.replace(/ in \w+$/, "")}`) ?? 0) + 1);
    deps.out([...byReason].map(([k, v]) => `${v} × ${k}`).join("\n"));
    return EXIT.OK;
  } finally {
    store.close();
  }
};
