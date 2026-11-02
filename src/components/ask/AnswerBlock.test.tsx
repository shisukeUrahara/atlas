import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { AnswerBlock } from "./AnswerBlock";
import type { AnswerResponse } from "./types";

const base: AnswerResponse = {
  requestId: "req_1234abcd", status: "answered", abstainReason: null, failure: null, droppedClaims: 1,
  claims: [{ text: "Pass a checkpointer.", citations: ["c1"] }], passages: [], indexVersion: 2, promptVersion: "answer-v1", cached: false,
};

test("answered: claims with chips and an honest cited count", () => {
  render(<AnswerBlock turn={{ id: 1, question: "q", state: "done", answer: base }} workspaceId="langchain" selected="c1" onSelect={vi.fn()} />);
  expect(screen.getByText("1 of 2 claims cited")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Show evidence c1" })).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByRole("link", { name: "View trace →" })).toHaveAttribute("href", "/traces?ws=langchain&id=req_1234abcd");
});

test("abstained: amber pill and the reason, no claims", () => {
  const a = { ...base, status: "abstained" as const, abstainReason: "model_said_insufficient" as const, claims: [] };
  render(<AnswerBlock turn={{ id: 1, question: "q", state: "done", answer: a }} workspaceId="w" selected={null} onSelect={vi.fn()} />);
  expect(screen.getByText("Not enough evidence")).toBeInTheDocument();
  expect(screen.getByText(/will not guess/)).toBeInTheDocument();
});

test("replay mode error explains how to enable answers", () => {
  render(<AnswerBlock turn={{ id: 1, question: "q", state: "error", code: "not_cached", message: "Not in cache." }} workspaceId="w" selected={null} onSelect={vi.fn()} />);
  expect(screen.getByRole("alert")).toHaveTextContent("No API key: replay mode");
  expect(screen.getByRole("alert")).toHaveTextContent("OPENAI_API_KEY");
});
