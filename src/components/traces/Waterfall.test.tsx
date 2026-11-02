import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { formatMs, Waterfall } from "./Waterfall";

test("formats ms and seconds", () => {
  expect(formatMs(4)).toBe("4 ms");
  expect(formatMs(182.5)).toBe("182.5 ms");
  expect(formatMs(1610)).toBe("1.61 s");
});

test("one row per stage plus the total", () => {
  render(<Waterfall stages={[{ name: "auth", ms: 1 }, { name: "search", ms: 20 }, { name: "model", ms: 900 }]} />);
  expect(screen.getByText("model")).toHaveClass("text-brand");
  expect(screen.getByText("921 ms")).toBeInTheDocument();
});
