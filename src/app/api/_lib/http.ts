import { cookies } from "next/headers";
import { AccessDeniedError, authorize, USER_COOKIE, userFromCookie, type UserId } from "@/core/auth/access";
import type { WorkspaceId } from "@/core/domain/schemas";

export const fail = (status: number, code: string, message: string) => Response.json({ error: { code, message } }, { status });

export async function currentUser(): Promise<UserId> {
  return userFromCookie((await cookies()).get(USER_COOKIE)?.value);
}

/** Resolves the server-side user and checks the workspace. Returns a 403 response when denied. */
export async function authorizeRequest(workspaceId: string): Promise<{ user: UserId; workspaceId: WorkspaceId } | Response> {
  const user = await currentUser();
  try {
    return { user, workspaceId: authorize(user, workspaceId) };
  } catch (e) {
    if (e instanceof AccessDeniedError) return fail(403, "denied", e.message);
    throw e;
  }
}
