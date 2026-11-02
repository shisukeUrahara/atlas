import { createHash } from "node:crypto";
import nodePath from "node:path";
import { z } from "zod";
import { Sha256 } from "../domain/schemas";

/** Relative POSIX path: no leading slash, no backslash, no "." or ".." segment. */
export const SafeRelPath = z
  .string()
  .regex(/^(?!\/)(?!.*(^|\/)\.{1,2}(\/|$))[\w.\/-]+$/, "must be a safe relative path");

export const CorpusName = z.string().regex(/^[a-z0-9][a-z0-9-]{0,39}$/, "must be a slug");

/** fixtures/<corpus>/sources.json: what to fetch, pinned to one commit. */
export const SourceList = z.object({
  corpus: CorpusName,
  repo: z.string().regex(/^[\w.-]+\/[\w.-]+$/),
  commit: z.string().regex(/^[0-9a-f]{40}$/),
  license: z.string().min(1),
  /** Repo file that holds the license text; copied next to the snapshot. */
  licenseFile: SafeRelPath,
  paths: z.array(SafeRelPath).min(1),
});
export type SourceList = z.infer<typeof SourceList>;

export const ManifestFile = z.object({
  path: z.string().min(1),
  url: z.string().url(),
  bytes: z.number().int().nonnegative(),
  sha256: Sha256,
});
export type ManifestFile = z.infer<typeof ManifestFile>;

/** fixtures/<corpus>/source_manifest.json: what was actually fetched. */
export const SourceManifest = z.object({
  corpus: z.string(),
  repo: z.string(),
  commit: z.string(),
  license: z.string(),
  retrievedAtUtc: z.string(),
  files: z.array(ManifestFile),
  /** Snippet files that pages import (e.g. code samples). Inlined by the cleaner, never chunked alone. */
  includes: z.array(ManifestFile).default([]),
  /** Paths listed in sources.json (or imported by a page) that do not exist at this commit. */
  missing: z.array(z.string()),
});
export type SourceManifest = z.infer<typeof SourceManifest>;

/** Joins a validated relative path under root and refuses anything that escapes it. */
export function resolveInside(root: string, rel: string): string {
  const base = nodePath.resolve(root);
  const target = nodePath.resolve(base, rel);
  if (!target.startsWith(base + nodePath.sep)) throw new Error(`path escapes ${root}: ${rel}`);
  return target;
}

/** MDX imports like `import X from '/snippets/a.mdx'` map to `src/snippets/a.mdx` in the docs repo. */
export function snippetImports(mdx: string): { name: string; path: string }[] {
  const out: { name: string; path: string }[] = [];
  for (const m of mdx.matchAll(/^import\s+(\w+)\s+from\s+['"](\/snippets\/[^'"]+\.mdx)['"];?\s*$/gm)) {
    const path = `src${m[2]}`;
    if (SafeRelPath.safeParse(path).success) out.push({ name: m[1], path });
  }
  return out;
}

export function sha256Hex(data: Uint8Array | string): string {
  return createHash("sha256").update(data).digest("hex");
}

const encodePath = (p: string) => p.split("/").map(encodeURIComponent).join("/");

export function rawUrl(list: SourceList, path: string): string {
  return `https://raw.githubusercontent.com/${list.repo}/${list.commit}/${encodePath(path)}`;
}

/** Human-facing link to the exact file version. */
export function blobUrl(list: SourceList, path: string): string {
  return `https://github.com/${list.repo}/blob/${list.commit}/${encodePath(path)}`;
}
