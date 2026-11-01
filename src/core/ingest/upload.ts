import { randomUUID } from "node:crypto";
import path from "node:path";
import { buildDoc, type BuiltDoc } from "../corpus/build";
import { chunkId, documentId } from "../corpus/ids";
import { loadPdfPages, NoTextLayerError, packPdfLines } from "../corpus/pdf";
import { sha256Hex } from "../corpus/sources";
import { Chunk, type WorkspaceId } from "../domain/schemas";
import type { Store } from "../store/sqlite";
import { runIngestJob, type JobResult } from "./ingest";

export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
const TEXT_EXT = new Set([".md", ".mdx", ".markdown", ".txt"]);

export class UploadError extends Error {
  constructor(
    readonly code: "too_large" | "bad_type" | "bad_name" | "no_text" | "not_utf8" | "unknown_workspace",
    message: string,
  ) {
    super(message);
  }
}

/** Keeps only the base name and safe characters, so a name can never act as a path. */
export function safeFileName(name: string): string {
  const base = path.posix.basename(name.replace(/\\/g, "/")).replace(/[^\w.-]+/g, "_").replace(/^\.+/, "");
  if (!base || base.length > 120) throw new UploadError("bad_name", "File name is empty or longer than 120 characters.");
  return base;
}

/** Validates and builds an uploaded PDF or Markdown/text file into chunks. */
export async function buildUpload(workspaceId: WorkspaceId, rawName: string, bytes: Uint8Array): Promise<BuiltDoc> {
  if (bytes.byteLength > MAX_UPLOAD_BYTES) throw new UploadError("too_large", "Files can be up to 20 MB.");
  const name = safeFileName(rawName);
  const ext = path.extname(name).toLowerCase();
  const sha256 = sha256Hex(bytes);
  const url = `upload:${name}`;

  if (ext === ".pdf") {
    if (new TextDecoder().decode(bytes.subarray(0, 5)) !== "%PDF-") throw new UploadError("bad_type", "This file is not a PDF.");
    let pages: string[];
    try {
      pages = await loadPdfPages(bytes);
    } catch (e) {
      if (e instanceof NoTextLayerError) throw new UploadError("no_text", e.message);
      throw new UploadError("bad_type", "The PDF could not be read.");
    }
    const docId = documentId(workspaceId, name);
    const title = name.replace(/\.pdf$/i, "");
    const seen = new Set<string>();
    const chunks: Chunk[] = [];
    for (const piece of packPdfLines(pages)) {
      const heading = `Page ${piece.page}`;
      const id = chunkId(docId, heading, piece.text);
      if (piece.text.length < 40 || seen.has(id)) continue;
      seen.add(id);
      chunks.push(Chunk.parse({ chunkId: id, documentId: docId, workspaceId, title, heading, text: piece.text, url, page: piece.page }));
    }
    return { documentId: docId, path: name, title, url, sha256, chunks, droppedSnippets: 0 };
  }

  if (!TEXT_EXT.has(ext)) throw new UploadError("bad_type", "Upload a PDF or a Markdown (.md, .mdx) or .txt file.");
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new UploadError("not_utf8", "Text files must be UTF-8.");
  }
  return buildDoc(workspaceId, { path: name, url, sha256 }, text);
}

/**
 * Ingests one upload as its own job. Runs in-process.
 * ponytail: in-process jobs, move to a queue if uploads get large or slow.
 */
export async function ingestUpload(
  store: Store,
  workspaceId: WorkspaceId,
  name: string,
  bytes: Uint8Array,
): Promise<JobResult & { jobId: string; documentId: string }> {
  const ws = store.workspaces().find((w) => w.id === workspaceId);
  if (!ws) throw new UploadError("unknown_workspace", `No workspace "${workspaceId}".`);
  const doc = await buildUpload(workspaceId, name, bytes);
  const jobId = randomUUID();
  const r = runIngestJob(store, jobId, workspaceId, [doc], "user upload");
  return { ...r, jobId, documentId: doc.documentId };
}
