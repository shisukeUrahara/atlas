import { dot } from "../embeddings/port";
import type { VectorHit, VectorStore } from "./port";

/** Exact cosine search over unit vectors. Fine for a few thousand chunks per workspace. */
export class MemoryVectorStore implements VectorStore {
  private readonly spaces = new Map<string, Map<string, Float32Array>>();

  private space(ws: string) {
    let m = this.spaces.get(ws);
    if (!m) this.spaces.set(ws, (m = new Map()));
    return m;
  }

  async upsert(ws: string, items: readonly { chunkId: string; vector: Float32Array }[]) {
    const m = this.space(ws);
    for (const it of items) m.set(it.chunkId, it.vector);
  }

  async delete(ws: string, chunkIds: readonly string[]) {
    const m = this.space(ws);
    for (const id of chunkIds) m.delete(id);
  }

  async search(ws: string, vector: Float32Array, topK: number): Promise<VectorHit[]> {
    return [...this.space(ws)]
      .map(([chunkId, v]) => ({ chunkId, score: dot(vector, v) }))
      .sort((a, b) => b.score - a.score || (a.chunkId < b.chunkId ? -1 : 1))
      .slice(0, topK);
  }
}
