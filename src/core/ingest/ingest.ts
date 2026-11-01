import type { BuiltDoc } from "../corpus/build";
import type { WorkspaceId } from "../domain/schemas";
import type { Store } from "../store/sqlite";

export interface IngestCounts {
  added: number;
  removed: number;
  unchanged: number;
}

export interface DocResult extends IngestCounts {
  path: string;
  /** "skipped": same sha256 as the indexed file, nothing was read or written. */
  outcome: "new" | "updated" | "skipped";
}

/**
 * Ingests one built document. A file whose sha256 matches the indexed version is skipped,
 * so re-ingesting an unchanged corpus changes nothing. A changed file replaces its chunks.
 */
export function ingestDocument(store: Store, workspaceId: WorkspaceId, doc: BuiltDoc, license: string): DocResult {
  const existing = store.document(workspaceId, doc.path);
  if (existing && existing.sha256 === doc.sha256 && existing.status === "indexed") {
    const n = store.chunkIdsOf(existing.id).length;
    return { path: doc.path, outcome: "skipped", added: 0, removed: 0, unchanged: n };
  }
  return store.tx(() => {
    const old = existing ? store.chunkIdsOf(existing.id) : [];
    store.deleteChunks(workspaceId, old);
    store.upsertDocument({
      id: doc.documentId, workspaceId, path: doc.path, title: doc.title, url: doc.url,
      license, sha256: doc.sha256, status: "indexed", error: null,
    });
    store.insertChunks(doc.chunks);
    return { path: doc.path, outcome: existing ? "updated" : "new", added: doc.chunks.length, removed: old.length, unchanged: 0 };
  });
}

/** Ingests many documents as one job and records the totals on the job row. */
export function runIngestJob(store: Store, jobId: string, workspaceId: WorkspaceId, docs: BuiltDoc[], license: string): IngestCounts {
  store.createJob(jobId, workspaceId);
  const total: IngestCounts = { added: 0, removed: 0, unchanged: 0 };
  try {
    for (const d of docs) {
      const r = ingestDocument(store, workspaceId, d, license);
      total.added += r.added;
      total.removed += r.removed;
      total.unchanged += r.unchanged;
    }
    store.finishJob(jobId, total);
    return total;
  } catch (e) {
    store.finishJob(jobId, total, e instanceof Error ? e.message : String(e));
    throw e;
  }
}
