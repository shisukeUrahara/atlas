import { expect, test } from "vitest";
import type { Chunk } from "../domain/schemas";
import { FakeEmbedder } from "../embeddings/fake";
import { MemoryVectorStore } from "../vectors/memory";
import { DenseRetriever, indexChunks } from "./dense";

const chunk = (n: number, heading: string, text: string, ws = "langchain"): Chunk => ({
  chunkId: n.toString(16).padStart(16, "0"), documentId: "d", workspaceId: ws, title: "t", heading, text, url: "u", page: null,
});

test("finds the closest chunk in its own workspace only", async () => {
  const embedder = new FakeEmbedder();
  const store = new MemoryVectorStore();
  const lc = [chunk(1, "Memory", "add a checkpointer to keep conversation memory"), chunk(2, "Streaming", "stream tokens as they arrive")];
  const cb = [chunk(3, "Memory", "add a checkpointer to keep conversation memory", "cookbook")];
  await indexChunks(embedder, store, "langchain", lc);
  await indexChunks(embedder, store, "cookbook", cb);
  const hits = await new DenseRetriever("langchain", lc, embedder, store).search("checkpointer memory", 5);
  expect(hits[0].chunk.chunkId).toBe(lc[0].chunkId);
  expect(hits.every((h) => h.chunk.workspaceId === "langchain")).toBe(true);
  expect(hits.map((h) => h.rank)).toEqual([1, 2]);
});

test("vectors for chunks that left the index are ignored", async () => {
  const embedder = new FakeEmbedder();
  const store = new MemoryVectorStore();
  const old = chunk(1, "Old", "stale text about checkpointers");
  await indexChunks(embedder, store, "langchain", [old]);
  expect(await new DenseRetriever("langchain", [], embedder, store).search("checkpointers", 5)).toEqual([]);
});
