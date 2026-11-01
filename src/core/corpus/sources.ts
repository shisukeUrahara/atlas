import { createHash } from "node:crypto";
import { z } from "zod";
import { Sha256 } from "../domain/schemas";

/** fixtures/<corpus>/sources.json: what to fetch, pinned to one commit. */
export const SourceList = z.object({
  corpus: z.string().min(1),
  repo: z.string().regex(/^[\w.-]+\/[\w.-]+$/),
  commit: z.string().regex(/^[0-9a-f]{40}$/),
  license: z.string().min(1),
  /** Repo file that holds the license text; copied next to the snapshot. */
  licenseFile: z.string().min(1),
  paths: z.array(z.string().min(1)).min(1),
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
  /** Paths listed in sources.json that do not exist at this commit. */
  missing: z.array(z.string()),
});
export type SourceManifest = z.infer<typeof SourceManifest>;

export function sha256Hex(data: Uint8Array | string): string {
  return createHash("sha256").update(data).digest("hex");
}

export function rawUrl(list: SourceList, path: string): string {
  return `https://raw.githubusercontent.com/${list.repo}/${list.commit}/${path}`;
}

/** Human-facing link to the exact file version. */
export function blobUrl(list: SourceList, path: string): string {
  return `https://github.com/${list.repo}/blob/${list.commit}/${path}`;
}
