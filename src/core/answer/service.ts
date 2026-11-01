import type { Chunk, WorkspaceId } from "../domain/schemas";
import type { LlmClient } from "../llm/port";
import type { SearchService } from "../search/service";
import { assembleContext, DEFAULT_CONTEXT_TOKENS, renderContext } from "./context";
import { buildAnswerMessages } from "./prompt";
import { buildAnswerRequest, parseAnswer, type ParseFailure } from "./schema";
import { validateCitations, type CitedClaim, type DroppedClaim } from "./validate";

export const RETRIEVE_TOP_K = 8;

export type AbstainReason = "no_passages" | "model_said_insufficient" | "no_supported_claims";

export interface AnswerResult {
  status: "answered" | "abstained" | "failed";
  abstainReason: AbstainReason | null;
  failure: ParseFailure | null;
  claims: CitedClaim[];
  dropped: DroppedClaim[];
  invalidCitations: string[];
  /** Passages sent to the model, by label: the evidence panel shows these. */
  passages: { label: string; chunk: Chunk }[];
  retrievedIds: string[];
  budgetDroppedIds: string[];
  indexVersion: number;
  usage: { prompt_tokens: number; completion_tokens: number } | null;
  cached: boolean;
}

/**
 * Question -> hybrid search -> budgeted context -> strict JSON answer -> citation check.
 * It never returns an uncited claim: anything unsupported ends as an abstention.
 */
export class AnswerService {
  constructor(
    private readonly search: SearchService,
    private readonly llm: LlmClient,
    private readonly model: string,
    private readonly contextTokens = DEFAULT_CONTEXT_TOKENS,
  ) {}

  async answer(workspaceId: WorkspaceId, question: string, signal?: AbortSignal): Promise<AnswerResult> {
    const { indexVersion, results } = await this.search.search(workspaceId, question, ["hybrid"], RETRIEVE_TOP_K);
    const hits = results[0].hits;
    const ctx = assembleContext(hits, this.contextTokens);
    const base = {
      claims: [] as CitedClaim[],
      dropped: [] as DroppedClaim[],
      invalidCitations: [] as string[],
      passages: ctx.items,
      retrievedIds: hits.map((h) => h.chunk.chunkId),
      budgetDroppedIds: ctx.dropped,
      indexVersion,
      failure: null,
      usage: null,
      cached: false,
    };
    if (ctx.items.length === 0) return { ...base, status: "abstained", abstainReason: "no_passages" };

    const res = await this.llm.complete(buildAnswerRequest(buildAnswerMessages(question, renderContext(ctx)), this.model), signal);
    const meta = { usage: res.usage, cached: res.cached };
    const parsed = parseAnswer(res);
    if (!parsed.ok) return { ...base, ...meta, status: "failed", abstainReason: null, failure: parsed.failure };
    if (parsed.value.insufficient_evidence) return { ...base, ...meta, status: "abstained", abstainReason: "model_said_insufficient" };

    const v = validateCitations(parsed.value, ctx.items);
    const out = { ...base, ...meta, claims: v.claims, dropped: v.dropped, invalidCitations: v.invalidCitations };
    if (v.claims.length === 0) return { ...out, status: "abstained", abstainReason: "no_supported_claims" };
    return { ...out, status: "answered", abstainReason: null };
  }
}
