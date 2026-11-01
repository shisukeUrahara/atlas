import type { Chunk, ScoredChunk } from "../domain/schemas";
import type { Retriever } from "./port";

/**
 * Reciprocal Rank Fusion over any retrievers: score = sum of 1 / (k + rank).
 * Ties break by best single rank, then chunk id. Ported from SearchLab (retrieval/hybrid.py).
 */
export class HybridRetriever implements Retriever {
  constructor(
    private readonly retrievers: readonly Retriever[],
    private readonly k = 60,
    private readonly depth = 50,
  ) {}

  async search(query: string, topK: number): Promise<ScoredChunk[]> {
    const scores = new Map<string, number>();
    const best = new Map<string, number>();
    const chunks = new Map<string, Chunk>();
    const lists = await Promise.all(this.retrievers.map((r) => r.search(query, this.depth)));
    for (const hits of lists) {
      for (const h of hits) {
        const id = h.chunk.chunkId;
        chunks.set(id, h.chunk);
        scores.set(id, (scores.get(id) ?? 0) + 1 / (this.k + h.rank));
        best.set(id, Math.min(best.get(id) ?? Infinity, h.rank));
      }
    }
    return [...scores.keys()]
      .sort((a, b) => scores.get(b)! - scores.get(a)! || best.get(a)! - best.get(b)! || (a < b ? -1 : 1))
      .slice(0, topK)
      .map((id, i) => ({ chunk: chunks.get(id)!, score: scores.get(id)!, rank: i + 1 }));
  }
}
