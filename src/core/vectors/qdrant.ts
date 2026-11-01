import { QdrantClient } from "@qdrant/js-client-rest";
import { sha256Hex } from "../corpus/sources";
import type { VectorHit, VectorStore } from "./port";

/** UUID-shaped point id from (workspace, chunk), so the same chunk id in two workspaces never collides. */
export function pointId(workspaceId: string, chunkId: string): string {
  const h = sha256Hex(`${workspaceId}\0${chunkId}`);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
}

/**
 * One collection, cosine distance, workspace_id in the payload with a keyword index.
 * Every search and delete carries a workspace filter built here, never from user input.
 */
export class QdrantVectorStore implements VectorStore {
  private ready: Promise<void> | null = null;

  constructor(
    private readonly client: QdrantClient,
    private readonly collection: string,
    private readonly dims: number,
  ) {}

  static fromUrl(url: string, collection: string, dims: number) {
    return new QdrantVectorStore(new QdrantClient({ url, checkCompatibility: false }), collection, dims);
  }

  private ensure(): Promise<void> {
    this.ready ??= (async () => {
      const { exists } = await this.client.collectionExists(this.collection);
      if (exists) return;
      await this.client.createCollection(this.collection, { vectors: { size: this.dims, distance: "Cosine" } });
      await this.client.createPayloadIndex(this.collection, { field_name: "workspace_id", field_schema: "keyword", wait: true });
    })();
    return this.ready;
  }

  private filter(workspaceId: string) {
    return { must: [{ key: "workspace_id", match: { value: workspaceId } }] };
  }

  async upsert(workspaceId: string, items: readonly { chunkId: string; vector: Float32Array }[]) {
    await this.ensure();
    for (let i = 0; i < items.length; i += 128) {
      const points = items.slice(i, i + 128).map((it) => ({
        id: pointId(workspaceId, it.chunkId),
        vector: Array.from(it.vector),
        payload: { workspace_id: workspaceId, chunk_id: it.chunkId },
      }));
      await this.client.upsert(this.collection, { wait: true, points });
    }
  }

  async delete(workspaceId: string, chunkIds: readonly string[]) {
    if (!chunkIds.length) return;
    await this.ensure();
    await this.client.delete(this.collection, {
      wait: true,
      filter: { must: [...this.filter(workspaceId).must, { key: "chunk_id", match: { any: [...chunkIds] } }] },
    });
  }

  async search(workspaceId: string, vector: Float32Array, topK: number): Promise<VectorHit[]> {
    await this.ensure();
    const res = await this.client.query(this.collection, {
      query: Array.from(vector),
      filter: this.filter(workspaceId),
      limit: topK,
      with_payload: ["chunk_id"],
    });
    return res.points.map((p) => ({ chunkId: String(p.payload?.chunk_id), score: p.score }));
  }
}
