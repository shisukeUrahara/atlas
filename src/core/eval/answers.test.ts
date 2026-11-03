import { expect, test } from "vitest";
import { AnswerService } from "../answer/service";
import { buildDoc } from "../corpus/build";
import { sha256Hex } from "../corpus/sources";
import { FakeEmbedder } from "../embeddings/fake";
import type { LabeledCase } from "../evalset/questions";
import { runIngestJob } from "../ingest/ingest";
import { FakeLlm, ok } from "../llm/fake";
import { summarizeAnswers } from "../metrics/answers";
import { SearchService } from "../search/service";
import { Store } from "../store/sqlite";
import { MemoryVectorStore } from "../vectors/memory";
import { runAnswers } from "./answers";

test("records outcome, citations and cost per question; no leaks from the real pipeline", async () => {
  const store = new Store();
  store.upsertWorkspace({ id: "langchain", name: "L", source: "s", license: "MIT" });
  const page = ["## Checkpointers", "Use InMemorySaver as the checkpointer for short-term memory.", "## Streaming", "Stream tokens while the graph runs, step by step.", "## Tools", "Tools call typed functions and return results to the model.", "## Models", "Pick a chat model by provider name and set temperature."].join("\n\n");
  runIngestJob(store, "j", "langchain", [buildDoc("langchain", { path: "m.md", url: "u", sha256: sha256Hex(page) }, page)], "MIT");
  const llm = new FakeLlm([
    ok(JSON.stringify({ insufficient_evidence: false, claims: [{ text: "Use InMemorySaver.", citations: ["c1"] }] })),
    ok(JSON.stringify({ insufficient_evidence: true, claims: [] })),
  ]);
  const svc = new AnswerService(new SearchService(store, new FakeEmbedder(), new MemoryVectorStore()), llm, "m");
  const base = { workspaceId: "langchain", split: "tuning", review: "pending", labelSource: "llm_draft", seedChunkId: null, flag: null } as const;
  const cases: LabeledCase[] = [
    { ...base, id: "q001", question: "InMemorySaver checkpointer?", queryClass: "exact_id", goldChunkIds: [store.chunks("langchain")[0].chunkId] },
    { ...base, id: "q002", question: "What is magic_retry?", queryClass: "unanswerable", goldChunkIds: [] },
  ];
  const rec = await runAnswers(cases, svc, store, () => 0.001);
  expect(rec.map((r) => r.status)).toEqual(["answered", "abstained"]);
  expect(rec[0].leakedChunkIds).toEqual([]);
  const s = summarizeAnswers(rec);
  expect(s.rightOutcome).toBe(1);
  expect(s.costUsd).toBeCloseTo(0.002);
});
