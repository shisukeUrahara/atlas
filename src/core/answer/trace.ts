import type { WorkspaceId } from "../domain/schemas";
import type { Store, TraceRow } from "../store/sqlite";
import { promptSha, PROMPT_VERSION } from "./prompt";
import type { AnswerResult } from "./service";

/** request ids look like req_7f3a9c21: short, unguessable enough for a demo, easy to read aloud. */
export const newRequestId = () => `req_${crypto.randomUUID().replace(/-/g, "").slice(0, 8)}`;

/** Stores what happened for one request. Passage text is not copied: chunk ids point at it. */
export function recordTrace(
  store: Store,
  t: { id: string; workspaceId: WorkspaceId; userId: string; question: string; model: string; authMs: number; now: Date },
  r: AnswerResult,
): TraceRow {
  const row: TraceRow = {
    id: t.id,
    workspaceId: t.workspaceId,
    userId: t.userId,
    question: t.question,
    status: r.status,
    model: t.model,
    promptVersion: PROMPT_VERSION,
    promptSha: promptSha(),
    indexVersion: r.indexVersion,
    stages: [{ name: "auth", ms: t.authMs }, ...r.stages],
    result: {
      abstainReason: r.abstainReason,
      failure: r.failure,
      claims: r.claims,
      dropped: r.dropped,
      invalidCitations: r.invalidCitations,
      passages: r.passages.map((p) => ({ label: p.label, chunkId: p.chunk.chunkId })),
      retrievedIds: r.retrievedIds,
      budgetDroppedIds: r.budgetDroppedIds,
      usage: r.usage,
      cached: r.cached,
    },
    createdAt: t.now.toISOString(),
  };
  store.saveTrace(row);
  return row;
}
