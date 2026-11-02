import Link from "next/link";
import type { Workspace } from "@/core/domain/schemas";

const DOT: Record<string, string> = { langchain: "bg-m-hybrid", cookbook: "bg-m-dense", uploads: "bg-brand" };

/** Segmented control of the workspaces this user may open. Plain links, so it works without JavaScript. */
export function WorkspaceTabs({ workspaces, current, path }: { workspaces: Workspace[]; current: string; path: string }) {
  return (
    <nav aria-label="Workspace" className="inline-flex flex-wrap rounded-full border border-line bg-surface/70 p-1">
      {workspaces.map((w) => (
        <Link
          key={w.id}
          href={`${path}?ws=${w.id}`}
          aria-current={w.id === current ? "true" : undefined}
          className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm text-muted hover:text-ink aria-[current=true]:bg-surface-2 aria-[current=true]:text-ink"
        >
          <span aria-hidden className={`size-1.5 rounded-full ${DOT[w.id] ?? "bg-muted"}`} />
          {w.name}
        </Link>
      ))}
    </nav>
  );
}
