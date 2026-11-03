import { expect, test } from "vitest";
import type { LabeledCase } from "../evalset/questions";
import { labelsStatus } from "./context";

const c = (review: LabeledCase["review"], labelSource: LabeledCase["labelSource"]) =>
  ({ id: "q001", workspaceId: "langchain", question: "q?", queryClass: "exact_id", split: "holdout", goldChunkIds: [], review, labelSource, seedChunkId: null, flag: null }) as LabeledCase;

test("label status says who reviewed, and never calls a model review owner-reviewed", () => {
  expect(labelsStatus([c("pending", "llm_draft"), c("pending", "llm_draft")])).toBe("llm_draft_pending_review");
  expect(labelsStatus([c("ok", "owner"), c("pending", "llm_draft")])).toBe("partly_reviewed");
  expect(labelsStatus([c("ok", "owner"), c("dropped", "owner")])).toBe("owner_reviewed");
  expect(labelsStatus([c("ok", "model_review"), c("fixed", "model_review")])).toBe("model_reviewed");
  expect(labelsStatus([c("ok", "owner"), c("ok", "model_review")])).toBe("model_reviewed");
});
