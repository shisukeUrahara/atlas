import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { cleanDocument } from "./clean";
import { chunkSections, packParagraphs, paragraphs, sections } from "./chunker";

describe("sections", () => {
  test("builds heading paths and ignores # inside code fences", () => {
    const body = "Intro\n\n## A\n\nText A\n\n### A1\n\n```python\n## not a heading\n```\n\n## B\n\nText B";
    expect(sections(body)).toEqual([
      { heading: "", text: "Intro" },
      { heading: "A", text: "Text A" },
      { heading: "A > A1", text: "```python\n## not a heading\n```" },
      { heading: "B", text: "Text B" },
    ]);
  });
  test("drops headings with no text under them", () => {
    expect(sections("## Empty\n\n## Full\n\nx")).toEqual([{ heading: "Full", text: "x" }]);
  });
});

describe("packing", () => {
  test("a code block with blank lines stays one paragraph", () => {
    expect(paragraphs("a\n\n```py\nx = 1\n\ny = 2\n```\n\nb")).toEqual(["a", "```py\nx = 1\n\ny = 2\n```", "b"]);
  });
  test("packs paragraphs up to the limit without cutting one", () => {
    const p = "x".repeat(50);
    expect(packParagraphs([p, p, p].join("\n\n"), 110)).toEqual([`${p}\n\n${p}`, p]);
    expect(packParagraphs("y".repeat(300), 100)).toEqual(["y".repeat(300)]);
  });
});

test("a real page chunks into pieces under the limit, except single long paragraphs", () => {
  const raw = readFileSync("fixtures/langchain/snapshot/src/oss/langchain/short-term-memory.mdx", "utf8");
  const chunks = chunkSections(cleanDocument("x.mdx", raw).body);
  expect(chunks.length).toBeGreaterThan(5);
  for (const c of chunks) {
    if (c.text.length > 1200) expect(paragraphs(c.text)).toHaveLength(1);
  }
  expect(chunks.some((c) => c.heading.startsWith("Usage"))).toBe(true);
});
