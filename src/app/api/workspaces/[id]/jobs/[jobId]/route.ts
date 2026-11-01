import { loadEnv } from "@/core/env";
import { openStore } from "@/core/store/open";
import { authorizeRequest, fail } from "../../../../_lib/http";

/** Ingestion job status: running / done / failed with added, removed and unchanged counts. */
export async function GET(_request: Request, ctx: RouteContext<"/api/workspaces/[id]/jobs/[jobId]">) {
  const { id, jobId } = await ctx.params;
  const auth = await authorizeRequest(id);
  if (auth instanceof Response) return auth;
  const store = openStore(loadEnv(process.env).dataDir);
  try {
    const job = store.job(auth.workspaceId, jobId);
    if (!job) return fail(404, "not_found", "No such job.");
    return Response.json(job);
  } finally {
    store.close();
  }
}
