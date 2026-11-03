import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { readJsonl, writeJsonl } from "@/core/dataset/jsonl";
import { LabeledCase } from "@/core/evalset/questions";
import { applyReview, reviewCsv, reviewMarkdown } from "@/core/evalset/review";
import { openStore } from "@/core/store/open";
import type { Command } from "../deps";
import { EXIT } from "../exit";

const files = (dataDir: string) => {
  const dir = path.join(dataDir, "fixtures", "eval");
  return { dir, questions: path.join(dir, "questions.jsonl"), csv: path.join(dir, "review.csv"), md: path.join(dataDir, "docs", "label_review.md") };
};

/** atlas review-sheet: writes fixtures/eval/review.csv (to fill in) and docs/label_review.md (to read). */
export const reviewSheet: Command = async (_argv, deps) => {
  const f = files(deps.dataDir);
  const cases = readJsonl(f.questions, LabeledCase);
  const store = openStore(deps.dataDir);
  try {
    writeFileSync(f.csv, reviewCsv(cases));
    writeFileSync(f.md, reviewMarkdown(cases, (ws, id) => store.chunk(ws, id)));
  } finally {
    store.close();
  }
  deps.out(`review sheet for ${cases.length} questions: ${path.relative(deps.dataDir, f.csv)}, ${path.relative(deps.dataDir, f.md)}`);
  return EXIT.OK;
};

/** atlas apply-review: applies the verdicts in review.csv to questions.jsonl. */
export const applyReviewCmd: Command = async (_argv, deps) => {
  const f = files(deps.dataDir);
  const store = openStore(deps.dataDir);
  try {
    const r = applyReview(readJsonl(f.questions, LabeledCase), readFileSync(f.csv, "utf8"), (ws, id) => store.chunk(ws, id) !== null);
    for (const e of r.errors) deps.err(e);
    writeJsonl(f.questions, r.cases);
    const pending = r.cases.filter((c) => c.review === "pending").length;
    deps.out(`${r.applied} verdicts applied, ${pending} still pending, ${r.errors.length} errors`);
    return r.errors.length ? EXIT.CHECK_FAILED : EXIT.OK;
  } finally {
    store.close();
  }
};
