/** PDF text for uploads. Ported from SearchLab (corpus/pdf_loader.py), using unpdf. */
import { extractText, getDocumentProxy } from "unpdf";
import { MAX_CHARS } from "./chunker";

/** A header/footer line must repeat on at least this share of pages (min 3). */
const RUNNING_LINE_SHARE = 0.3;

const norm = (line: string) => line.trim().toLowerCase().replace(/\d+/g, "#");

/** Indexes of the first 3 and last 4 lines of a page, where headers and footers live. */
function edges(n: number): Set<number> {
  const s = new Set<number>();
  for (let i = 0; i < Math.min(3, n); i++) s.add(i);
  for (let i = Math.max(0, n - 4); i < n; i++) s.add(i);
  return s;
}

/**
 * Removes header/footer lines that repeat on many pages (digits masked) and bare page numbers.
 * Only top/bottom lines are candidates, so repeated body lines survive.
 */
export function stripRunningLines(pages: string[]): string[] {
  const split = pages.map((p) => p.split("\n").filter((l) => l.trim() !== ""));
  const counts = new Map<string, number>();
  for (const lines of split) {
    const keys = new Set([...edges(lines.length)].map((i) => norm(lines[i])));
    for (const k of keys) counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const minPages = Math.max(3, Math.floor(pages.length * RUNNING_LINE_SHARE));
  const running = new Set([...counts].filter(([, v]) => v >= minPages).map(([k]) => k));
  return split.map((lines) => {
    const e = edges(lines.length);
    return lines
      .filter((l, i) => !(e.has(i) && running.has(norm(l))) && !/^\d+$/.test(l.trim()))
      .map((l) => l.trimEnd())
      .join("\n");
  });
}

export interface PdfPiece {
  text: string;
  /** 1-based page where the piece starts. */
  page: number;
}

/** Greedy line packing (PDF text has no blank lines between paragraphs); keeps the start page. */
export function packPdfLines(pages: string[], max = MAX_CHARS): PdfPiece[] {
  const out: PdfPiece[] = [];
  let current = "";
  let start = 1;
  pages.forEach((page, i) => {
    for (const line of page.split("\n")) {
      if (!line.trim()) continue;
      if (current && current.length + line.length + 1 > max) {
        out.push({ text: current, page: start });
        current = "";
      }
      if (!current) start = i + 1;
      current = current ? `${current}\n${line}` : line;
    }
  });
  if (current) out.push({ text: current, page: start });
  return out;
}

/** Hard caps so a small PDF cannot expand into unbounded work. */
export const MAX_PDF_PAGES = 500;
export const MAX_PDF_CHARS = 5_000_000;

export class PdfTooLargeError extends Error {
  constructor(what: string) {
    super(`PDF is too large: ${what}.`);
  }
}

export class NoTextLayerError extends Error {
  constructor() {
    super("No text layer found. Scanned PDFs need OCR first.");
  }
}

/** Extracts per-page text. Throws NoTextLayerError when the PDF has no extractable text. */
export async function loadPdfPages(bytes: Uint8Array): Promise<string[]> {
  const pdf = await getDocumentProxy(new Uint8Array(bytes));
  if (pdf.numPages > MAX_PDF_PAGES) throw new PdfTooLargeError(`more than ${MAX_PDF_PAGES} pages`);
  const { text } = await extractText(pdf, { mergePages: false });
  if (text.reduce((n, p) => n + p.length, 0) > MAX_PDF_CHARS) throw new PdfTooLargeError("more than 5 million characters of text");
  const pages = stripRunningLines(text);
  if (pages.every((p) => p.trim() === "")) throw new NoTextLayerError();
  return pages;
}
