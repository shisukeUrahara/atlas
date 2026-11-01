import { WorkspaceId } from "../domain/schemas";

/**
 * Demo identities, chosen by a cookie. This shows server-side authorization, not authentication.
 * ponytail: fixed demo users; swap for a real identity provider before any multi-user deployment.
 */
export const USERS = {
  alice: ["langchain", "cookbook", "uploads"],
  bob: ["cookbook"],
} as const satisfies Record<string, readonly WorkspaceId[]>;

export type UserId = keyof typeof USERS;
export const DEFAULT_USER: UserId = "alice";
export const USER_COOKIE = "atlas_user";

export class AccessDeniedError extends Error {
  constructor(
    readonly user: UserId,
    readonly workspaceId: string,
  ) {
    super(`${user} has no access to workspace "${workspaceId}".`);
  }
}

/** Unknown or missing cookie values fall back to the default demo user. */
export function userFromCookie(value: string | undefined | null): UserId {
  return value && Object.hasOwn(USERS, value) ? (value as UserId) : DEFAULT_USER;
}

export function allowedWorkspaces(user: UserId): readonly string[] {
  return USERS[user];
}

/** The only gate: every workspace-scoped read or write calls this with the server-side user. */
export function authorize(user: UserId, workspaceId: string): WorkspaceId {
  const parsed = WorkspaceId.safeParse(workspaceId);
  if (!parsed.success || !(USERS[user] as readonly string[]).includes(parsed.data)) throw new AccessDeniedError(user, workspaceId);
  return parsed.data;
}
