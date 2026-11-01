import type { Chunk, ScoredChunk } from "../domain/schemas";
import type { Retriever } from "./port";
import { tokenize } from "./tokenize";

/**
 * BM25 Okapi with the same formula and defaults as Python's rank_bm25 (used by SearchLab):
 * k1 = 1.5, b = 0.75, idf = ln((N - n + 0.5) / (n + 0.5)), and negative idf values are
 * replaced by epsilon * mean idf. Only chunks sharing a token with the query are returned.
 */
export class Bm25Retriever implements Retriever {
  private readonly tf: Map<string, number>[];
  private readonly len: number[];
  private readonly avgLen: number;
  private readonly idf = new Map<string, number>();

  constructor(
    private readonly chunks: readonly Chunk[],
    private readonly tokenizer: (text: string) => string[] = tokenize,
    private readonly k1 = 1.5,
    private readonly b = 0.75,
    epsilon = 0.25,
  ) {
    const docs = chunks.map((c) => tokenizer(`${c.heading}\n${c.text}`));
    this.len = docs.map((d) => d.length);
    this.avgLen = this.len.reduce((a, n) => a + n, 0) / Math.max(1, docs.length);
    this.tf = docs.map((d) => {
      const m = new Map<string, number>();
      for (const t of d) m.set(t, (m.get(t) ?? 0) + 1);
      return m;
    });
    const df = new Map<string, number>();
    for (const m of this.tf) for (const t of m.keys()) df.set(t, (df.get(t) ?? 0) + 1);
    const n = docs.length;
    let sum = 0;
    const negative: string[] = [];
    for (const [t, f] of df) {
      const v = Math.log((n - f + 0.5) / (f + 0.5));
      this.idf.set(t, v);
      sum += v;
      if (v < 0) negative.push(t);
    }
    const floor = epsilon * (sum / Math.max(1, df.size));
    for (const t of negative) this.idf.set(t, floor);
  }

  scores(query: string): number[] {
    const q = this.tokenizer(query);
    return this.tf.map((m, i) => {
      let s = 0;
      for (const t of q) {
        const f = m.get(t);
        if (!f) continue;
        const norm = this.k1 * (1 - this.b + (this.b * this.len[i]) / this.avgLen);
        s += (this.idf.get(t) ?? 0) * ((f * (this.k1 + 1)) / (f + norm));
      }
      return s;
    });
  }

  async search(query: string, topK: number): Promise<ScoredChunk[]> {
    const scores = this.scores(query);
    return scores
      .map((score, i) => ({ score, i }))
      .filter((h) => h.score > 0)
      .sort((a, b) => b.score - a.score || a.i - b.i)
      .slice(0, topK)
      .map((h, r) => ({ chunk: this.chunks[h.i], score: h.score, rank: r + 1 }));
  }
}
