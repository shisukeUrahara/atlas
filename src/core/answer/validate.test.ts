import { expect, test } from "vitest";
import type { Chunk } from "../domain/schemas";
import type { ContextItem } from "./context";
import { validateCitations } from "./validate";

const ctx: ContextItem[] = ["a", "b"].map((x, i) => ({
  label: `c${i + 1}`,
  chunk: { chunkId: x.repeat(16), documentId: "d", workspaceId: "w", title: "", heading: "", text: "", url: "", page: null } as Chunk,
}));

test("valid citations map to chunk ids", () => {
  const r = validateCitations({ insufficient_evidence: false, claims: [{ text: "Use InMemorySaver.", citations: ["c1", "c2", "c1"] }] }, ctx);
  expect(r.claims).toEqual([{ text: "Use InMemorySaver.", labels: ["c1", "c2"], chunkIds: ["a".repeat(16), "b".repeat(16)] }]);
  expect(r.dropped).toEqual([]);
});

test("unknown labels are removed; a claim left with none is dropped", () => {
  const r = validateCitations(
    {
      insufficient_evidence: false,
      claims: [
        { text: "Partly real.", citations: ["c2", "c9"] },
        { text: "Made up.", citations: ["c7"] },
        { text: "Uncited.", citations: [] },
      ],
    },
    ctx,
  );
  expect(r.claims.map((c) => c.text)).toEqual(["Partly real."]);
  expect(r.claims[0].labels).toEqual(["c2"]);
  expect(r.dropped).toEqual([
    { text: "Made up.", reason: "unknown_citations" },
    { text: "Uncited.", reason: "no_citation" },
  ]);
  expect(r.invalidCitations).toEqual(["c9", "c7"]);
});

test("bracketed labels like [c1] are accepted", () => {
  expect(validateCitations({ insufficient_evidence: false, claims: [{ text: "x", citations: ["[c1]"] }] }, ctx).claims[0].labels).toEqual(["c1"]);
});
