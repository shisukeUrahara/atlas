import type { ScoredChunk } from "../domain/schemas";

/** One search method over one workspace's chunks. */
export interface Retriever {
  search(query: string, topK: number): Promise<ScoredChunk[]>;
}
