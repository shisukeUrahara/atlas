import { authorizeRequest, fail } from "../../_lib/http";
import { getServices } from "../../_lib/services";

/** GET /api/traces/{id}?workspace=<id>: stage timings, versions and cited chunk ids for one request. */
export async function GET(request: Request, ctx: RouteContext<"/api/traces/[id]">) {
  const { id } = await ctx.params;
  const auth = authorizeRequest(request, new URL(request.url).searchParams.get("workspace") ?? "");
  if (auth instanceof Response) return auth;
  const trace = getServices().store.trace(auth.workspaceId, id);
  return trace ? Response.json(trace) : fail(404, "not_found", "No such trace in this workspace.");
}
