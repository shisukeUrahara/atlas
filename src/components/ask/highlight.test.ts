import { expect, test } from "vitest";
import { claimTerms, highlight, passageBlocks } from "./highlight";

test("claim terms drop short words and stopwords, keep identifiers", () => {
  expect(claimTerms("Pass a checkpointer when you create the agent, for example InMemorySaver.")).toEqual([
    "pass", "checkpointer", "create", "agent", "example", "inmemorysaver",
  ]);
  expect(claimTerms("Set thread_id in config.")).toEqual(["thread_id", "config"]);
});

test("marks whole words only, case-insensitive", () => {
  const segs = highlight("A Checkpointer saves state. checkpointers differ.", ["checkpointer"]);
  expect(segs.filter((s) => s.mark).map((s) => s.text)).toEqual(["Checkpointer"]);
  expect(segs.map((s) => s.text).join("")).toBe("A Checkpointer saves state. checkpointers differ.");
});

test("no terms: one plain segment", () => {
  expect(highlight("text", [])).toEqual([{ text: "text", mark: false }]);
});

test("passageBlocks splits code from prose and strips inline markdown", () => {
  const md = "**Short-term** memory ([persistence](/oss/p)) uses `thread_id`:\n\n```python\nsaver = InMemorySaver()\n```\nDone.";
  expect(passageBlocks(md)).toEqual([
    { kind: "prose", text: "Short-term memory (persistence) uses thread_id:" },
    { kind: "code", text: "saver = InMemorySaver()" },
    { kind: "prose", text: "Done." },
  ]);
});

test("an unclosed fence at the end of a chunk is still a code block", () => {
  expect(passageBlocks("Intro\n```python\nx = 1")).toEqual([
    { kind: "prose", text: "Intro" },
    { kind: "code", text: "x = 1" },
  ]);
});
