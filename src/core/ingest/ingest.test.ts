import { beforeEach, expect, test } from "vitest";
import { buildDoc } from "../corpus/build";
import { sha256Hex } from "../corpus/sources";
import { Store } from "../store/sqlite";
import { ingestDocument, runIngestJob } from "./ingest";

let store: Store;
beforeEach(() => {
  store = new Store();
  store.upsertWorkspace({ id: "langchain", name: "LangChain docs", source: "langchain-ai/docs", license: "MIT" });
});

const page = (extra: string) =>
  `---\ntitle: Memory\n---\n## Keep\n\nThis section stays the same in both versions.\n\n## Changing\n\n${extra}\n`;
const build = (raw: string) => buildDoc("langchain", { path: "memory.mdx", url: "u", sha256: sha256Hex(raw) }, raw);

test("first ingest adds every chunk", () => {
  const r = ingestDocument(store, "langchain", build(page("Version one of this section, long enough to keep.")), "MIT");
  expect(r).toMatchObject({ outcome: "new", added: 2, removed: 0 });
  expect(store.chunks("langchain")).toHaveLength(2);
});

test("re-ingesting the same file is skipped and changes nothing", () => {
  const doc = build(page("Version one of this section, long enough to keep."));
  ingestDocument(store, "langchain", doc, "MIT");
  const before = store.chunks("langchain");
  expect(ingestDocument(store, "langchain", doc, "MIT")).toMatchObject({ outcome: "skipped", added: 0, removed: 0, unchanged: 2 });
  expect(store.chunks("langchain")).toEqual(before);
});

test("a changed file replaces its chunks", () => {
  ingestDocument(store, "langchain", build(page("Version one of this section, long enough to keep.")), "MIT");
  const r = ingestDocument(store, "langchain", build(page("Version two of this section, long enough to keep.")), "MIT");
  expect(r.outcome).toBe("updated");
  expect(store.chunks("langchain").map((c) => c.text)).toContain("Version two of this section, long enough to keep.");
  expect(store.chunks("langchain").map((c) => c.text)).not.toContain("Version one of this section, long enough to keep.");
});

test("a job records the totals", () => {
  runIngestJob(store, "j1", "langchain", [build(page("Version one of this section, long enough to keep."))], "MIT");
  expect(store.job("langchain", "j1")).toMatchObject({ status: "done", added: 2 });
});
