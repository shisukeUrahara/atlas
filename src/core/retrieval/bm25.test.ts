import { describe, expect, test } from "vitest";
import type { Chunk } from "../domain/schemas";
import { Bm25Retriever } from "./bm25";

const chunk = (n: number, text: string): Chunk => ({
  chunkId: n.toString(16).padStart(16, "0"), documentId: "d", workspaceId: "langchain", title: "t", heading: "", text, url: "u", page: null,
});

const words = (s: string) => s.split(/\s+/).filter(Boolean);

describe("Bm25Retriever", () => {
  // Expected scores from Python rank_bm25 0.2.2 (SearchLab's env): BM25Okapi(docs).get_scores(query)
  test("matches rank_bm25 scores on a small corpus", () => {
    const docs = ["hello world", "hello there friend", "goodbye world", "some other text here", "another line of text", "world peace now world"];
    const r = new Bm25Retriever(docs.map((d, i) => chunk(i, d)), words);
    const expect6 = (got: number[], want: number[]) => got.forEach((v, i) => expect(v).toBeCloseTo(want[i], 6));
    expect6(r.scores("hello world"), [0.7046023, 0.6020456, 0, 0, 0, 0]);
    expect6(r.scores("text"), [0, 0, 0, 0.5255504, 0.5255504, 0]);
  });

  test("ranks by score, drops zero scores, breaks ties by corpus order", async () => {
    const r = new Bm25Retriever([chunk(0, "checkpointer saves state"), chunk(1, "nothing relevant"), chunk(2, "checkpointer")]);
    const hits = await r.search("checkpointer", 10);
    expect(hits.map((h) => h.chunk.text)).toEqual(["checkpointer", "checkpointer saves state"]);
    expect(hits.map((h) => h.rank)).toEqual([1, 2]);
  });

  test("an exact identifier beats loose word overlap", async () => {
    const r = new Bm25Retriever([
      chunk(0, "Use a saver in memory for tests and a database saver in production."),
      chunk(1, "from langgraph.checkpoint.memory import InMemorySaver"),
      chunk(2, "Memory is useful. Savers save."),
    ]);
    expect((await r.search("InMemorySaver", 3))[0].chunk.chunkId).toBe(chunk(1, "").chunkId);
  });
});
