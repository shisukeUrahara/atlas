import { expect, test } from "vitest";
import { Store } from "../store/sqlite";
import type { AnswerResult } from "./service";
import { newRequestId, recordTrace } from "./trace";

test("a trace stores stages, versions and chunk ids, readable only in its workspace", () => {
  const store = new Store();
  store.upsertWorkspace({ id: "langchain", name: "L", source: "s", license: "MIT" });
  store.upsertWorkspace({ id: "cookbook", name: "C", source: "s", license: "MIT" });
  const r = {
    status: "answered", abstainReason: null, failure: null, indexVersion: 2, usage: { prompt_tokens: 10, completion_tokens: 5 }, cached: true,
    stages: [{ name: "search", ms: 3 }, { name: "model", ms: 900 }],
    claims: [{ text: "x", labels: ["c1"], chunkIds: ["a".repeat(16)] }], dropped: [], invalidCitations: [],
    passages: [{ label: "c1", chunk: { chunkId: "a".repeat(16) } }], retrievedIds: ["a".repeat(16)], budgetDroppedIds: [],
  } as unknown as AnswerResult;
  const id = newRequestId();
  recordTrace(store, { id, workspaceId: "langchain", userId: "alice", question: "q", model: "m", authMs: 1, now: new Date(0) }, r);
  const t = store.trace("langchain", id)!;
  expect(id).toMatch(/^req_[0-9a-f]{8}$/);
  expect(t.stages.map((s) => s.name)).toEqual(["auth", "search", "model"]);
  expect(t).toMatchObject({ indexVersion: 2, promptVersion: "answer-v1", status: "answered" });
  expect(JSON.stringify(t.result)).not.toContain("text\":\"\"");
  expect(store.trace("cookbook", id)).toBeNull();
  expect(store.traces("langchain")).toHaveLength(1);
});
