/**
 * Turns a source file into plain Markdown for chunking.
 * - .md / .mdx: frontmatter title, drop `import` lines and snippet includes, keep the
 *   Python view of `:::python` / `:::js` blocks, unwrap JSX tags such as <Note> or <Tab>.
 * - .ipynb: markdown cells as-is, code cells as ```python fences, outputs dropped.
 * Code fences are never rewritten except for `[!code ...]` highlight markers.
 */
export interface CleanedDoc {
  title: string;
  body: string;
  /** Snippet includes like <UsagePy /> that point at files outside the snapshot. */
  droppedSnippets: number;
}

const FRONTMATTER = /^---\n([\s\S]*?)\n---\n/;
const FENCE = /^\s*(```|~~~)/;
const SELF_CLOSING = /^\s*<([A-Z][\w.]*)\b[^>]*\/>\s*$/;
const JSX_LINE = /^\s*<\/?[A-Z][\w.]*\b[^>]*>\s*$/;
const TITLE_ATTR = /^\s*<(?:Tab|Accordion|Card|Step)\b[^>]*\btitle="([^"]+)"[^>]*>\s*$/;
const HIGHLIGHT = /\s*(#|\/\/)\s*\[!code [^\]]*\]/g;

/** Python view: keep :::python blocks, drop :::js blocks. */
const KEEP_LANG = "python";

function frontmatter(raw: string): { title: string; rest: string } {
  const m = FRONTMATTER.exec(raw);
  if (!m) return { title: "", rest: raw };
  const line = m[1].split("\n").find((l) => l.startsWith("title:"));
  const title = line ? line.slice(6).trim().replace(/^["']|["']$/g, "") : "";
  return { title, rest: raw.slice(m[0].length) };
}

export function cleanMdx(raw: string): CleanedDoc {
  const { title, rest } = frontmatter(raw.replace(/\r\n/g, "\n"));
  const out: string[] = [];
  let inFence = false;
  let lang: string | null = null; // inside a :::lang block
  let dropped = 0;
  for (const line of rest.split("\n")) {
    if (FENCE.test(line)) inFence = !inFence;
    if (!inFence && !FENCE.test(line)) {
      const block = /^:::(\w+)\s*$/.exec(line.trim());
      if (block) {
        lang = block[1];
        continue;
      }
      if (line.trim() === ":::") {
        lang = null;
        continue;
      }
    }
    if (lang !== null && lang !== KEEP_LANG) continue;
    if (inFence || FENCE.test(line)) {
      out.push(line.replace(HIGHLIGHT, ""));
      continue;
    }
    if (/^import\s.+from\s+['"].+['"];?\s*$/.test(line)) continue;
    if (SELF_CLOSING.test(line)) {
      dropped++;
      continue;
    }
    const titled = TITLE_ATTR.exec(line);
    if (titled) {
      out.push(`**${titled[1]}**`);
      continue;
    }
    if (JSX_LINE.test(line)) continue;
    // Content inside <Note> etc. is indented 4 spaces; dedent so it is not read as code.
    out.push(line.replace(/^ {4}/, ""));
  }
  const body = out.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
  return { title, body, droppedSnippets: dropped };
}

interface NotebookCell {
  cell_type: string;
  source: string | string[];
}

export function cleanNotebook(raw: string): CleanedDoc {
  const nb = JSON.parse(raw) as { cells?: NotebookCell[] };
  const parts: string[] = [];
  for (const cell of nb.cells ?? []) {
    const src = (Array.isArray(cell.source) ? cell.source.join("") : cell.source).trim();
    if (!src) continue;
    if (cell.cell_type === "markdown") parts.push(src);
    else if (cell.cell_type === "code") parts.push("```python\n" + src + "\n```");
  }
  let body = parts.join("\n\n");
  const h1 = /^#\s+(.+)$/m.exec(body);
  const title = h1 ? h1[1].trim() : "";
  if (h1) body = body.replace(h1[0], "");
  return { title, body: body.replace(/\n{3,}/g, "\n\n").trim() + "\n", droppedSnippets: 0 };
}

/** Picks the cleaner by file extension. Unknown types are treated as Markdown. */
export function cleanDocument(path: string, raw: string): CleanedDoc {
  if (path.endsWith(".ipynb")) return cleanNotebook(raw);
  const doc = cleanMdx(raw);
  if (doc.title) return doc;
  // Plain Markdown: use the first # heading as the title.
  const h1 = /^#\s+(.+)$/m.exec(doc.body);
  return h1 ? { ...doc, title: h1[1].trim(), body: doc.body.replace(h1[0], "").trim() + "\n" } : doc;
}
