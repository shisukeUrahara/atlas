import { describe, expect, test } from "vitest";
import { Chunk, EvalCase, WorkspaceId } from "./schemas";

const chunk = {
  chunkId: "0123456789abcdef",
  documentId: "d1",
  workspaceId: "langchain",
  title: "Persistence",
  heading: "Persistence > Threads",
  text: "A thread is ...",
  url: "https://docs.langchain.com/oss/python/langgraph/persistence",
};

describe("schemas", () => {
  test("a chunk parses and page defaults to null", () => {
    expect(Chunk.parse(chunk).page).toBeNull();
  });
  test("chunk ids are 16 lowercase hex chars", () => {
    expect(() => Chunk.parse({ ...chunk, chunkId: "XYZ" })).toThrow();
  });
  test("workspace ids are short slugs", () => {
    expect(WorkspaceId.safeParse("langchain").success).toBe(true);
    expect(WorkspaceId.safeParse("../etc").success).toBe(false);
  });
  test("eval cases need a q-number id and a known class", () => {
    const ok = { id: "q001", workspaceId: "langchain", question: "?", queryClass: "exact_id", split: "tuning", goldChunkIds: [] };
    expect(EvalCase.parse(ok).id).toBe("q001");
    expect(() => EvalCase.parse({ ...ok, queryClass: "distractor" })).toThrow();
  });
});
