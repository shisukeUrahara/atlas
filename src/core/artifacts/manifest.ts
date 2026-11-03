import { z } from "zod";

export const RunKind = z.enum(["retrieval", "answers"]);
export type RunKind = z.infer<typeof RunKind>;

/** Everything needed to say what produced a run. Written next to the results. */
export const RunManifest = z.object({
  run_id: z.string(),
  kind: RunKind,
  label: z.string(),
  created_at_utc: z.string(),
  split: z.enum(["tuning", "holdout"]),
  sample_count: z.number().int().nonnegative(),
  /** "llm_draft_pending_review" until every scored question is owner-reviewed. */
  labels: z.enum(["llm_draft_pending_review", "partly_reviewed", "owner_reviewed"]),
  methods: z.array(z.string()),
  embed_model: z.string(),
  answer_model: z.string().nullable(),
  prompt_version: z.string().nullable(),
  prompt_sha: z.string().nullable(),
  index_versions: z.record(z.string(), z.number().int()),
  questions_sha256: z.string().regex(/^[0-9a-f]{64}$/),
  /** sha256 of every scored workspace's sorted chunk ids: gold labels are only valid for this index. */
  chunks_sha256: z.string().regex(/^[0-9a-f]{64}$/),
  git_sha: z.string().regex(/^[0-9a-f]{40}$/),
  git_dirty: z.boolean(),
  allow_dirty: z.boolean(),
  replay: z.boolean(),
  cache_hits: z.number().int().nonnegative(),
  cache_misses: z.number().int().nonnegative(),
});
export type RunManifest = z.infer<typeof RunManifest>;
