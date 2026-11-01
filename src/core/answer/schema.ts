import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import type { LlmRequest, Msg } from "../llm/port";

export const TEMPERATURE = 0;
export const MAX_ANSWER_TOKENS = 700;

/** The answer contract. Strict mode needs every key present, so nothing is optional. */
export const AnswerOutput = z.object({
  insufficient_evidence: z.boolean(),
  claims: z.array(
    z.object({
      text: z.string(),
      citations: z.array(z.string()),
    }),
  ),
});
export type AnswerOutput = z.infer<typeof AnswerOutput>;

/** Plain JSON, so no helper functions end up in the cache key or the request body. */
export function answerResponseFormat(): object {
  return JSON.parse(JSON.stringify(zodResponseFormat(AnswerOutput, "cited_answer")));
}

export function buildAnswerRequest(messages: Msg[], model: string): LlmRequest {
  return { model, messages, temperature: TEMPERATURE, max_completion_tokens: MAX_ANSWER_TOKENS, response_format: answerResponseFormat() };
}

export type ParseFailure = "refusal" | "truncated" | "empty" | "bad_json" | "schema_mismatch";

/** Parses model output. Anything that is not exactly the contract is a named failure, never a guess. */
export function parseAnswer(res: { content: string | null; refusal: string | null; finish_reason: string }):
  | { ok: true; value: AnswerOutput }
  | { ok: false; failure: ParseFailure } {
  if (res.refusal) return { ok: false, failure: "refusal" };
  if (res.finish_reason === "length") return { ok: false, failure: "truncated" };
  if (!res.content) return { ok: false, failure: "empty" };
  let json: unknown;
  try {
    json = JSON.parse(res.content);
  } catch {
    return { ok: false, failure: "bad_json" };
  }
  const parsed = AnswerOutput.safeParse(json);
  return parsed.success ? { ok: true, value: parsed.data } : { ok: false, failure: "schema_mismatch" };
}
