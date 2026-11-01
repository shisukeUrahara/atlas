import { expect, test } from "vitest";
import type { Chunk, ScoredChunk } from "../domain/schemas";
import { assembleContext, renderContext } from "./context";

const hit = (n: number, len: number): ScoredChunk => ({
  chunk: { chunkId: String(n).padStart(16, "0"), documentId: "d", workspaceId: "w", title: "T", heading: `H${n}`, text: "x".repeat(len), url: "u", page: null } as Chunk,
  score: 1,
  rank: n,
});

test("keeps rank order, labels c1..cn and stays under budget", () => {
  const ctx = assembleContext([hit(1, 400), hit(2, 400)], 1000);
  expect(ctx.items.map((i) => i.label)).toEqual(["c1", "c2"]);
  expect(ctx.tokens).toBeLessThanOrEqual(1000);
  expect(ctx.dropped).toEqual([]);
});

test("a chunk that does not fit is dropped whole and recorded; smaller later ones still fit", () => {
  const ctx = assembleContext([hit(1, 2000), hit(2, 8000), hit(3, 400)], 1000);
  expect(ctx.items.map((i) => i.chunk.heading)).toEqual(["H1", "H3"]);
  expect(ctx.items.map((i) => i.label)).toEqual(["c1", "c2"]);
  expect(ctx.dropped).toEqual([hit(2, 0).chunk.chunkId]);
});

test("rendered context shows label, title and heading above each passage", () => {
  const text = renderContext(assembleContext([hit(1, 10)], 1000));
  expect(text).toBe("[c1] T > H1\nxxxxxxxxxx");
});
