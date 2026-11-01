import { WorkspaceId } from "@/core/domain/schemas";
import { loadEnv } from "@/core/env";
import { openStore } from "@/core/store/open";

/** Ingestion job status: running / done / failed with added, removed and unchanged counts. */
export async function GET(_request: Request, ctx: RouteContext<"/api/workspaces/[id]/jobs/[jobId]">) {
  const { id, jobId } = await ctx.params;
  if (!WorkspaceId.safeParse(id).success) return Response.json({ error: { code: "not_found", message: "No such job." } }, { status: 404 });
  const store = openStore(loadEnv(process.env).dataDir);
  try {
    const job = store.job(id, jobId);
    if (!job) return Response.json({ error: { code: "not_found", message: "No such job." } }, { status: 404 });
    return Response.json(job);
  } finally {
    store.close();
  }
}
