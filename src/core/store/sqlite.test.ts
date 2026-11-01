import { beforeEach, expect, test } from "vitest";
import type { Chunk, Doc } from "../domain/schemas";
import { Store } from "./sqlite";

let store: Store;
const doc = (ws: string, id: string): Doc => ({
  id, workspaceId: ws, path: `${id}.md`, title: id, url: "u", license: "MIT", sha256: "0".repeat(64), status: "indexed", error: null,
});
const chunk = (ws: string, docId: string, n: number): Chunk => ({
  chunkId: n.toString(16).padStart(16, "0"), documentId: docId, workspaceId: ws, title: "t", heading: "h", text: `text ${n}`, url: "u", page: null,
});

beforeEach(() => {
  store = new Store();
  store.upsertWorkspace({ id: "langchain", name: "LangChain docs", source: "langchain-ai/docs", license: "MIT" });
  store.upsertWorkspace({ id: "cookbook", name: "OpenAI Cookbook", source: "openai/openai-cookbook", license: "MIT" });
  store.upsertDocument(doc("langchain", "d1"));
  store.upsertDocument(doc("cookbook", "d2"));
  store.insertChunks([chunk("langchain", "d1", 1), chunk("langchain", "d1", 2), chunk("cookbook", "d2", 3)]);
});

test("workspaces and documents round-trip", () => {
  expect(store.workspaces().map((w) => w.id)).toEqual(["cookbook", "langchain"]);
  expect(store.document("langchain", "d1.md")?.id).toBe("d1");
  expect(store.document("cookbook", "d1.md")).toBeNull();
});

test("chunk reads never cross workspaces", () => {
  expect(store.chunks("langchain").map((c) => c.text)).toEqual(["text 1", "text 2"]);
  expect(store.chunks("cookbook").map((c) => c.text)).toEqual(["text 3"]);
  expect(store.chunk("cookbook", chunk("langchain", "d1", 1).chunkId)).toBeNull();
});

test("inserting the same chunk twice keeps one row", () => {
  store.insertChunks([chunk("langchain", "d1", 1)]);
  expect(store.chunks("langchain")).toHaveLength(2);
});

test("jobs record counts and failures", () => {
  store.createJob("j1", "langchain");
  expect(store.job("langchain", "j1")?.status).toBe("running");
  store.finishJob("j1", { added: 3, removed: 1, unchanged: 5 });
  expect(store.job("langchain", "j1")).toMatchObject({ status: "done", added: 3, removed: 1, unchanged: 5 });
  store.createJob("j2", "langchain");
  store.finishJob("j2", { added: 0, removed: 0, unchanged: 0 }, "No text layer found");
  expect(store.job("langchain", "j2")).toMatchObject({ status: "failed", error: "No text layer found" });
  expect(store.job("cookbook", "j1")).toBeNull();
});

test("a failed transaction leaves nothing behind", () => {
  expect(() =>
    store.tx(() => {
      store.insertChunks([chunk("langchain", "d1", 9)]);
      throw new Error("boom");
    }),
  ).toThrow("boom");
  expect(store.chunks("langchain")).toHaveLength(2);
});
