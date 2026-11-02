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

/** Returns the raw text of an imported snippet (by its import path), or null when not available. */
export type SnippetResolver = (importPath: string) => string | null;

const IMPORT = /^import\s+(\w+)\s+from\s+['"]([^'"]+)['"];?\s*$/;
const MAX_INCLUDE_DEPTH = 3;

export function cleanMdx(raw: string, resolve?: SnippetResolver, depth = 0): CleanedDoc {
  const { title, rest } = frontmatter(raw.replace(/\r\n/g, "\n"));
  const imports = new Map<string, string>();
  for (const line of rest.split("\n")) {
    const m = IMPORT.exec(line);
    if (m) imports.set(m[1], m[2]);
  }
  const out: string[] = [];
  let inFence = false;
  let lang: string | null = null; // inside a :::lang block
  let dropped = 0;
  let jsxDepth = 0; // open wrapper tags such as <Note> or <CodeGroup>; their content is indented
  const dedent = (line: string) => line.replace(new RegExp(`^ {0,${jsxDepth * 4}}`), "");
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
      out.push(dedent(line).replace(HIGHLIGHT, ""));
      continue;
    }
    if (/^import\s.+from\s+['"].+['"];?\s*$/.test(line)) continue;
    const self = SELF_CLOSING.exec(line);
    if (self) {
      const from = imports.get(self[1]);
      const text = from && resolve && depth < MAX_INCLUDE_DEPTH ? resolve(from) : null;
      if (text === null) {
        dropped++;
        continue;
      }
      const inner = cleanMdx(text, resolve, depth + 1);
      dropped += inner.droppedSnippets;
      out.push(inner.body.trimEnd());
      continue;
    }
    const titled = TITLE_ATTR.exec(line);
    if (titled) {
      jsxDepth++;
      out.push(`**${titled[1]}**`);
      continue;
    }
    if (JSX_LINE.test(line)) {
      if (/^\s*<\//.test(line)) jsxDepth = Math.max(0, jsxDepth - 1);
      else jsxDepth++;
      continue;
    }
    // Content inside <Note>, <CodeGroup> etc. is indented per level; dedent so it is not read as code.
    out.push(dedent(line));
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
export function cleanDocument(path: string, raw: string, resolve?: SnippetResolver): CleanedDoc {
  if (path.endsWith(".ipynb")) return cleanNotebook(raw);
  const doc = cleanMdx(raw, resolve);
  if (doc.title) return doc;
  // Plain Markdown: use the first # heading as the title.
  const h1 = /^#\s+(.+)$/m.exec(doc.body);
  return h1 ? { ...doc, title: h1[1].trim(), body: doc.body.replace(h1[0], "").trim() + "\n" } : doc;
}
