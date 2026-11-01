import { expect, test } from "vitest";
import { buildDoc } from "./build";
import { chunkId, documentId } from "./ids";

test("ids are 16 hex chars and stable", () => {
  expect(documentId("langchain", "a.mdx")).toMatch(/^[0-9a-f]{16}$/);
  expect(chunkId("d", "h", "t")).toBe(chunkId("d", "h", "t"));
});

test("ids change with workspace, path, heading or text", () => {
  const ids = new Set([
    documentId("langchain", "a.mdx"),
    documentId("cookbook", "a.mdx"),
    documentId("langchain", "b.mdx"),
  ]);
  expect(ids.size).toBe(3);
  expect(chunkId("d", "h1", "t")).not.toBe(chunkId("d", "h2", "t"));
  expect(chunkId("d", "h", "t1")).not.toBe(chunkId("d", "h", "t2"));
});

test("an unchanged section keeps its chunk id across two versions of a file", () => {
  const file = { path: "a.mdx", url: "u", sha256: "0".repeat(64) };
  const body = "## Same\n\nThis paragraph does not change between versions at all.\n";
  const v1 = buildDoc("langchain", file, `---\ntitle: A\n---\n${body}\n## Old\n\nThis section was removed in the next version of the docs.\n`);
  const v2 = buildDoc("langchain", file, `---\ntitle: A\n---\n${body}\n## New\n\nThis section was added in the next version of the docs page.\n`);
  const a = new Set(v1.chunks.map((c) => c.chunkId));
  const b = new Set(v2.chunks.map((c) => c.chunkId));
  expect([...a].filter((id) => b.has(id))).toHaveLength(1);
  expect(v1.chunks[0].title).toBe("A");
});
