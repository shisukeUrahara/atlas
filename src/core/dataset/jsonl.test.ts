import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, test } from "vitest";
import { z } from "zod";
import { appendJsonl, readJsonl, writeJsonl } from "./jsonl";

const Row = z.object({ n: z.number() });

test("write, append and read back with validation", () => {
  const file = path.join(mkdtempSync(path.join(tmpdir(), "atlas-")), "a", "rows.jsonl");
  writeJsonl(file, [{ n: 1 }]);
  appendJsonl(file, { n: 2 });
  expect(readJsonl(file, Row)).toEqual([{ n: 1 }, { n: 2 }]);
});

test("a missing file reads as empty; a bad row names its line", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "atlas-"));
  expect(readJsonl(path.join(dir, "none.jsonl"), Row)).toEqual([]);
  const bad = path.join(dir, "bad.jsonl");
  writeJsonl(bad, [{ n: 1 }, { n: "x" }]);
  expect(() => readJsonl(bad, Row)).toThrow(/bad\.jsonl:2/);
});
