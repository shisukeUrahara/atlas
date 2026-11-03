import { expect, test } from "vitest";
import { firstGoldRank, hitAtK, mean, ndcgAtK, recallCurve, reciprocalRankAtK } from "./retrieval";

const gold = new Set(["b", "d"]);
const ranked = ["a", "b", "c", "d"];

test("hit@k and reciprocal rank", () => {
  expect(hitAtK(ranked, gold, 1)).toBe(false);
  expect(hitAtK(ranked, gold, 2)).toBe(true);
  expect(reciprocalRankAtK(ranked, gold, 10)).toBe(0.5);
  expect(reciprocalRankAtK(ranked, gold, 1)).toBe(0);
  expect(firstGoldRank(ranked, gold)).toBe(2);
  expect(firstGoldRank(["x"], gold)).toBeNull();
});

test("nDCG matches the hand-computed value (same formula as SearchLab)", () => {
  // dcg = 1/log2(3) + 1/log2(5); ideal = 1/log2(2) + 1/log2(3)
  const want = (1 / Math.log2(3) + 1 / Math.log2(5)) / (1 + 1 / Math.log2(3));
  expect(ndcgAtK(ranked, gold, 10)).toBeCloseTo(want, 12);
  expect(ndcgAtK(["b", "d"], gold, 10)).toBe(1);
  expect(ndcgAtK(["x"], new Set(), 10)).toBe(0);
});

test("recall curve and mean", () => {
  expect(recallCurve([1, 3, null, 2], 3)).toEqual([0.25, 0.5, 0.75]);
  expect(mean([])).toBe(0);
});
