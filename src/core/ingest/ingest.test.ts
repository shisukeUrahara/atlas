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

test("a changed file keeps unchanged chunks and deletes only the stale ones", () => {
  ingestDocument(store, "langchain", build(page("Version one of this section, long enough to keep.")), "MIT");
  const keepId = store.chunks("langchain").find((c) => c.heading === "Keep")!.chunkId;
  const r = ingestDocument(store, "langchain", build(page("Version two of this section, long enough to keep.")), "MIT");
  expect(r).toMatchObject({ added: 1, removed: 1, unchanged: 1 });
  expect(store.chunks("langchain").map((c) => c.chunkId)).toContain(keepId);
  expect(r.changes.map((c) => c.change).sort()).toEqual(["added", "removed"]);
});

test("index versions bump only on change, and pruning removes deleted documents", () => {
  const a = build(page("Version one of this section, long enough to keep."));
  expect(runIngestJob(store, "j1", "langchain", [a], "MIT").indexVersion).toBe(1);
  expect(runIngestJob(store, "j2", "langchain", [a], "MIT").indexVersion).toBe(1);
  const r = runIngestJob(store, "j3", "langchain", [], "MIT", { prune: true });
  expect(r).toMatchObject({ removed: 2, indexVersion: 2 });
  expect(store.chunks("langchain")).toHaveLength(0);
  expect(store.documents("langchain")).toHaveLength(0);
  expect(store.indexChanges("langchain", 2).every((c) => c.change === "removed")).toBe(true);
});

test("old LangChain docs -> new docs: real update diff", async () => {
  const { readFileSync } = await import("node:fs");
  const { buildCorpus } = await import("../corpus/build");
  const load = (c: string) => buildCorpus("langchain", `fixtures/${c}`, JSON.parse(readFileSync(`fixtures/${c}/source_manifest.json`, "utf8")));
  runIngestJob(store, "old", "langchain", load("langchain-old"), "MIT", { prune: true });
  const r = runIngestJob(store, "new", "langchain", load("langchain"), "MIT", { prune: true });
  expect(r.indexVersion).toBe(2);
  expect(r.added).toBeGreaterThan(0);
  expect(r.removed).toBeGreaterThan(0);
  expect(r.unchanged).toBeGreaterThan(0);
  // After the update, the index holds exactly the new corpus: nothing stale is left.
  const fresh = new Set(load("langchain").flatMap((d) => d.chunks.map((c) => c.chunkId)));
  expect(store.chunks("langchain").every((c) => fresh.has(c.chunkId))).toBe(true);
});
