import type { ContextItem } from "./context";
import type { AnswerOutput } from "./schema";

export interface CitedClaim {
  text: string;
  /** Labels as the model wrote them, e.g. ["c1"], kept only when they exist in the context. */
  labels: string[];
  chunkIds: string[];
}

export interface DroppedClaim {
  text: string;
  reason: "no_citation" | "unknown_citations";
}

export interface ValidatedAnswer {
  claims: CitedClaim[];
  dropped: DroppedClaim[];
  /** Citation labels that did not match any passage sent to the model. */
  invalidCitations: string[];
}

/**
 * Keeps only citations that point at passages the model was actually given.
 * A claim left with no valid citation is dropped and recorded, never shown as supported.
 */
export function validateCitations(answer: AnswerOutput, context: readonly ContextItem[]): ValidatedAnswer {
  const byLabel = new Map(context.map((i) => [i.label, i.chunk.chunkId]));
  const claims: CitedClaim[] = [];
  const dropped: DroppedClaim[] = [];
  const invalid: string[] = [];
  for (const c of answer.claims) {
    const text = c.text.trim();
    if (!text) continue;
    const labels = [...new Set(c.citations.map((l) => l.trim().replace(/^\[|\]$/g, "")))];
    const valid = labels.filter((l) => byLabel.has(l));
    invalid.push(...labels.filter((l) => !byLabel.has(l)));
    if (valid.length === 0) {
      dropped.push({ text, reason: labels.length ? "unknown_citations" : "no_citation" });
      continue;
    }
    claims.push({ text, labels: valid, chunkIds: valid.map((l) => byLabel.get(l)!) });
  }
  return { claims, dropped, invalidCitations: invalid };
}
