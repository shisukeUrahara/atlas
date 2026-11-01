import { beforeEach, expect, test } from "vitest";
import { buildDoc } from "../corpus/build";
import { sha256Hex } from "../corpus/sources";
import { FakeEmbedder } from "../embeddings/fake";
import { runIngestJob } from "../ingest/ingest";
import { FakeLlm, ok, refusal } from "../llm/fake";
import { SearchService } from "../search/service";
import { Store } from "../store/sqlite";
import { MemoryVectorStore } from "../vectors/memory";
import { AnswerService } from "./service";

const page = [
  "---\ntitle: Memory\n---",
  "## Checkpointers\n\nUse InMemorySaver as the checkpointer to keep short-term memory per thread.",
  "## Streaming\n\nStream tokens from the model while the graph runs, step by step.",
  "## Tools\n\nTools let the agent call functions with typed arguments and results.",
  "## Models\n\nPick a chat model by provider name and pass settings such as temperature.",
].join("\n\n");

let search: SearchService;
beforeEach(() => {
  const store = new Store();
  store.upsertWorkspace({ id: "langchain", name: "LangChain docs", source: "langchain-ai/docs", license: "MIT" });
  runIngestJob(store, "j", "langchain", [buildDoc("langchain", { path: "m.mdx", url: "u", sha256: sha256Hex(page) }, page)], "MIT");
  search = new SearchService(store, new FakeEmbedder(), new MemoryVectorStore());
});

const json = (v: unknown) => ok(JSON.stringify(v));
const svc = (llm: FakeLlm) => new AnswerService(search, llm, "gpt-4.1-mini-2025-04-14");

test("answered: claims carry chunk ids of passages that were sent", async () => {
  const llm = new FakeLlm([json({ insufficient_evidence: false, claims: [{ text: "Use InMemorySaver.", citations: ["c1"] }] })]);
  const r = await svc(llm).answer("langchain", "InMemorySaver checkpointer");
  expect(r.status).toBe("answered");
  expect(r.claims[0].chunkIds[0]).toBe(r.passages[0].chunk.chunkId);
  expect(r.passages[0].chunk.heading).toBe("Checkpointers");
});

test("no passages (empty workspace): abstains without calling the model", async () => {
  const store = new Store();
  store.upsertWorkspace({ id: "uploads", name: "My uploads", source: "upload", license: "user upload" });
  const llm = new FakeLlm([]);
  const empty = new AnswerService(new SearchService(store, new FakeEmbedder(), new MemoryVectorStore()), llm, "m");
  const r = await empty.answer("uploads", "anything");
  expect(r).toMatchObject({ status: "abstained", abstainReason: "no_passages" });
  expect(llm.calls).toHaveLength(0);
});

test("model says insufficient: abstains", async () => {
  const r = await svc(new FakeLlm([json({ insufficient_evidence: true, claims: [] })])).answer("langchain", "magic_retry checkpointer");
  expect(r).toMatchObject({ status: "abstained", abstainReason: "model_said_insufficient", claims: [] });
});

test("every claim cites an unknown label: abstains and records the dropped claims", async () => {
  const r = await svc(new FakeLlm([json({ insufficient_evidence: false, claims: [{ text: "Invented.", citations: ["c42"] }] })])).answer(
    "langchain",
    "checkpointer",
  );
  expect(r).toMatchObject({ status: "abstained", abstainReason: "no_supported_claims", invalidCitations: ["c42"] });
  expect(r.dropped).toEqual([{ text: "Invented.", reason: "unknown_citations" }]);
});

test("a refusal is a named failure, not an answer", async () => {
  const r = await svc(new FakeLlm([refusal("no")])).answer("langchain", "checkpointer");
  expect(r).toMatchObject({ status: "failed", failure: "refusal", claims: [] });
});
