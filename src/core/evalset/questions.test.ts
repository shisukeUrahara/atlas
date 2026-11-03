import { expect, test } from "vitest";
import type { DraftQuestion } from "./draft";
import { assignSplit, buildQuestionSet } from "./questions";

const drafts: DraftQuestion[] = (["exact_id", "unanswerable"] as const).flatMap((cls, c) =>
  Array.from({ length: 24 }, (_, i) => ({
    id: `q${String(c * 24 + i + 1).padStart(3, "0")}`, workspaceId: "langchain", question: `${cls} ${i}?`, queryClass: cls,
    seedChunkId: cls === "exact_id" ? "a".repeat(16) : null, seedWorkspaceId: cls === "exact_id" ? "langchain" : null, identifier: null,
  })),
);

test("8 tuning and 16 holdout per class, same result for the same seed", () => {
  const s = assignSplit(drafts);
  for (const cls of ["exact_id", "unanswerable"]) {
    const ids = drafts.filter((d) => d.queryClass === cls).map((d) => s.get(d.id));
    expect(ids.filter((x) => x === "tuning")).toHaveLength(8);
  }
  expect([...assignSplit(drafts)]).toEqual([...s]);
});

test("every case starts pending, from the LLM draft; abstain classes have no gold", () => {
  const set = buildQuestionSet(drafts, []);
  expect(set.every((c) => c.review === "pending" && c.labelSource === "llm_draft")).toBe(true);
  expect(set.filter((c) => c.queryClass === "unanswerable").every((c) => c.goldChunkIds.length === 0)).toBe(true);
  expect(set.find((c) => c.queryClass === "exact_id")?.goldChunkIds).toEqual(["a".repeat(16)]);
});
