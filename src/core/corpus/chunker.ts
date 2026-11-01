/** Heading-aware chunking, ported from SearchLab (corpus/chunker.py). */
export const MAX_CHARS = 1200;

export interface Section {
  /** Heading path, e.g. "Usage > In production". Empty for text before the first heading. */
  heading: string;
  text: string;
}

const HEADING = /^(#{2,4})\s+(.*\S)\s*$/;
const FENCE = /^\s*(```|~~~)/;

/** Splits on ## to #### headings; '#' lines inside code fences are not headings. */
export function sections(body: string): Section[] {
  const out: { heading: string; lines: string[] }[] = [{ heading: "", lines: [] }];
  let path: string[] = [];
  let inFence = false;
  for (const line of body.split("\n")) {
    if (FENCE.test(line)) inFence = !inFence;
    const m = inFence ? null : HEADING.exec(line);
    if (m) {
      const level = m[1].length - 2;
      path = [...path.slice(0, level), m[2]];
      out.push({ heading: path.join(" > "), lines: [] });
    } else {
      out[out.length - 1].lines.push(line);
    }
  }
  return out.map((s) => ({ heading: s.heading, text: s.lines.join("\n").trim() })).filter((s) => s.text !== "");
}

/** Paragraphs split on blank lines, except that a fenced code block is one paragraph. */
export function paragraphs(text: string): string[] {
  const out: string[] = [];
  let current: string[] = [];
  let inFence = false;
  const flush = () => {
    if (current.length) out.push(current.join("\n"));
    current = [];
  };
  for (const line of text.split("\n")) {
    if (FENCE.test(line)) inFence = !inFence;
    if (!inFence && line.trim() === "") flush();
    else current.push(line);
  }
  flush();
  return out;
}

/** Packs paragraphs up to max chars; never cuts inside a paragraph (one long paragraph stays whole). */
export function packParagraphs(text: string, max = MAX_CHARS): string[] {
  const parts: string[] = [];
  let current = "";
  for (const para of paragraphs(text)) {
    if (current && current.length + para.length + 2 > max) {
      parts.push(current);
      current = para;
    } else {
      current = current ? `${current}\n\n${para}` : para;
    }
  }
  if (current) parts.push(current);
  return parts;
}

/** Every (heading, text) piece of a cleaned document, in order. */
export function chunkSections(body: string, max = MAX_CHARS): Section[] {
  return sections(body).flatMap((s) => packParagraphs(s.text, max).map((text) => ({ heading: s.heading, text })));
}
