import { ChevronDown, History } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AskView } from "@/components/ask/AskView";
import { Denied } from "@/components/Denied";
import { WorkspaceTabs } from "@/components/WorkspaceTabs";
import type { TraceRow } from "@/core/store/sqlite";
import { getServices } from "../api/_lib/services";
import { pageUser } from "../_lib/session";
import { chooseWorkspace } from "../_lib/workspace";

export const metadata: Metadata = { title: "Ask" };

export default async function AskPage({ searchParams }: PageProps<"/ask">) {
  const sp = await searchParams;
  const user = await pageUser();
  const { workspaces, current, requested } = chooseWorkspace(user, sp.ws);
  const draft = typeof sp.q === "string" ? sp.q.slice(0, 500) : "";
  const seen = new Set<string>();
  // Newest first, each question once.
  const recent = current
    ? getServices()
        .store.traces(current.id, 50)
        .filter((t) => t.userId === user && !seen.has(t.question) && seen.add(t.question))
        .slice(0, 8)
    : [];

  return (
    // data-app-shell: on desktop the page stops scrolling and the panes scroll instead (globals.css).
    <div data-app-shell className="flex flex-col gap-4 lg:min-h-0 lg:flex-1">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <h1 className="font-display text-xl font-medium tracking-tight">Ask</h1>
        <span aria-hidden className="hidden h-5 w-px bg-line sm:block" />
        <WorkspaceTabs workspaces={workspaces} current={current?.id ?? ""} path="/ask" />
        {current && <RecentQuestions key={draft} workspaceId={current.id} recent={recent} />}
      </header>
      {!current ? (
        <Denied user={user} workspace={requested} />
      ) : (
        <AskView workspaceId={current.id} workspaceName={current.name} draft={draft} />
      )}
    </div>
  );
}

/** Native disclosure menu; keyed by the question so it closes after a pick. */
function RecentQuestions({ workspaceId, recent }: { workspaceId: string; recent: TraceRow[] }) {
  return (
    <details className="group relative ml-auto">
      <summary className="flex h-9 cursor-pointer list-none items-center gap-2 rounded-full px-3 text-sm text-muted hover:text-ink [&::-webkit-details-marker]:hidden">
        <History aria-hidden className="size-4" />
        Recent questions
        <ChevronDown aria-hidden className="size-4 transition-transform group-open:rotate-180" />
      </summary>
      <div className="absolute right-0 z-30 mt-2 w-[min(28rem,calc(100vw-2rem))] rounded-2xl border border-line bg-surface p-2 shadow-card">
        {recent.length ? (
          <ul className="divide-y divide-line/70 text-sm">
            {recent.map((t) => (
              <li key={t.id}>
                <Link href={`/ask?ws=${workspaceId}&q=${encodeURIComponent(t.question)}`} className="flex min-w-0 items-center gap-2 rounded-lg px-2 py-2 text-muted hover:bg-surface-2 hover:text-ink">
                  <span aria-hidden className={`size-1.5 shrink-0 rounded-full ${t.status === "answered" ? "bg-success" : t.status === "abstained" ? "bg-warn" : "bg-danger"}`} />
                  <span className="truncate">{t.question}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-2 py-2 text-sm text-muted">None yet.</p>
        )}
      </div>
    </details>
  );
}
