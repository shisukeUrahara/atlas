import { readFileSync } from "node:fs";
import path from "node:path";
import { Chunk } from "../domain/schemas";
import { chunkSections } from "./chunker";
import { cleanDocument } from "./clean";
import { chunkId, documentId } from "./ids";
import { resolveInside, type SourceManifest } from "./sources";

export interface BuiltDoc {
  documentId: string;
  path: string;
  title: string;
  url: string;
  sha256: string;
  chunks: Chunk[];
  droppedSnippets: number;
}

/** Cleans and chunks one file. Duplicate ids inside a document (repeated text) keep the first. */
export function buildDoc(workspaceId: string, file: { path: string; url: string; sha256: string }, raw: string): BuiltDoc {
  const docId = documentId(workspaceId, file.path);
  const doc = cleanDocument(file.path, raw);
  const title = doc.title || path.basename(file.path).replace(/\.\w+$/, "");
  const seen = new Set<string>();
  const chunks: Chunk[] = [];
  for (const s of chunkSections(doc.body)) {
    if (s.text.length < 40) continue; // headings-only leftovers and stray lines carry no answer
    const id = chunkId(docId, s.heading, s.text);
    if (seen.has(id)) continue;
    seen.add(id);
    chunks.push(Chunk.parse({ chunkId: id, documentId: docId, workspaceId, title, heading: s.heading, text: s.text, url: file.url }));
  }
  return { documentId: docId, path: file.path, title, url: file.url, sha256: file.sha256, chunks, droppedSnippets: doc.droppedSnippets };
}

/** Reads every file in the manifest from <corpusDir>/snapshot and builds it. */
export function buildCorpus(workspaceId: string, corpusDir: string, manifest: SourceManifest): BuiltDoc[] {
  const snapshot = path.join(corpusDir, "snapshot");
  return manifest.files.map((f) => buildDoc(workspaceId, f, readFileSync(resolveInside(snapshot, f.path), "utf8")));
}
