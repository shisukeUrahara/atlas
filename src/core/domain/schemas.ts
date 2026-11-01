import { z } from "zod";

/** Short hex ids: chunk ids are the first 16 hex chars of a sha256. */
export const HexId = z.string().regex(/^[0-9a-f]{16}$/);
export const Sha256 = z.string().regex(/^[0-9a-f]{64}$/);

export const WorkspaceId = z.string().regex(/^[a-z0-9][a-z0-9-]{0,39}$/);
export type WorkspaceId = z.infer<typeof WorkspaceId>;

export const Workspace = z.object({
  id: WorkspaceId,
  name: z.string().min(1),
  /** Where the corpus came from, e.g. "langchain-ai/docs", or "upload". */
  source: z.string().min(1),
  license: z.string().min(1),
});
export type Workspace = z.infer<typeof Workspace>;

export const DocumentStatus = z.enum(["queued", "ingesting", "indexed", "failed"]);
export type DocumentStatus = z.infer<typeof DocumentStatus>;

export const Doc = z.object({
  id: z.string().min(1),
  workspaceId: WorkspaceId,
  /** Repo-relative path or uploaded file name. */
  path: z.string().min(1),
  title: z.string().min(1),
  url: z.string().min(1),
  license: z.string().min(1),
  /** sha256 of the raw file bytes. Same hash = nothing to re-ingest. */
  sha256: Sha256,
  status: DocumentStatus,
  error: z.string().nullable().default(null),
});
export type Doc = z.infer<typeof Doc>;

export const Chunk = z.object({
  chunkId: HexId,
  documentId: z.string().min(1),
  workspaceId: WorkspaceId,
  title: z.string(),
  /** Heading path inside the document, e.g. "Persistence > Threads". */
  heading: z.string(),
  text: z.string().min(1),
  url: z.string(),
  /** First PDF page of the chunk, when known. */
  page: z.number().int().positive().nullable().default(null),
});
export type Chunk = z.infer<typeof Chunk>;

export const Method = z.enum(["bm25", "dense", "hybrid"]);
export type Method = z.infer<typeof Method>;

export interface ScoredChunk {
  chunk: Chunk;
  score: number;
  /** 1-based. */
  rank: number;
}

export const JobStatus = z.enum(["running", "done", "failed"]);
export const Job = z.object({
  id: z.string().min(1),
  workspaceId: WorkspaceId,
  status: JobStatus,
  added: z.number().int().nonnegative(),
  removed: z.number().int().nonnegative(),
  unchanged: z.number().int().nonnegative(),
  error: z.string().nullable(),
});
export type Job = z.infer<typeof Job>;

/**
 * Question classes. exact_id: names an API symbol. paraphrase: same need, other words.
 * version_new: fact that only exists in the pinned (new) docs. unanswerable: docs never cover it.
 * cross_workspace: answer lives only in another workspace, so the right result is to abstain.
 */
export const QueryClass = z.enum(["exact_id", "paraphrase", "version_new", "unanswerable", "cross_workspace"]);
export type QueryClass = z.infer<typeof QueryClass>;

export const Split = z.enum(["tuning", "holdout"]);
export type Split = z.infer<typeof Split>;

export const EvalCase = z.object({
  id: z.string().regex(/^q\d{3}$/),
  workspaceId: WorkspaceId,
  question: z.string().min(1),
  queryClass: QueryClass,
  split: Split,
  /** Empty for unanswerable and cross_workspace: the right answer is to abstain. */
  goldChunkIds: z.array(HexId),
});
export type EvalCase = z.infer<typeof EvalCase>;
