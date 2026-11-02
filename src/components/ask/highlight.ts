const STOP = new Set(
  "about after also and are because been before being between both but can could does each for from have into its just like more most must only other over same should some such than that the their them then there these they this those through under use used using very what when where which while will with without would your you".split(" "),
);

/** Words worth matching in a claim: 4+ letters (or identifiers with _ . -), not stopwords. */
export function claimTerms(claim: string): string[] {
  const words = claim.toLowerCase().match(/[a-z0-9_][a-z0-9_.-]*[a-z0-9_]/g) ?? [];
  return [...new Set(words.filter((w) => w.length >= 4 && !STOP.has(w)))];
}

export type Segment = { text: string; mark: boolean };

/**
 * Splits a passage into plain and marked segments, marking whole-word, case-insensitive
 * occurrences of the claim's terms. This shows overlap, not proof: the label says so.
 */
export function highlight(passage: string, terms: readonly string[]): Segment[] {
  if (!terms.length) return [{ text: passage, mark: false }];
  const escaped = [...terms].sort((a, b) => b.length - a.length).map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const re = new RegExp(`(?<![A-Za-z0-9_])(${escaped.join("|")})(?![A-Za-z0-9_])`, "gi");
  const out: Segment[] = [];
  let last = 0;
  for (const m of passage.matchAll(re)) {
    if (m.index > last) out.push({ text: passage.slice(last, m.index), mark: false });
    out.push({ text: m[0], mark: true });
    last = m.index + m[0].length;
  }
  if (last < passage.length) out.push({ text: passage.slice(last), mark: false });
  return out;
}

export type Block = { kind: "prose" | "code"; text: string };

/**
 * Light Markdown for reading a passage: fenced code becomes a code block, and in prose the
 * link syntax [text](url) keeps only its text and **bold** / `code` markers are dropped.
 */
export function passageBlocks(md: string): Block[] {
  const out: Block[] = [];
  const re = /```[^\n]*\n([\s\S]*?)(?:```|$)/g;
  let last = 0;
  const prose = (s: string) => {
    const t = s
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/`([^`]+)`/g, "$1")
      .trim();
    if (t) out.push({ kind: "prose", text: t });
  };
  for (const m of md.matchAll(re)) {
    prose(md.slice(last, m.index));
    if (m[1].trim()) out.push({ kind: "code", text: m[1].replace(/\n$/, "") });
    last = m.index + m[0].length;
  }
  prose(md.slice(last));
  return out;
}
