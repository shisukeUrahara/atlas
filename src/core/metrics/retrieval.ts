/** Pure retrieval metrics, ported from SearchLab (eval/metrics.py). rankedIds is best-first. */

export function hitAtK(rankedIds: readonly string[], gold: ReadonlySet<string>, k: number): boolean {
  return rankedIds.slice(0, k).some((id) => gold.has(id));
}

export function reciprocalRankAtK(rankedIds: readonly string[], gold: ReadonlySet<string>, k: number): number {
  const i = rankedIds.slice(0, k).findIndex((id) => gold.has(id));
  return i < 0 ? 0 : 1 / (i + 1);
}

export function firstGoldRank(rankedIds: readonly string[], gold: ReadonlySet<string>): number | null {
  const i = rankedIds.findIndex((id) => gold.has(id));
  return i < 0 ? null : i + 1;
}

/** Binary-relevance nDCG: each gold chunk in the top k counts 1/log2(rank+1). */
export function ndcgAtK(rankedIds: readonly string[], gold: ReadonlySet<string>, k: number): number {
  let dcg = 0;
  rankedIds.slice(0, k).forEach((id, i) => {
    if (gold.has(id)) dcg += 1 / Math.log2(i + 2);
  });
  let ideal = 0;
  for (let r = 1; r <= Math.min(gold.size, k); r++) ideal += 1 / Math.log2(r + 1);
  return ideal ? dcg / ideal : 0;
}

/** Share of questions whose first gold chunk is within rank k, for k = 1..kMax. */
export function recallCurve(firstRanks: readonly (number | null)[], kMax = 10): number[] {
  const n = firstRanks.length;
  return Array.from({ length: kMax }, (_, i) => (n ? firstRanks.filter((r) => r !== null && r <= i + 1).length / n : 0));
}

export const mean = (xs: readonly number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
