import type { WorkspaceId } from "../domain/schemas";

export interface VectorHit {
  chunkId: string;
  score: number;
}

/** Every call names one workspace; there is no way to search across workspaces. */
export interface VectorStore {
  upsert(workspaceId: WorkspaceId, items: readonly { chunkId: string; vector: Float32Array }[]): Promise<void>;
  delete(workspaceId: WorkspaceId, chunkIds: readonly string[]): Promise<void>;
  search(workspaceId: WorkspaceId, vector: Float32Array, topK: number): Promise<VectorHit[]>;
}
