import type { Method, QueryClass } from "../domain/schemas";
import type { LabeledCase } from "../evalset/questions";
import { bootstrapCi, type Ci } from "../metrics/bootstrap";
import { holm, mcnemarExact, pairedCounts } from "../metrics/paired";
import { firstGoldRank, hitAtK, mean, ndcgAtK, reciprocalRankAtK } from "../metrics/retrieval";
import type { SearchService } from "../search/service";

export const METHODS: Method[] = ["bm25", "dense", "hybrid"];
export const DEPTH = 10;

export interface RetrievalCase {
  id: string;
  queryClass: QueryClass;
  workspaceId: string;
  gold: string[];
  /** Per method: top-10 chunk ids, first gold rank (null = not in top 10). */
  methods: Record<Method, { top: string[]; firstGold: number | null }>;
}

/** Answerable questions only: unanswerable / cross_workspace have no gold to retrieve. */
export async function runRetrieval(cases: readonly LabeledCase[], search: SearchService): Promise<RetrievalCase[]> {
  const out: RetrievalCase[] = [];
  for (const c of cases.filter((x) => x.goldChunkIds.length && x.review !== "dropped")) {
    const { results } = await search.search(c.workspaceId, c.question, METHODS, DEPTH);
    const gold = new Set(c.goldChunkIds);
    const methods = Object.fromEntries(
      results.map((r) => {
        const top = r.hits.map((h) => h.chunk.chunkId);
        return [r.method, { top, firstGold: firstGoldRank(top, gold) }];
      }),
    ) as RetrievalCase["methods"];
    out.push({ id: c.id, queryClass: c.queryClass, workspaceId: c.workspaceId, gold: c.goldChunkIds, methods });
  }
  return out;
}

const METRICS = {
  "recall@1": (c: RetrievalCase, m: Method) => (hitAtK(c.methods[m].top, new Set(c.gold), 1) ? 1 : 0),
  "recall@5": (c: RetrievalCase, m: Method) => (hitAtK(c.methods[m].top, new Set(c.gold), 5) ? 1 : 0),
  "recall@10": (c: RetrievalCase, m: Method) => (hitAtK(c.methods[m].top, new Set(c.gold), 10) ? 1 : 0),
  "mrr@10": (c: RetrievalCase, m: Method) => reciprocalRankAtK(c.methods[m].top, new Set(c.gold), 10),
  "ndcg@10": (c: RetrievalCase, m: Method) => ndcgAtK(c.methods[m].top, new Set(c.gold), 10),
} as const;
export type RetrievalMetric = keyof typeof METRICS;

export interface RetrievalScores {
  n: number;
  overall: Record<Method, Record<RetrievalMetric, Ci>>;
  byClass: Record<string, { n: number; scores: Record<Method, Record<"recall@5" | "mrr@10", number>> }>;
  /** Hybrid against each single method: hit@5 McNemar (Holm-adjusted) and paired MRR difference. */
  comparisons: { a: Method; b: Method; counts: ReturnType<typeof pairedCounts>; p: number; pHolm: number; mrrDiff: Ci }[];
}

export function scoreRetrieval(cases: readonly RetrievalCase[], seed = 0): RetrievalScores {
  const overall = Object.fromEntries(
    METHODS.map((m) => [
      m,
      Object.fromEntries(Object.entries(METRICS).map(([k, f]) => [k, bootstrapCi(cases, (s) => mean(s.map((c) => f(c, m))), { seed })])),
    ]),
  ) as RetrievalScores["overall"];
  const classes = [...new Set(cases.map((c) => c.queryClass))].sort();
  const byClass = Object.fromEntries(
    classes.map((cls) => {
      const sub = cases.filter((c) => c.queryClass === cls);
      return [
        cls,
        {
          n: sub.length,
          scores: Object.fromEntries(METHODS.map((m) => [m, { "recall@5": mean(sub.map((c) => METRICS["recall@5"](c, m))), "mrr@10": mean(sub.map((c) => METRICS["mrr@10"](c, m))) }])),
        },
      ];
    }),
  ) as RetrievalScores["byClass"];
  const pairs: [Method, Method][] = [["bm25", "hybrid"], ["dense", "hybrid"]];
  const raw = pairs.map(([a, b]) => {
    const counts = pairedCounts(cases.map((c) => METRICS["recall@5"](c, a) === 1), cases.map((c) => METRICS["recall@5"](c, b) === 1));
    // Paired: both methods are scored on the same resampled questions, so shared difficulty cancels out.
    const mrrDiff = bootstrapCi(cases, (s) => mean(s.map((c) => METRICS["mrr@10"](c, b) - METRICS["mrr@10"](c, a))), { seed });
    return { a, b, counts, p: mcnemarExact(counts), mrrDiff };
  });
  const adj = holm(raw.map((r) => r.p));
  return { n: cases.length, overall, byClass, comparisons: raw.map((r, i) => ({ ...r, pHolm: adj[i] })) };
}
