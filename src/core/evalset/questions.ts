import { z } from "zod";
import { mulberry32, shuffle } from "../dataset/rng";
import { EvalCase, type QueryClass, type Split } from "../domain/schemas";
import { draftGold, type Judgment } from "./judge";
import type { DraftQuestion } from "./draft";

/** fixtures/eval/questions.jsonl: the scored set. */
export const LabeledCase = EvalCase.extend({
  /** "pending" until the owner reviews it; numbers on pending labels are marked as such. */
  review: z.enum(["pending", "ok", "fixed"]),
  labelSource: z.enum(["llm_draft", "owner"]),
  seedChunkId: z.string().nullable(),
  flag: z.string().nullable(),
});
export type LabeledCase = z.infer<typeof LabeledCase>;

export const TUNING_PER_CLASS = 8;

/** Stratified split: per class, a seeded shuffle; the first 8 are tuning, the rest holdout. */
export function assignSplit(drafts: readonly DraftQuestion[], seed = 7): Map<string, Split> {
  const rng = mulberry32(seed);
  const out = new Map<string, Split>();
  const classes = [...new Set(drafts.map((d) => d.queryClass))].sort() as QueryClass[];
  for (const cls of classes) {
    const ids = shuffle(drafts.filter((d) => d.queryClass === cls).map((d) => d.id), rng);
    ids.forEach((id, i) => out.set(id, i < TUNING_PER_CLASS ? "tuning" : "holdout"));
  }
  return out;
}

export function buildQuestionSet(drafts: readonly DraftQuestion[], judgments: readonly Judgment[], seed = 7): LabeledCase[] {
  const split = assignSplit(drafts, seed);
  const byId = new Map(judgments.map((j) => [j.id, j]));
  return drafts.map((d) => {
    const j = byId.get(d.id) ?? { id: d.id, pool: [], judged: [] };
    const { gold, flag } = draftGold(d, j);
    return LabeledCase.parse({
      id: d.id,
      workspaceId: d.workspaceId,
      question: d.question,
      queryClass: d.queryClass,
      split: split.get(d.id),
      goldChunkIds: gold,
      review: "pending",
      labelSource: "llm_draft",
      seedChunkId: d.seedChunkId,
      flag,
    });
  });
}
