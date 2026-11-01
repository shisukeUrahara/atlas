import type { Chunk, ScoredChunk, WorkspaceId } from "../domain/schemas";
import type { Embedder } from "../embeddings/port";
import type { VectorStore } from "../vectors/port";
import type { Retriever } from "./port";

/** Same text BM25 indexes, so both methods see identical content (as in SearchLab). */
export const embeddingText = (c: Chunk) => `${c.heading}\n${c.text}`;

/** Embeds chunks and writes them to the vector store under their workspace. */
export async function indexChunks(embedder: Embedder, store: VectorStore, workspaceId: WorkspaceId, chunks: readonly Chunk[]) {
  const vectors = await embedder.embed(chunks.map(embeddingText));
  await store.upsert(workspaceId, chunks.map((c, i) => ({ chunkId: c.chunkId, vector: vectors[i] })));
}

/** Vector search inside one workspace. Hits whose chunk is no longer in the index are dropped. */
export class DenseRetriever implements Retriever {
  private readonly byId: Map<string, Chunk>;

  constructor(
    private readonly workspaceId: WorkspaceId,
    chunks: readonly Chunk[],
    private readonly embedder: Embedder,
    private readonly store: VectorStore,
  ) {
    this.byId = new Map(chunks.map((c) => [c.chunkId, c]));
  }

  async search(query: string, topK: number): Promise<ScoredChunk[]> {
    const [q] = await this.embedder.embed([query]);
    const hits = await this.store.search(this.workspaceId, q, topK);
    return hits
      .filter((h) => this.byId.has(h.chunkId))
      .map((h, i) => ({ chunk: this.byId.get(h.chunkId)!, score: h.score, rank: i + 1 }));
  }
}
