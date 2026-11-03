import { expect, test } from "vitest";
import { FakeLlm, ok } from "../llm/fake";
import { Store } from "../store/sqlite";
import type { AnswerRecord } from "./answers";
import { judgeClaims, supportRate } from "./claims";

test("one verdict per shown claim; abstentions are skipped", async () => {
  const store = new Store();
  const rec = (id: string, status: AnswerRecord["status"], claims: AnswerRecord["claims"]) => ({ id, workspaceId: "langchain", status, claims }) as AnswerRecord;
  const llm = new FakeLlm([ok('{"verdict":"supported"}'), ok('{"verdict":"partial"}')]);
  const js = await judgeClaims("r1", [rec("q1", "answered", [{ text: "a", chunkIds: ["x"] }, { text: "b", chunkIds: ["y"] }]), rec("q2", "abstained", [])], store, llm, "m");
  expect(js.map((j) => [j.questionId, j.claimIndex, j.verdict, j.source])).toEqual([
    ["q1", 0, "supported", "llm"],
    ["q1", 1, "partial", "llm"],
  ]);
  expect(supportRate(js)).toEqual({ n: 2, supported: 0.5, partial: 0.5, unsupported: 0 });
});
