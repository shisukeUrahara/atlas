import { expect, test } from "vitest";
import { CorpusName, rawUrl, resolveInside, SafeRelPath } from "./sources";

test.each(["src/oss/a.mdx", "LICENSE", "examples/My_notebook.ipynb", "a/b.c/d.md"])("accepts %s", (p) => {
  expect(SafeRelPath.safeParse(p).success).toBe(true);
});

test.each(["/etc/passwd", "../x", "a/../b", "a/./b", ".", "a\\b", "a b", ""])("rejects %j", (p) => {
  expect(SafeRelPath.safeParse(p).success).toBe(false);
});

test("corpus names are slugs", () => {
  expect(CorpusName.safeParse("langchain-old").success).toBe(true);
  expect(CorpusName.safeParse("../fixtures").success).toBe(false);
});

test("resolveInside refuses paths that escape the root", () => {
  expect(resolveInside("/r/snap", "a/b.md")).toBe("/r/snap/a/b.md");
  expect(() => resolveInside("/r/snap", "../x")).toThrow(/escapes/);
  expect(() => resolveInside("/r/snap", "/etc/x")).toThrow(/escapes/);
});

test("raw URLs encode each path segment", () => {
  const list = { corpus: "c", repo: "o/r", commit: "a".repeat(40), license: "MIT", licenseFile: "LICENSE", paths: ["x"] };
  expect(rawUrl(list, "a/b#c.md")).toBe(`https://raw.githubusercontent.com/o/r/${"a".repeat(40)}/a/b%23c.md`);
});
