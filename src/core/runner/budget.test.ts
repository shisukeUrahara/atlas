import { expect, test } from "vitest";
import type { Pricing } from "../cost/pricing";
import type { LlmRequest } from "../llm/port";
import { checkBudget, CostGateError } from "./budget";

const pricing = {
  source_url: "https://example.test",
  retrieved_at: "2026-10-29",
  models: { "gpt-4.1-mini-2025-04-14": { input_per_1m: 0.4, output_per_1m: 1.6 } },
} as unknown as Pricing;

const req = (content: string): LlmRequest => ({
  model: "gpt-4.1-mini-2025-04-14", messages: [{ role: "user", content }], temperature: 0, max_completion_tokens: 1000,
});

test("under the limit returns the estimate", () => {
  expect(checkBudget([req("hi")], { pricing, maxUsd: 1 })).toBeGreaterThan(0);
});

test("over the limit throws before any call", () => {
  const many = Array.from({ length: 2000 }, () => req("x".repeat(4000)));
  expect(() => checkBudget(many, { pricing, maxUsd: 0.5 })).toThrow(CostGateError);
});

test("cached requests cost nothing", () => {
  const many = Array.from({ length: 2000 }, () => req("x".repeat(4000)));
  expect(checkBudget(many, { pricing, maxUsd: 0.5, isCached: () => true })).toBe(0);
});
