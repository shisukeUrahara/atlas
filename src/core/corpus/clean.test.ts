import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { cleanDocument, cleanMdx, cleanNotebook } from "./clean";

describe("cleanMdx", () => {
  const raw = [
    "---",
    "title: Short-term memory",
    "---",
    "",
    "import UsagePy from '/snippets/usage-py.mdx';",
    "",
    "## Usage",
    "",
    "<Note>",
    "    A thread groups messages.",
    "</Note>",
    "",
    ":::python",
    "<UsagePy />",
    "Python only text.",
    ":::",
    ":::js",
    "JS only text.",
    ":::",
    "",
    '<Tab title="pip">',
    "```python",
    "agent = create_agent(checkpointer=saver)  # [!code highlight]",
    "<NotATag />",
    "```",
    "</Tab>",
  ].join("\n");
  const doc = cleanMdx(raw);

  test("reads the frontmatter title", () => expect(doc.title).toBe("Short-term memory"));
  test("drops imports and counts snippet includes", () => {
    expect(doc.body).not.toContain("import UsagePy");
    expect(doc.body).not.toContain("<UsagePy />");
    expect(doc.droppedSnippets).toBe(1);
  });
  test("keeps the Python view and drops JS blocks", () => {
    expect(doc.body).toContain("Python only text.");
    expect(doc.body).not.toContain("JS only text.");
  });
  test("unwraps notes and dedents their text", () => {
    expect(doc.body).toContain("\nA thread groups messages.\n");
    expect(doc.body).not.toContain("<Note>");
  });
  test("keeps tab titles and code, strips highlight markers only", () => {
    expect(doc.body).toContain("**pip**");
    expect(doc.body).toContain("agent = create_agent(checkpointer=saver)\n");
    expect(doc.body).toContain("<NotATag />");
  });
});

test("cleanNotebook keeps markdown and code, drops outputs, uses the H1 as title", () => {
  const nb = JSON.stringify({
    cells: [
      { cell_type: "markdown", source: ["# Using embeddings\n", "Intro."] },
      { cell_type: "code", source: "print(1)", outputs: [{ text: "1" }] },
      { cell_type: "raw", source: "skip me" },
    ],
  });
  const doc = cleanNotebook(nb);
  expect(doc.title).toBe("Using embeddings");
  expect(doc.body).toBe("Intro.\n\n```python\nprint(1)\n```\n");
});

test("plain markdown takes its title from the first heading", () => {
  expect(cleanDocument("a.md", "# Hello\n\nBody\n")).toEqual({ title: "Hello", body: "Body\n", droppedSnippets: 0 });
});

test("a real LangChain page cleans to readable Markdown", () => {
  const raw = readFileSync("fixtures/langchain/snapshot/src/oss/langchain/short-term-memory.mdx", "utf8");
  const doc = cleanDocument("short-term-memory.mdx", raw);
  expect(doc.title).toBe("Short-term memory");
  expect(doc.body).toContain("specify a `checkpointer` when creating an agent");
  expect(doc.body).not.toMatch(/^:::/m);
  expect(doc.body).not.toMatch(/^import /m);
});
