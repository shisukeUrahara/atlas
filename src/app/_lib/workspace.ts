import { allowedWorkspaces, type UserId } from "@/core/auth/access";
import type { Workspace } from "@/core/domain/schemas";
import { getServices } from "../api/_lib/services";

export interface WorkspaceChoice {
  /** Workspaces this user may open, in a stable order. */
  workspaces: Workspace[];
  /** The selected one, or null when the requested id is not allowed (the page shows "denied"). */
  current: Workspace | null;
  requested: string;
}

/** Picks the workspace from ?ws=, defaulting to the user's first allowed one. Access is decided here, server-side. */
export function chooseWorkspace(user: UserId, requested: string | string[] | undefined): WorkspaceChoice {
  const allowed = allowedWorkspaces(user);
  const all = getServices().store.workspaces();
  const workspaces = allowed.map((id) => all.find((w) => w.id === id)).filter((w): w is Workspace => Boolean(w));
  const want = typeof requested === "string" && requested ? requested : (workspaces[0]?.id ?? "");
  return { workspaces, current: workspaces.find((w) => w.id === want) ?? null, requested: want };
}
