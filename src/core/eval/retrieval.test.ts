import { expect, test } from "vitest";
import { scoreRetrieval, type RetrievalCase } from "./retrieval";

const rc = (id: string, ranks: { bm25: number | null; dense: number | null; hybrid: number | null }): RetrievalCase => {
  const top = (r: number | null) => Array.from({ length: 10 }, (_, i) => (r === i + 1 ? "g" : `x${i}`));
  return {
    id, queryClass: "exact_id", workspaceId: "langchain", gold: ["g"],
    methods: { bm25: { top: top(ranks.bm25), firstGold: ranks.bm25 }, dense: { top: top(ranks.dense), firstGold: ranks.dense }, hybrid: { top: top(ranks.hybrid), firstGold: ranks.hybrid } },
  };
};

test("point estimates match hand counts", () => {
  const s = scoreRetrieval([rc("a", { bm25: 1, dense: 7, hybrid: 1 }), rc("b", { bm25: null, dense: 2, hybrid: 3 })]);
  expect(s.overall.bm25["recall@5"].point).toBe(0.5);
  expect(s.overall.dense["recall@5"].point).toBe(0.5);
  expect(s.overall.hybrid["recall@5"].point).toBe(1);
  expect(s.overall.hybrid["mrr@10"].point).toBeCloseTo((1 + 1 / 3) / 2);
  expect(s.byClass.exact_id.n).toBe(2);
  const vsBm25 = s.comparisons.find((c) => c.a === "bm25")!;
  expect(vsBm25.counts).toEqual({ both_right: 1, both_wrong: 0, a_only: 0, b_only: 1 });
  expect(vsBm25.mrrDiff.point).toBeCloseTo((1 + 1 / 3) / 2 - 0.5);
});
