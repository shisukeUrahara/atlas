import { sha256Hex } from "./sources";

/** Stable per file path inside a workspace; does not change when the file changes. */
export function documentId(workspaceId: string, path: string): string {
  return sha256Hex(`${workspaceId}\0${path}`).slice(0, 16);
}

/**
 * Content-derived: the same heading + text in the same document gets the same id in every
 * version of the docs, so an update can tell added, removed and unchanged chunks apart.
 */
export function chunkId(docId: string, heading: string, text: string): string {
  return sha256Hex(`${docId}\0${heading}\0${text}`).slice(0, 16);
}
