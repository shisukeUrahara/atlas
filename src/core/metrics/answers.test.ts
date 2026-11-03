import { expect, test } from "vitest";
import { type AnswerCase, goldCited, percentile, rightOutcome, summarizeAnswers } from "./answers";

const c = (over: Partial<AnswerCase>): AnswerCase => ({
  id: "q", queryClass: "exact_id", status: "answered", goldChunkIds: ["g"], citedChunkIds: ["g"], claimsShown: 2, claimsDropped: 0,
  leakedChunkIds: [], latencyMs: 100, costUsd: 0.001, ...over,
});

test("right outcome depends on the class", () => {
  expect(rightOutcome(c({}))).toBe(true);
  expect(rightOutcome(c({ status: "abstained" }))).toBe(false);
  expect(rightOutcome(c({ queryClass: "unanswerable", status: "abstained", goldChunkIds: [] }))).toBe(true);
  expect(rightOutcome(c({ queryClass: "cross_workspace", status: "answered" }))).toBe(false);
  expect(rightOutcome(c({ status: "failed" }))).toBe(false);
});

test("gold cited needs an answer that cites a gold chunk", () => {
  expect(goldCited(c({}))).toBe(true);
  expect(goldCited(c({ citedChunkIds: ["x"] }))).toBe(false);
});

test("summary rates and counts", () => {
  const s = summarizeAnswers([
    c({ claimsShown: 3, claimsDropped: 1 }),
    c({ citedChunkIds: ["x"], claimsShown: 1 }),
    c({ status: "abstained", citedChunkIds: [], claimsShown: 0 }),
    c({ queryClass: "unanswerable", status: "abstained", goldChunkIds: [], citedChunkIds: [], claimsShown: 0 }),
    c({ queryClass: "cross_workspace", status: "answered", goldChunkIds: [], citedChunkIds: ["z"], leakedChunkIds: ["z"], claimsShown: 1 }),
  ]);
  expect(s.rightOutcome).toBeCloseTo(3 / 5);
  expect(s.abstainRecall).toBe(0.5);
  expect(s.falseAbstain).toBeCloseTo(1 / 3);
  expect(s.citedClaimRate).toBeCloseTo(5 / 6);
  expect(s.goldCitedRate).toBe(0.5);
  expect(s.leaks).toBe(1);
});

test("percentile interpolates", () => {
  expect(percentile([1, 2, 3, 4], 0.5)).toBe(2.5);
  expect(percentile([], 0.9)).toBe(0);
});
