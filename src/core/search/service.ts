import type { Chunk, Method, ScoredChunk, WorkspaceId } from "../domain/schemas";
import { EmbeddingCacheMissError, type Embedder } from "../embeddings/port";
import { Bm25Retriever } from "../retrieval/bm25";
import { DenseRetriever, indexChunks } from "../retrieval/dense";
import { HybridRetriever } from "../retrieval/hybrid";
import type { Retriever } from "../retrieval/port";
import type { Store } from "../store/sqlite";
import type { VectorStore } from "../vectors/port";

export interface MethodResult {
  method: Method;
  hits: ScoredChunk[];
  /** Set when the method could not run, e.g. dense search with no embeddings in replay mode. */
  unavailable: string | null;
}

interface WorkspaceIndex {
  version: number;
  chunks: Chunk[];
  bm25: Bm25Retriever;
  dense: DenseRetriever | null;
  denseReason: string | null;
}

/**
 * Builds retrievers per workspace and index version, and rebuilds when the version changes.
 * Dense search needs every chunk embedding: from the cache in replay mode, or the API when a key is set.
 */
export class SearchService {
  private readonly cache = new Map<string, WorkspaceIndex>();

  constructor(
    private readonly store: Store,
    private readonly embedder: Embedder,
    private readonly vectors: VectorStore,
  ) {}

  async index(workspaceId: WorkspaceId): Promise<WorkspaceIndex> {
    const version = this.store.indexVersion(workspaceId);
    const hit = this.cache.get(workspaceId);
    if (hit && hit.version === version) return hit;
    const chunks = this.store.chunks(workspaceId);
    let dense: DenseRetriever | null = null;
    let denseReason: string | null = null;
    try {
      await indexChunks(this.embedder, this.vectors, workspaceId, chunks);
      dense = new DenseRetriever(workspaceId, chunks, this.embedder, this.vectors);
    } catch (e) {
      if (!(e instanceof EmbeddingCacheMissError)) throw e;
      denseReason = `Dense search is off for this workspace: ${e.missing} chunk embeddings are not cached and there is no API key.`;
    }
    const built: WorkspaceIndex = { version, chunks, bm25: new Bm25Retriever(chunks), dense, denseReason };
    this.cache.set(workspaceId, built);
    return built;
  }

  /** Runs the requested methods. Hybrid fuses whichever of BM25 and dense can run. */
  async search(workspaceId: WorkspaceId, query: string, methods: readonly Method[], topK: number): Promise<{ indexVersion: number; results: MethodResult[] }> {
    const ix = await this.index(workspaceId);
    const results: MethodResult[] = [];
    let denseError: string | null = ix.denseReason;
    const run = async (r: Retriever) => r.search(query, topK);

    let denseHits: ScoredChunk[] | null = null;
    if (ix.dense && (methods.includes("dense") || methods.includes("hybrid"))) {
      try {
        denseHits = await run(ix.dense);
      } catch (e) {
        if (!(e instanceof EmbeddingCacheMissError)) throw e;
        denseError = "Dense search needs OPENAI_API_KEY for questions that are not in the cache.";
      }
    }
    for (const method of methods) {
      if (method === "bm25") results.push({ method, hits: await run(ix.bm25), unavailable: null });
      if (method === "dense") results.push({ method, hits: denseHits ?? [], unavailable: denseHits ? null : denseError });
      if (method === "hybrid") {
        const parts: Retriever[] = [ix.bm25];
        if (denseHits) parts.push({ search: async () => denseHits! });
        const hits = await new HybridRetriever(parts).search(query, topK);
        results.push({ method, hits, unavailable: denseHits ? null : `BM25 only. ${denseError ?? ""}`.trim() });
      }
    }
    return { indexVersion: ix.version, results };
  }
}
