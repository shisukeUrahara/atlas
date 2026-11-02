import type { Metadata } from "next";
import Link from "next/link";
import { AskView } from "@/components/ask/AskView";
import { Denied } from "@/components/Denied";
import { WorkspaceTabs } from "@/components/WorkspaceTabs";
import { getServices } from "../api/_lib/services";
import { pageUser } from "../_lib/session";
import { chooseWorkspace } from "../_lib/workspace";

export const metadata: Metadata = { title: "Ask" };

export default async function AskPage({ searchParams }: PageProps<"/ask">) {
  const sp = await searchParams;
  const user = await pageUser();
  const { workspaces, current, requested } = chooseWorkspace(user, sp.ws);
  const draft = typeof sp.q === "string" ? sp.q.slice(0, 500) : "";
  const recent = current ? getServices().store.traces(current.id, 20).filter((t) => t.userId === user).slice(0, 6) : [];
  const docCount = current ? getServices().store.documents(current.id).length : 0;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-light tracking-tight">Ask the docs. Check every claim.</h1>
          <p className="mt-1 text-muted">Each sentence cites a passage; click a citation to read it.</p>
        </div>
        <WorkspaceTabs workspaces={workspaces} current={current?.id ?? ""} path="/ask" />
      </header>
      {!current ? (
        <Denied user={user} workspace={requested} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-12">
          <aside className="space-y-5 lg:col-span-3">
            <div>
              <p className="micro">Workspace</p>
              <p className="mt-1 font-medium">{current.name}</p>
              <p className="font-mono text-xs text-muted">
                {current.source} · {current.license} · {docCount} docs
              </p>
            </div>
            <div>
              <p className="micro">Your recent questions</p>
              {recent.length ? (
                <ul className="mt-2 divide-y divide-line/70 text-sm">
                  {recent.map((t) => (
                    <li key={t.id}>
                      <Link href={`/ask?ws=${current.id}&q=${encodeURIComponent(t.question)}`} className="flex items-center gap-2 py-2 text-muted hover:text-ink">
                        <span aria-hidden className={`size-1.5 shrink-0 rounded-full ${t.status === "answered" ? "bg-success" : t.status === "abstained" ? "bg-warn" : "bg-danger"}`} />
                        <span className="truncate">{t.question}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-sm text-muted">None yet.</p>
              )}
            </div>
          </aside>
          <section aria-label="Conversation" className="lg:col-span-9">
            <AskView workspaceId={current.id} workspaceName={current.name} draft={draft} />
          </section>
        </div>
      )}
    </div>
  );
}
