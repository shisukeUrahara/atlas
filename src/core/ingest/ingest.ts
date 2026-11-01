import type { BuiltDoc } from "../corpus/build";
import type { Chunk, WorkspaceId } from "../domain/schemas";
import type { IndexChange, Store } from "../store/sqlite";

export interface IngestCounts {
  added: number;
  removed: number;
  unchanged: number;
}

export interface DocResult extends IngestCounts {
  path: string;
  /** "skipped": same sha256 as the indexed file, nothing was read or written. */
  outcome: "new" | "updated" | "skipped";
  changes: IndexChange[];
}

const change = (c: Chunk, kind: IndexChange["change"]): IndexChange => ({ chunkId: c.chunkId, change: kind, title: c.title, heading: c.heading });

/**
 * Ingests one built document.
 * - Same sha256 as the indexed file: skipped, nothing changes.
 * - Changed file: chunk-level diff. Unchanged chunks stay, removed chunks are deleted
 *   (no stale text can be retrieved), new chunks are inserted.
 */
export function ingestDocument(store: Store, workspaceId: WorkspaceId, doc: BuiltDoc, license: string): DocResult {
  const existing = store.document(workspaceId, doc.path);
  if (existing && existing.sha256 === doc.sha256 && existing.status === "indexed") {
    const n = store.chunkIdsOf(existing.id).length;
    return { path: doc.path, outcome: "skipped", added: 0, removed: 0, unchanged: n, changes: [] };
  }
  return store.tx(() => {
    const old = existing ? store.chunksOf(existing.id) : [];
    const newIds = new Set(doc.chunks.map((c) => c.chunkId));
    const oldIds = new Set(old.map((c) => c.chunkId));
    const removed = old.filter((c) => !newIds.has(c.chunkId));
    const added = doc.chunks.filter((c) => !oldIds.has(c.chunkId));
    store.deleteChunks(workspaceId, removed.map((c) => c.chunkId));
    store.upsertDocument({
      id: doc.documentId, workspaceId, path: doc.path, title: doc.title, url: doc.url,
      license, sha256: doc.sha256, status: "indexed", error: null,
    });
    store.insertChunks(added);
    return {
      path: doc.path,
      outcome: existing ? "updated" : "new",
      added: added.length,
      removed: removed.length,
      unchanged: doc.chunks.length - added.length,
      changes: [...added.map((c) => change(c, "added")), ...removed.map((c) => change(c, "removed"))],
    };
  });
}

export interface JobResult extends IngestCounts {
  /** The new index version, or the current one when nothing changed. */
  indexVersion: number;
}

/**
 * Ingests many documents as one job. With `prune`, the docs list is the whole corpus:
 * indexed documents missing from it are deleted with their chunks.
 * A new index version is recorded only when something changed.
 */
export function runIngestJob(
  store: Store,
  jobId: string,
  workspaceId: WorkspaceId,
  docs: BuiltDoc[],
  license: string,
  opts: { prune?: boolean } = {},
): JobResult {
  store.createJob(jobId, workspaceId);
  const total: IngestCounts = { added: 0, removed: 0, unchanged: 0 };
  const changes: IndexChange[] = [];
  try {
    for (const d of docs) {
      const r = ingestDocument(store, workspaceId, d, license);
      total.added += r.added;
      total.removed += r.removed;
      total.unchanged += r.unchanged;
      changes.push(...r.changes);
    }
    if (opts.prune) {
      const keep = new Set(docs.map((d) => d.path));
      for (const gone of store.documents(workspaceId).filter((d) => !keep.has(d.path))) {
        const chunks = store.chunksOf(gone.id);
        store.deleteDocument(workspaceId, gone.id);
        total.removed += chunks.length;
        changes.push(...chunks.map((c) => change(c, "removed")));
      }
    }
    const indexVersion =
      total.added + total.removed > 0 ? store.addIndexVersion(workspaceId, jobId, total, changes) : store.indexVersion(workspaceId);
    store.finishJob(jobId, total);
    return { ...total, indexVersion };
  } catch (e) {
    store.finishJob(jobId, total, e instanceof Error ? e.message : String(e));
    throw e;
  }
}
