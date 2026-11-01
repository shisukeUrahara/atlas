import { expect, test } from "vitest";
import { answerResponseFormat, buildAnswerRequest, parseAnswer } from "./schema";

test("the response format is OpenAI strict JSON schema with every key required", () => {
  const rf = answerResponseFormat() as { type: string; json_schema: { name: string; strict: boolean; schema: { required: string[] } } };
  expect(rf.type).toBe("json_schema");
  expect(rf.json_schema.strict).toBe(true);
  expect(rf.json_schema.schema.required.sort()).toEqual(["claims", "insufficient_evidence"]);
});

test("requests are deterministic and carry the schema", () => {
  const req = buildAnswerRequest([{ role: "user", content: "q" }], "gpt-4.1-mini-2025-04-14");
  expect(req).toMatchObject({ temperature: 0, max_completion_tokens: 700 });
  expect(req.response_format).toBeDefined();
});

const ok = (content: string | null, finish = "stop", refusal: string | null = null) => ({ content, refusal, finish_reason: finish });

test.each([
  [ok(null, "stop", "I can't help"), "refusal"],
  [ok('{"insufficient', "length"), "truncated"],
  [ok(null), "empty"],
  [ok("not json"), "bad_json"],
  [ok('{"claims": []}'), "schema_mismatch"],
])("named failure %#", (res, failure) => {
  expect(parseAnswer(res)).toEqual({ ok: false, failure });
});

test("a valid answer parses", () => {
  const r = parseAnswer(ok('{"insufficient_evidence": false, "claims": [{"text": "Use InMemorySaver.", "citations": ["c1"]}]}'));
  expect(r).toEqual({ ok: true, value: { insufficient_evidence: false, claims: [{ text: "Use InMemorySaver.", citations: ["c1"] }] } });
});
