import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { beforeEach, expect, test } from "vitest";
import { buildDoc } from "../corpus/build";
import { sha256Hex } from "../corpus/sources";
import { CachingEmbedder } from "../embeddings/cache";
import { FakeEmbedder } from "../embeddings/fake";
import { runIngestJob } from "../ingest/ingest";
import { Store } from "../store/sqlite";
import { MemoryVectorStore } from "../vectors/memory";
import { SearchService } from "./service";

let store: Store;
const page = `---\ntitle: Memory\n---\n## Checkpointers\n\nUse InMemorySaver as the checkpointer to keep short-term memory per thread.\n\n## Streaming\n\nStream tokens from the model while the graph runs, step by step.\n\n## Tools\n\nTools let the agent call functions with typed arguments and results.\n\n## Models\n\nPick a chat model by provider name and pass settings such as temperature.\n\n## Middleware\n\nMiddleware wraps each model call to add retries, limits or guardrails.\n`;

beforeEach(() => {
  store = new Store();
  store.upsertWorkspace({ id: "langchain", name: "LangChain docs", source: "langchain-ai/docs", license: "MIT" });
  runIngestJob(store, "j1", "langchain", [buildDoc("langchain", { path: "m.mdx", url: "u", sha256: sha256Hex(page) }, page)], "MIT");
});

test("all three methods return the matching chunk first", async () => {
  const svc = new SearchService(store, new FakeEmbedder(), new MemoryVectorStore());
  const { indexVersion, results } = await svc.search("langchain", "InMemorySaver checkpointer", ["bm25", "dense", "hybrid"], 5);
  expect(indexVersion).toBe(1);
  for (const r of results) {
    expect(r.unavailable).toBeNull();
    expect(r.hits[0].chunk.heading).toBe("Checkpointers");
  }
});

test("replay mode with no cached embeddings: dense is off, hybrid falls back to BM25", async () => {
  const replay = new CachingEmbedder(null, mkdtempSync(path.join(tmpdir(), "atlas-")), "m", 64);
  const svc = new SearchService(store, replay, new MemoryVectorStore());
  const { results } = await svc.search("langchain", "InMemorySaver", ["dense", "hybrid"], 5);
  expect(results[0]).toMatchObject({ method: "dense", hits: [], unavailable: expect.stringMatching(/not cached/) });
  expect(results[1].hits[0].chunk.heading).toBe("Checkpointers");
  expect(results[1].unavailable).toMatch(/^BM25 only/);
});

test("a new index version rebuilds the retrievers", async () => {
  const svc = new SearchService(store, new FakeEmbedder(), new MemoryVectorStore());
  await svc.search("langchain", "stream", ["bm25"], 5);
  const v2 = page.replace("Stream tokens", "Stream messages");
  runIngestJob(store, "j2", "langchain", [buildDoc("langchain", { path: "m.mdx", url: "u", sha256: sha256Hex(v2) }, v2)], "MIT");
  const { indexVersion, results } = await svc.search("langchain", "stream messages", ["bm25"], 5);
  expect(indexVersion).toBe(2);
  expect(results[0].hits[0].chunk.text).toContain("Stream messages");
});
