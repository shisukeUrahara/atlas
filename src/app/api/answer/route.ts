import { z } from "zod";
import { newRequestId, recordTrace } from "@/core/answer/trace";
import { CacheMissError } from "@/core/llm/errors";
import { ProviderError } from "@/core/llm/errors";
import { authorizeRequest, fail } from "../_lib/http";
import { getServices } from "../_lib/services";

const Body = z.object({ workspaceId: z.string(), question: z.string().trim().min(3).max(500) });

/**
 * POST /api/answer: cited answer for one workspace the user may read.
 * Every response carries a request id whose trace can be opened at /api/traces/{id}.
 */
export async function POST(request: Request) {
  const t0 = performance.now();
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail(400, "bad_request", parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "));
  const auth = authorizeRequest(request, parsed.data.workspaceId);
  if (auth instanceof Response) return auth;
  const authMs = Math.round((performance.now() - t0) * 10) / 10;

  const { store, answers, model } = getServices();
  const id = newRequestId();
  try {
    const r = await answers.answer(auth.workspaceId, parsed.data.question, request.signal);
    const trace = recordTrace(store, { id, workspaceId: auth.workspaceId, userId: auth.user, question: parsed.data.question, model, authMs, now: new Date() }, r);
    return Response.json({
      requestId: id,
      status: r.status,
      abstainReason: r.abstainReason,
      failure: r.failure,
      claims: r.claims.map((c) => ({ text: c.text, citations: c.labels })),
      passages: r.passages.map((p) => ({
        label: p.label, chunkId: p.chunk.chunkId, title: p.chunk.title, heading: p.chunk.heading,
        url: p.chunk.url, page: p.chunk.page, text: p.chunk.text,
      })),
      droppedClaims: r.dropped.length,
      indexVersion: r.indexVersion,
      promptVersion: trace.promptVersion,
      cached: r.cached,
    });
  } catch (e) {
    if (e instanceof CacheMissError) return fail(503, "not_cached", "This question is not in the response cache and the app runs without an API key.");
    if (e instanceof ProviderError) return fail(502, "provider_error", `The model provider failed (${e.status}). Try again.`);
    throw e;
  }
}
