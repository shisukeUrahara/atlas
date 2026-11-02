import { AccessDeniedError, authorize, USER_COOKIE, userFromCookie, type UserId } from "@/core/auth/access";
import type { WorkspaceId } from "@/core/domain/schemas";

export const fail = (status: number, code: string, message: string) => Response.json({ error: { code, message } }, { status });

/** Reads the demo user from the request's Cookie header (works in route handlers and in tests). */
export function currentUser(request: Request): UserId {
  const header = request.headers.get("cookie") ?? "";
  const value = header
    .split(";")
    .map((p) => p.trim().split("="))
    .find(([k]) => k === USER_COOKIE)?.[1];
  return userFromCookie(value ? decodeURIComponent(value) : undefined);
}

/** Resolves the server-side user and checks the workspace. Returns a 403 response when denied. */
export function authorizeRequest(request: Request, workspaceId: string): { user: UserId; workspaceId: WorkspaceId } | Response {
  const user = currentUser(request);
  try {
    return { user, workspaceId: authorize(user, workspaceId) };
  } catch (e) {
    if (e instanceof AccessDeniedError) return fail(403, "denied", e.message);
    throw e;
  }
}
