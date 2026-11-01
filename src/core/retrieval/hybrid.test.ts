import { expect, test } from "vitest";
import type { Chunk, ScoredChunk } from "../domain/schemas";
import { HybridRetriever } from "./hybrid";
import type { Retriever } from "./port";

const chunk = (id: string): Chunk => ({ chunkId: id.padStart(16, "0"), documentId: "d", workspaceId: "w", title: "", heading: "", text: id, url: "", page: null });
const fixed = (ids: string[]): Retriever => ({
  search: async (_q, k): Promise<ScoredChunk[]> => ids.slice(0, k).map((id, i) => ({ chunk: chunk(id), score: 1, rank: i + 1 })),
});

test("fuses ranks: a chunk ranked well by both beats one ranked first by only one", async () => {
  const hits = await new HybridRetriever([fixed(["a", "b", "c"]), fixed(["b", "d", "a"])]).search("q", 4);
  expect(hits.map((h) => h.chunk.text)).toEqual(["b", "a", "d", "c"]);
  expect(hits[0].score).toBeCloseTo(1 / 62 + 1 / 61, 10);
});

test("equal scores break by best single rank, then id", async () => {
  const hits = await new HybridRetriever([fixed(["x", "y"]), fixed(["y", "x"])]).search("q", 2);
  expect(hits.map((h) => h.chunk.text)).toEqual(["x", "y"]);
});

test("a chunk found by only one method still appears", async () => {
  const hits = await new HybridRetriever([fixed(["a"]), fixed([])]).search("q", 5);
  expect(hits.map((h) => h.chunk.text)).toEqual(["a"]);
});
