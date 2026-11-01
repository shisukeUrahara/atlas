import { describe, expect, test } from "vitest";
import { normalize } from "../embeddings/port";
import { MemoryVectorStore } from "./memory";
import type { VectorStore } from "./port";
import { pointId, QdrantVectorStore } from "./qdrant";

const v = (...xs: number[]) => normalize(Float32Array.from(xs));

function contract(name: string, make: () => Promise<VectorStore>) {
  describe(name, () => {
    test("nearest first, and never returns another workspace's chunks", async () => {
      const s = await make();
      await s.upsert("a", [{ chunkId: "c1", vector: v(1, 0, 0) }, { chunkId: "c2", vector: v(0.7, 0.7, 0) }]);
      await s.upsert("b", [{ chunkId: "c3", vector: v(1, 0, 0) }]);
      const hits = await s.search("a", v(1, 0, 0), 10);
      expect(hits.map((h) => h.chunkId)).toEqual(["c1", "c2"]);
      expect(hits[0].score).toBeCloseTo(1, 4);
      expect((await s.search("b", v(1, 0, 0), 10)).map((h) => h.chunkId)).toEqual(["c3"]);
    });
    test("delete removes only that workspace's chunks", async () => {
      const s = await make();
      await s.upsert("a", [{ chunkId: "same", vector: v(1, 0, 0) }]);
      await s.upsert("b", [{ chunkId: "same", vector: v(1, 0, 0) }]);
      await s.delete("a", ["same"]);
      expect(await s.search("a", v(1, 0, 0), 10)).toEqual([]);
      expect((await s.search("b", v(1, 0, 0), 10)).map((h) => h.chunkId)).toEqual(["same"]);
    });
  });
}

contract("MemoryVectorStore", async () => new MemoryVectorStore());

// Runs against a real Qdrant when ATLAS_TEST_QDRANT_URL is set (e.g. http://127.0.0.1:6340).
const qdrantUrl = process.env.ATLAS_TEST_QDRANT_URL;
if (qdrantUrl) contract("QdrantVectorStore", async () => QdrantVectorStore.fromUrl(qdrantUrl, `test_${Date.now()}_${Math.random().toString(36).slice(2)}`, 3));

test("point ids are UUID-shaped and differ per workspace", () => {
  expect(pointId("a", "c1")).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  expect(pointId("a", "c1")).not.toBe(pointId("b", "c1"));
});
