import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { EvidencePanel } from "./EvidencePanel";
import type { Passage } from "./types";

const passages: Passage[] = [
  { label: "c1", chunkId: "2c0ea69b393c4ee2", title: "Memory", heading: "Add short-term memory", text: "To add short-term memory, pass a checkpointer.", page: null,
    url: "https://github.com/langchain-ai/docs/blob/64063c67975bdc79bcb251027cf9016975865671/src/oss/langgraph/add-memory.mdx" },
  { label: "c2", chunkId: "aaaaaaaaaaaaaaaa", title: "Persistence", heading: "", text: "Threads.", page: null, url: "upload:p.md" },
];

test("shows the selected passage with path, section and marked shared words", () => {
  render(<EvidencePanel passages={passages} selected="c1" claim="Pass a checkpointer when you create the agent." onSelect={vi.fn()} onClose={vi.fn()} />);
  expect(screen.getByText("src/oss/langgraph/add-memory.mdx")).toBeInTheDocument();
  expect(screen.getByText("Add short-term memory")).toBeInTheDocument();
  expect(screen.getAllByText("checkpointer", { selector: "mark" })).toHaveLength(1);
  expect(screen.getByRole("link", { name: /Open in source/ })).toHaveAttribute("href", passages[0].url);
});

test("tabs switch the passage; nothing selected shows the hint", () => {
  const onSelect = vi.fn();
  const { rerender } = render(<EvidencePanel passages={passages} selected={null} claim={null} onSelect={onSelect} onClose={vi.fn()} />);
  expect(screen.getByText(/click a citation/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "c2" }));
  expect(onSelect).toHaveBeenCalledWith("c2");
  rerender(<EvidencePanel passages={passages} selected="c2" claim={null} onSelect={onSelect} onClose={vi.fn()} />);
  expect(screen.getByText("Threads.")).toBeInTheDocument();
});
