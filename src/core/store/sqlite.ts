// ponytail: node:sqlite (built into Node 24, marked experimental) instead of a native dependency.
// Switch to better-sqlite3 if the API changes or the warning matters in production.
import { DatabaseSync } from "node:sqlite";
import { Chunk, Doc, Job, Workspace, type DocumentStatus, type WorkspaceId } from "../domain/schemas";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS workspaces (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, source TEXT NOT NULL, license TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id),
  path TEXT NOT NULL, title TEXT NOT NULL, url TEXT NOT NULL, license TEXT NOT NULL,
  sha256 TEXT NOT NULL, status TEXT NOT NULL, error TEXT,
  UNIQUE (workspace_id, path)
);
CREATE TABLE IF NOT EXISTS chunks (
  chunk_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id),
  document_id TEXT NOT NULL REFERENCES documents(id),
  title TEXT NOT NULL, heading TEXT NOT NULL, text TEXT NOT NULL, url TEXT NOT NULL, page INTEGER,
  PRIMARY KEY (workspace_id, chunk_id)
);
CREATE INDEX IF NOT EXISTS chunks_by_document ON chunks(document_id);
CREATE TABLE IF NOT EXISTS index_versions (
  workspace_id TEXT NOT NULL REFERENCES workspaces(id),
  version INTEGER NOT NULL, job_id TEXT NOT NULL,
  added INTEGER NOT NULL, removed INTEGER NOT NULL, unchanged INTEGER NOT NULL,
  PRIMARY KEY (workspace_id, version)
);
CREATE TABLE IF NOT EXISTS index_changes (
  workspace_id TEXT NOT NULL, version INTEGER NOT NULL, chunk_id TEXT NOT NULL,
  change TEXT NOT NULL CHECK (change IN ('added', 'removed')),
  title TEXT NOT NULL, heading TEXT NOT NULL,
  PRIMARY KEY (workspace_id, version, chunk_id)
);
CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id),
  status TEXT NOT NULL, added INTEGER NOT NULL DEFAULT 0, removed INTEGER NOT NULL DEFAULT 0,
  unchanged INTEGER NOT NULL DEFAULT 0, error TEXT
);
`;

type Row = Record<string, unknown>;

export interface IndexChange {
  chunkId: string;
  change: "added" | "removed";
  title: string;
  heading: string;
}

const toDoc = (r: Row) =>
  Doc.parse({
    id: r.id, workspaceId: r.workspace_id, path: r.path, title: r.title, url: r.url,
    license: r.license, sha256: r.sha256, status: r.status, error: r.error ?? null,
  });

const toChunk = (r: Row) =>
  Chunk.parse({
    chunkId: r.chunk_id, documentId: r.document_id, workspaceId: r.workspace_id, title: r.title,
    heading: r.heading, text: r.text, url: r.url, page: r.page ?? null,
  });

const toJob = (r: Row) =>
  Job.parse({
    id: r.id, workspaceId: r.workspace_id, status: r.status, added: r.added,
    removed: r.removed, unchanged: r.unchanged, error: r.error ?? null,
  });

/** All reads take a workspace id: there is no query that spans workspaces. */
export class Store {
  readonly db: DatabaseSync;

  constructor(file = ":memory:") {
    this.db = new DatabaseSync(file);
    this.db.exec("PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;");
    this.db.exec(SCHEMA);
  }

  upsertWorkspace(w: Workspace): void {
    const v = Workspace.parse(w);
    this.db
      .prepare("INSERT INTO workspaces VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET name=excluded.name, source=excluded.source, license=excluded.license")
      .run(v.id, v.name, v.source, v.license);
  }

  workspaces(): Workspace[] {
    return this.db.prepare("SELECT * FROM workspaces ORDER BY id").all().map((r) => Workspace.parse(r));
  }

  upsertDocument(d: Doc): void {
    const v = Doc.parse(d);
    this.db
      .prepare(
        `INSERT INTO documents VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET title=excluded.title, url=excluded.url, license=excluded.license,
           sha256=excluded.sha256, status=excluded.status, error=excluded.error`,
      )
      .run(v.id, v.workspaceId, v.path, v.title, v.url, v.license, v.sha256, v.status, v.error);
  }

  setDocumentStatus(id: string, status: DocumentStatus, error: string | null = null): void {
    this.db.prepare("UPDATE documents SET status = ?, error = ? WHERE id = ?").run(status, error, id);
  }

  document(workspaceId: WorkspaceId, path: string): Doc | null {
    const r = this.db.prepare("SELECT * FROM documents WHERE workspace_id = ? AND path = ?").get(workspaceId, path);
    return r ? toDoc(r) : null;
  }

  documents(workspaceId: WorkspaceId): Doc[] {
    return this.db.prepare("SELECT * FROM documents WHERE workspace_id = ? ORDER BY path").all(workspaceId).map(toDoc);
  }

  insertChunks(chunks: readonly Chunk[]): void {
    const stmt = this.db.prepare("INSERT OR IGNORE INTO chunks VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    this.tx(() => {
      for (const c of chunks) stmt.run(c.chunkId, c.workspaceId, c.documentId, c.title, c.heading, c.text, c.url, c.page);
    });
  }

  deleteDocument(workspaceId: WorkspaceId, id: string): void {
    this.tx(() => {
      this.db.prepare("DELETE FROM chunks WHERE workspace_id = ? AND document_id = ?").run(workspaceId, id);
      this.db.prepare("DELETE FROM documents WHERE workspace_id = ? AND id = ?").run(workspaceId, id);
    });
  }

  /** 0 when nothing has been indexed yet. */
  indexVersion(workspaceId: WorkspaceId): number {
    const r = this.db.prepare("SELECT MAX(version) v FROM index_versions WHERE workspace_id = ?").get(workspaceId);
    return Number(r?.v ?? 0);
  }

  addIndexVersion(
    workspaceId: WorkspaceId,
    jobId: string,
    counts: { added: number; removed: number; unchanged: number },
    changes: readonly IndexChange[],
  ): number {
    return this.tx(() => {
      const version = this.indexVersion(workspaceId) + 1;
      this.db
        .prepare("INSERT INTO index_versions VALUES (?, ?, ?, ?, ?, ?)")
        .run(workspaceId, version, jobId, counts.added, counts.removed, counts.unchanged);
      const stmt = this.db.prepare("INSERT OR IGNORE INTO index_changes VALUES (?, ?, ?, ?, ?, ?)");
      for (const c of changes) stmt.run(workspaceId, version, c.chunkId, c.change, c.title, c.heading);
      return version;
    });
  }

  indexChanges(workspaceId: WorkspaceId, version: number): IndexChange[] {
    return this.db
      .prepare("SELECT chunk_id, change, title, heading FROM index_changes WHERE workspace_id = ? AND version = ? ORDER BY change, title, heading")
      .all(workspaceId, version)
      .map((r) => ({ chunkId: String(r.chunk_id), change: r.change as "added" | "removed", title: String(r.title), heading: String(r.heading) }));
  }

  chunkIdsOf(documentId: string): string[] {
    return this.db.prepare("SELECT chunk_id FROM chunks WHERE document_id = ?").all(documentId).map((r) => String(r.chunk_id));
  }

  deleteChunks(workspaceId: WorkspaceId, chunkIds: readonly string[]): void {
    const stmt = this.db.prepare("DELETE FROM chunks WHERE workspace_id = ? AND chunk_id = ?");
    this.tx(() => {
      for (const id of chunkIds) stmt.run(workspaceId, id);
    });
  }

  chunksOf(documentId: string): Chunk[] {
    return this.db.prepare("SELECT * FROM chunks WHERE document_id = ? ORDER BY rowid").all(documentId).map(toChunk);
  }

  chunks(workspaceId: WorkspaceId): Chunk[] {
    return this.db.prepare("SELECT * FROM chunks WHERE workspace_id = ? ORDER BY document_id, rowid").all(workspaceId).map(toChunk);
  }

  chunk(workspaceId: WorkspaceId, chunkId: string): Chunk | null {
    const r = this.db.prepare("SELECT * FROM chunks WHERE workspace_id = ? AND chunk_id = ?").get(workspaceId, chunkId);
    return r ? toChunk(r) : null;
  }

  createJob(id: string, workspaceId: WorkspaceId): void {
    this.db.prepare("INSERT INTO jobs (id, workspace_id, status) VALUES (?, ?, 'running')").run(id, workspaceId);
  }

  finishJob(id: string, counts: { added: number; removed: number; unchanged: number }, error: string | null = null): void {
    this.db
      .prepare("UPDATE jobs SET status = ?, added = ?, removed = ?, unchanged = ?, error = ? WHERE id = ?")
      .run(error ? "failed" : "done", counts.added, counts.removed, counts.unchanged, error, id);
  }

  job(workspaceId: WorkspaceId, id: string): Job | null {
    const r = this.db.prepare("SELECT * FROM jobs WHERE workspace_id = ? AND id = ?").get(workspaceId, id);
    return r ? toJob(r) : null;
  }

  private depth = 0;

  /** Runs fn in one transaction; rolls back if it throws. Nested calls join the outer one. */
  tx<T>(fn: () => T): T {
    if (this.depth > 0) return fn();
    this.depth++;
    this.db.exec("BEGIN");
    try {
      const out = fn();
      this.db.exec("COMMIT");
      return out;
    } catch (e) {
      this.db.exec("ROLLBACK");
      throw e;
    } finally {
      this.depth--;
    }
  }

  close(): void {
    this.db.close();
  }
}
