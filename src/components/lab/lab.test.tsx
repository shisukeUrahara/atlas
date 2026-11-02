import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { MethodColumn } from "./MethodColumn";
import { shortPath } from "./types";

test("shortPath turns a pinned GitHub URL into the repo path", () => {
  expect(shortPath("https://github.com/o/r/blob/64063c67975bdc79bcb251027cf9016975865671/src/oss/a.mdx")).toBe("src/oss/a.mdx");
  expect(shortPath("upload:notes.md")).toBe("notes.md");
});

test("a column that cannot run says why", () => {
  render(<MethodColumn result={{ method: "dense", unavailable: "Dense search is off.", hits: [] }} />);
  expect(screen.getByText("Dense search is off.")).toBeInTheDocument();
  expect(screen.getByText("No results from this method.")).toBeInTheDocument();
});

test("hits show rank, title, heading and path", () => {
  render(
    <MethodColumn
      result={{
        method: "bm25",
        unavailable: null,
        hits: [{ rank: 1, score: 12.5, chunkId: "a", title: "Memory", heading: "Add short-term memory", url: "upload:m.md", snippet: "" }],
      }}
    />,
  );
  expect(screen.getByText("#1")).toBeInTheDocument();
  expect(screen.getByText("› Add short-term memory")).toBeInTheDocument();
  expect(screen.getByText("m.md")).toBeInTheDocument();
});
