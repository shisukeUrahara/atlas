import { describe, expect, test } from "vitest";
import { loadPdfPages, NoTextLayerError, packPdfLines, stripRunningLines } from "./pdf";

/** Builds a minimal valid PDF with one text line per page (Helvetica, no compression). */
function makePdf(pageTexts: string[]): Uint8Array {
  const objs: string[] = [];
  const n = pageTexts.length;
  const kids = pageTexts.map((_, i) => `${3 + i * 2} 0 R`).join(" ");
  objs.push("<< /Type /Catalog /Pages 2 0 R >>");
  objs.push(`<< /Type /Pages /Kids [${kids}] /Count ${n} >>`);
  const font = 3 + n * 2;
  pageTexts.forEach((t, i) => {
    const stream = t ? `BT /F1 12 Tf 72 720 Td (${t}) Tj ET` : "";
    objs.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents ${4 + i * 2} 0 R /Resources << /Font << /F1 ${font} 0 R >> >> >>`);
    objs.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
  });
  objs.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  let out = "%PDF-1.4\n";
  const offsets: number[] = [];
  objs.forEach((o, i) => {
    offsets.push(out.length);
    out += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = out.length;
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
  for (const off of offsets) out += `${String(off).padStart(10, "0")} 00000 n \n`;
  out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return new TextEncoder().encode(out);
}

describe("stripRunningLines", () => {
  test("drops repeated headers and page numbers, keeps repeated body lines", () => {
    const body = (i: number) => {
      const w = ["alpha", "beta", "gamma", "delta"][i - 1];
      return [`Intro ${w}`, `first ${w}`, `second ${w}`, "Requirement [R-1]", `third ${w}`, `fourth ${w}`, `Outro ${w}`];
    };
    const pages = [1, 2, 3, 4].map((i) => ["Field Handbook v2", ...body(i), "Footer text", String(i)].join("\n"));
    const out = stripRunningLines(pages);
    expect(out[0]).toBe(body(1).join("\n"));
    expect(out[3]).toContain("Requirement [R-1]");
  });
  test("a line repeated on fewer than 3 pages stays", () => {
    expect(stripRunningLines(["Title\nA", "Title\nB"])).toEqual(["Title\nA", "Title\nB"]);
  });
});

test("packPdfLines packs across pages and records the start page", () => {
  const pieces = packPdfLines(["a".repeat(60) + "\n" + "b".repeat(60), "c".repeat(60)], 130);
  expect(pieces).toEqual([
    { text: "a".repeat(60) + "\n" + "b".repeat(60), page: 1 },
    { text: "c".repeat(60), page: 2 },
  ]);
});

test("loadPdfPages reads the text of each page", async () => {
  expect(await loadPdfPages(makePdf(["Checkpointers save state", "Threads group runs"]))).toEqual([
    "Checkpointers save state",
    "Threads group runs",
  ]);
});

test("a PDF without text is refused with a clear error", async () => {
  await expect(loadPdfPages(makePdf(["", ""]))).rejects.toBeInstanceOf(NoTextLayerError);
});
