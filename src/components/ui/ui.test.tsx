import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { Card } from "./Card";
import { CitationChip } from "./CitationChip";
import { Empty } from "./Empty";
import { MethodName } from "./Method";
import { Pill } from "./Pill";

test("Card names its section after the title", () => {
  render(<Card title="Evidence">x</Card>);
  expect(screen.getByRole("region", { name: "Evidence" })).toBeInTheDocument();
});

test("CitationChip is a toggle button that reports selection", () => {
  const onSelect = vi.fn();
  render(<CitationChip label="c1" selected onSelect={onSelect} />);
  const chip = screen.getByRole("button", { name: "Show evidence c1" });
  expect(chip).toHaveAttribute("aria-pressed", "true");
  fireEvent.click(chip);
  expect(onSelect).toHaveBeenCalledOnce();
});

test("MethodName shows the label; Pill and Empty render their text", () => {
  render(
    <>
      <MethodName method="hybrid" />
      <Pill tone="warn">Not enough evidence</Pill>
      <Empty title="No runs yet" hint="Run atlas eval." />
    </>,
  );
  expect(screen.getByText("Hybrid")).toBeInTheDocument();
  expect(screen.getByText("Not enough evidence")).toBeInTheDocument();
  expect(screen.getByText("Run atlas eval.")).toBeInTheDocument();
});
