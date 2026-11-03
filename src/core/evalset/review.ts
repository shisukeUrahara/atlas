import type { Chunk } from "../domain/schemas";
import { HexId } from "../domain/schemas";
import type { LabeledCase } from "./questions";

export const REVIEW_COLUMNS = ["id", "split", "class", "workspace", "question", "gold", "verdict", "fixed_gold", "note"] as const;

const esc = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

/** CSV with one row per question; the owner fills verdict (ok / fix / drop), fixed_gold and note. */
export function reviewCsv(cases: readonly LabeledCase[]): string {
  const rows = cases.map((c) => [c.id, c.split, c.queryClass, c.workspaceId, c.question, c.goldChunkIds.join(" "), "", "", ""]);
  return [REVIEW_COLUMNS.join(","), ...rows.map((r) => r.map(esc).join(","))].join("\n") + "\n";
}

/** Readable companion: each question with the start of every draft gold passage. */
export function reviewMarkdown(cases: readonly LabeledCase[], chunk: (ws: string, id: string) => Chunk | null): string {
  const out = [
    "# Label review",
    "",
    "Fill `fixtures/eval/review.csv`: verdict `ok`, `fix` (put the right chunk ids, space-separated, in fixed_gold) or `drop`.",
    "Then run `pnpm atlas apply-review`. Rules: docs/labeling_guide.md.",
    "",
  ];
  for (const c of cases) {
    out.push(`## ${c.id} · ${c.queryClass} · ${c.workspaceId} · ${c.split}`, "", `**${c.question}**`, "");
    if (!c.goldChunkIds.length) out.push("_No gold: the right outcome is “Not enough evidence”._", "");
    for (const id of c.goldChunkIds) {
      const ch = chunk(c.workspaceId, id);
      out.push(`- \`${id}\` ${ch ? `${ch.title} › ${ch.heading}` : "(missing)"}${id === c.seedChunkId ? " (seed)" : ""}`);
      if (ch) out.push(`  > ${ch.text.replace(/\s+/g, " ").slice(0, 300)}…`);
    }
    out.push("");
  }
  return out.join("\n");
}

/** Minimal RFC 4180 parser: quoted fields, doubled quotes, commas and newlines inside quotes. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += ch;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((f) => f.trim() !== ""));
}

export interface ReviewResult {
  cases: LabeledCase[];
  applied: number;
  errors: string[];
}

/** Applies verdicts. A fix must name chunk ids that exist in the question's workspace. */
export function applyReview(cases: readonly LabeledCase[], csv: string, exists: (ws: string, id: string) => boolean): ReviewResult {
  const [header, ...rows] = parseCsv(csv);
  const col = (name: string) => header.indexOf(name);
  const byId = new Map(cases.map((c) => [c.id, { ...c }]));
  const errors: string[] = [];
  let applied = 0;
  for (const r of rows) {
    const id = r[col("id")];
    const verdict = (r[col("verdict")] ?? "").trim().toLowerCase();
    const c = byId.get(id);
    if (!c || !verdict) continue;
    if (verdict === "ok") Object.assign(c, { review: "ok", labelSource: "owner" });
    else if (verdict === "drop") Object.assign(c, { review: "dropped", labelSource: "owner" });
    else if (verdict === "fix") {
      const ids = (r[col("fixed_gold")] ?? "").split(/\s+/).filter(Boolean);
      const bad = ids.filter((x) => !HexId.safeParse(x).success || !exists(c.workspaceId, x));
      if (bad.length) {
        errors.push(`${id}: unknown chunk id(s) ${bad.join(", ")}`);
        continue;
      }
      Object.assign(c, { review: "fixed", labelSource: "owner", goldChunkIds: ids });
    } else {
      errors.push(`${id}: verdict must be ok, fix or drop (got "${verdict}")`);
      continue;
    }
    applied++;
  }
  return { cases: cases.map((c) => byId.get(c.id)!), applied, errors };
}
