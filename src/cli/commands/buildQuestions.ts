import path from "node:path";
import { readJsonl, writeJsonl } from "@/core/dataset/jsonl";
import { DraftQuestion } from "@/core/evalset/draft";
import { Judgment } from "@/core/evalset/judge";
import { buildQuestionSet } from "@/core/evalset/questions";
import type { Command } from "../deps";
import { EXIT } from "../exit";

/** atlas build-questions: drafts + judgments -> fixtures/eval/questions.jsonl (split, draft gold, review: pending). */
export const buildQuestions: Command = async (_argv, deps) => {
  const dir = path.join(deps.dataDir, "fixtures", "eval");
  const set = buildQuestionSet(readJsonl(path.join(dir, "drafts.jsonl"), DraftQuestion), readJsonl(path.join(dir, "judgments.jsonl"), Judgment));
  writeJsonl(path.join(dir, "questions.jsonl"), set);
  const tuning = set.filter((c) => c.split === "tuning").length;
  const gold = set.reduce((n, c) => n + c.goldChunkIds.length, 0);
  deps.out(`${set.length} questions: ${tuning} tuning, ${set.length - tuning} holdout, ${gold} gold chunks, ${set.filter((c) => c.flag).length} flagged`);
  return EXIT.OK;
};
