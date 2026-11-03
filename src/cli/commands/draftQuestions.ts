import { readFileSync } from "node:fs";
import path from "node:path";
import { documentId } from "@/core/corpus/ids";
import { SourceManifest } from "@/core/corpus/sources";
import { writeJsonl } from "@/core/dataset/jsonl";
import { draftQuestions } from "@/core/evalset/draft";
import { openStore } from "@/core/store/open";
import type { Command } from "../deps";
import { EXIT } from "../exit";

/** atlas draft-questions: writes fixtures/eval/drafts.jsonl (120 questions, see docs/labeling_guide.md). */
export const draftQuestionsCmd: Command = async (_argv, deps) => {
  const store = openStore(deps.dataDir);
  try {
    const old = SourceManifest.parse(JSON.parse(readFileSync(path.join(deps.dataDir, "fixtures", "langchain-old", "source_manifest.json"), "utf8")));
    const newDocIds = new Set(old.missing.map((p) => documentId("langchain", p)));
    const drafts = await draftQuestions(
      deps.makeLlm(),
      deps.model,
      { langchain: store.chunks("langchain"), cookbook: store.chunks("cookbook"), newDocIds },
      7,
      (line) => deps.err(line),
    );
    writeJsonl(path.join(deps.dataDir, "fixtures", "eval", "drafts.jsonl"), drafts);
    const by = new Map<string, number>();
    for (const d of drafts) by.set(d.queryClass, (by.get(d.queryClass) ?? 0) + 1);
    deps.out(`${drafts.length} questions: ${[...by].map(([k, v]) => `${k} ${v}`).join(", ")}`);
    return drafts.length === 120 ? EXIT.OK : EXIT.CHECK_FAILED;
  } finally {
    store.close();
  }
};
