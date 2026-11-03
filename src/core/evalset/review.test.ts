import { expect, test } from "vitest";
import type { LabeledCase } from "./questions";
import { applyReview, parseCsv, reviewCsv } from "./review";

const base = (id: string): LabeledCase => ({
  id, workspaceId: "langchain", question: `Q ${id}, with "quotes"?`, queryClass: "exact_id", split: "tuning",
  goldChunkIds: ["a".repeat(16)], review: "pending", labelSource: "llm_draft", seedChunkId: "a".repeat(16), flag: null,
});

test("CSV round-trips quotes and commas", () => {
  const rows = parseCsv(reviewCsv([base("q001")]));
  expect(rows[1][4]).toBe('Q q001, with "quotes"?');
});

test("ok, fix and drop are applied; bad fixes are reported, not applied", () => {
  const cases = [base("q001"), base("q002"), base("q003"), base("q004")];
  const csv = reviewCsv(cases)
    .replace("q001,tuning,exact_id,langchain,", "q001,tuning,exact_id,langchain,")
    .split("\n")
    .map((line) => {
      if (line.startsWith("q001")) return line.replace(/,,,$/, ",ok,,");
      if (line.startsWith("q002")) return line.replace(/,,,$/, `,fix,${"b".repeat(16)},`);
      if (line.startsWith("q003")) return line.replace(/,,,$/, ",drop,,off topic");
      if (line.startsWith("q004")) return line.replace(/,,,$/, ",fix,nothex,");
      return line;
    })
    .join("\n");
  const r = applyReview(cases, csv, (_ws, id) => id === "b".repeat(16));
  expect(r.applied).toBe(3);
  expect(r.errors).toEqual(["q004: unknown chunk id(s) nothex"]);
  expect(r.cases.map((c) => c.review)).toEqual(["ok", "fixed", "dropped", "pending"]);
  expect(r.cases[1].goldChunkIds).toEqual(["b".repeat(16)]);
  expect(r.cases[0].labelSource).toBe("owner");
  // verdicts from a second model are recorded as such, never as owner-reviewed
  expect(applyReview(cases, csv, (_ws, id) => id === "b".repeat(16), "model_review").cases[0].labelSource).toBe("model_review");
});

test("values a spreadsheet would run as formulas are neutralized", () => {
  const evil = { ...base("q009"), question: '=HYPERLINK("http://x","click")' };
  const rows = parseCsv(reviewCsv([evil]));
  expect(rows[1][4]).toBe('\'=HYPERLINK("http://x","click")');
  expect(parseCsv(reviewCsv([{ ...base("q010"), question: "-1+2" }]))[1][4]).toBe("'-1+2");
});
