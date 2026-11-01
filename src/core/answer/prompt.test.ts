import { expect, test } from "vitest";
import { buildAnswerMessages, promptSha, PROMPT_VERSION, SYSTEM_PROMPT } from "./prompt";

test("system rules come first; passages sit inside tags after the question", () => {
  const [sys, user] = buildAnswerMessages("How do I add memory?", "[c1] Memory\ntext");
  expect(sys).toEqual({ role: "system", content: SYSTEM_PROMPT });
  expect(user.content.indexOf("Question:")).toBeLessThan(user.content.indexOf("<passages>"));
  expect(user.content).toContain("<passages>\n[c1] Memory\ntext\n</passages>");
});

test("empty context is stated, not left blank", () => {
  expect(buildAnswerMessages("q", "")[1].content).toContain("(no passages were retrieved)");
});

test("the prompt has a version and a short content hash", () => {
  expect(PROMPT_VERSION).toBe("answer-v1");
  expect(promptSha()).toMatch(/^[0-9a-f]{12}$/);
});
