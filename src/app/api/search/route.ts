import { z } from "zod";
import { Method } from "@/core/domain/schemas";
import { authorizeRequest, fail } from "../_lib/http";
import { getServices } from "../_lib/services";

const Body = z.object({
  workspaceId: z.string(),
  query: z.string().trim().min(1).max(500),
  methods: z.array(Method).min(1).default(["bm25", "dense", "hybrid"]),
  topK: z.number().int().min(1).max(50).default(10),
});

/** POST /api/search: ranked chunks per method, for one workspace the user may read. */
export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail(400, "bad_request", parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "));
  const auth = await authorizeRequest(parsed.data.workspaceId);
  if (auth instanceof Response) return auth;
  const { indexVersion, results } = await getServices().search.search(auth.workspaceId, parsed.data.query, parsed.data.methods, parsed.data.topK);
  return Response.json({
    workspaceId: auth.workspaceId,
    indexVersion,
    results: results.map((r) => ({
      method: r.method,
      unavailable: r.unavailable,
      hits: r.hits.map((h) => ({
        rank: h.rank, score: h.score, chunkId: h.chunk.chunkId, title: h.chunk.title,
        heading: h.chunk.heading, url: h.chunk.url, snippet: h.chunk.text.slice(0, 280),
      })),
    })),
  });
}
