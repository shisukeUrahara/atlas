import { expect, test } from "vitest";
import type { DraftQuestion } from "./draft";
import { draftGold } from "./judge";

const q = (cls: DraftQuestion["queryClass"], seed: string | null, seedWs: string | null = "langchain"): DraftQuestion => ({
  id: "q001", workspaceId: "langchain", question: "q?", queryClass: cls, seedChunkId: seed, seedWorkspaceId: seedWs, identifier: null,
});

test("answerable: seed plus judged chunks, flag when the judge found nothing", () => {
  expect(draftGold(q("paraphrase", "s"), { id: "q001", pool: ["a", "s"], judged: ["a"] })).toEqual({ gold: ["s", "a"], flag: null });
  expect(draftGold(q("paraphrase", "s"), { id: "q001", pool: ["a"], judged: [] }).flag).toMatch(/no answering chunk/);
});

test("abstain classes: never gold; a judged chunk raises a flag", () => {
  expect(draftGold(q("unanswerable", null, null), { id: "q001", pool: ["a"], judged: [] })).toEqual({ gold: [], flag: null });
  expect(draftGold(q("cross_workspace", "x", "cookbook"), { id: "q001", pool: ["a"], judged: ["a"] }).flag).toMatch(/judge found 1/);
});
