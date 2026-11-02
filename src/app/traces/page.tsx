import type { Metadata } from "next";
import Link from "next/link";
import { Denied } from "@/components/Denied";
import { Waterfall } from "@/components/traces/Waterfall";
import { Card } from "@/components/ui/Card";
import { Empty } from "@/components/ui/Empty";
import { Pill, type Tone } from "@/components/ui/Pill";
import { WorkspaceTabs } from "@/components/WorkspaceTabs";
import type { TraceRow } from "@/core/store/sqlite";
import { getServices } from "../api/_lib/services";
import { pageUser } from "../_lib/session";
import { chooseWorkspace } from "../_lib/workspace";

export const metadata: Metadata = { title: "Traces" };

const TONE: Record<string, Tone> = { answered: "success", abstained: "warn", failed: "danger" };

interface TraceResult {
  abstainReason: string | null;
  failure: string | null;
  claims: { text: string; labels: string[]; chunkIds: string[] }[];
  dropped: { text: string; reason: string }[];
  invalidCitations: string[];
  passages: { label: string; chunkId: string }[];
  retrievedIds: string[];
  budgetDroppedIds: string[];
  usage: { prompt_tokens: number; completion_tokens: number } | null;
  cached: boolean;
}

export default async function TracesPage({ searchParams }: PageProps<"/traces">) {
  const sp = await searchParams;
  const user = await pageUser();
  const { workspaces, current, requested } = chooseWorkspace(user, sp.ws);
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-light tracking-tight">Traces</h1>
          <p className="mt-1 max-w-xl text-muted">What happened inside each answer: timings, versions, passages and the citation check.</p>
        </div>
        <WorkspaceTabs workspaces={workspaces} current={current?.id ?? ""} path="/traces" />
      </header>
      {!current ? <Denied user={user} workspace={requested} /> : <TracesBody ws={current.id} id={typeof sp.id === "string" ? sp.id : null} />}
    </div>
  );
}

function TracesBody({ ws, id }: { ws: string; id: string | null }) {
  const { store } = getServices();
  const traces = store.traces(ws, 30);
  if (!traces.length) return <Empty title="No requests yet" hint="Ask a question on the Ask page; its trace appears here." />;
  const selected = (id ? store.trace(ws, id) : null) ?? traces[0];
  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <Card className="lg:col-span-4" title="Recent requests" hint={`${traces.length} in this workspace`}>
        <ul className="divide-y divide-line/70">
          {traces.map((t) => (
            <li key={t.id}>
              <Link
                href={`/traces?ws=${ws}&id=${t.id}`}
                aria-current={t.id === selected.id ? "true" : undefined}
                className="block rounded-xl px-2 py-2.5 hover:bg-surface-2 aria-[current=true]:bg-brand-bg/60"
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-muted">{t.id}</span>
                  <Pill tone={TONE[t.status] ?? "neutral"}>{t.status}</Pill>
                </span>
                <span className="mt-1 block truncate text-sm">{t.question}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Card>
      <TraceDetail t={selected} />
    </div>
  );
}

function TraceDetail({ t }: { t: TraceRow }) {
  const r = t.result as TraceResult;
  const sent = new Set(r.passages.map((p) => p.chunkId));
  return (
    <div className="space-y-6 lg:col-span-8">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-xs text-muted">{t.id}</p>
            <h2 className="mt-1 font-display text-xl">{t.question}</h2>
          </div>
          <Pill tone={TONE[t.status] ?? "neutral"} dot>
            {t.status === "answered" ? `${r.claims.length} of ${r.claims.length + r.dropped.length} claims cited` : t.status}
          </Pill>
        </div>
        <p className="mt-3 font-mono text-xs text-muted">
          user {t.userId} · workspace {t.workspaceId} · prompt {t.promptVersion} ({t.promptSha}) · index v{t.indexVersion} · model {t.model}
          {r.cached ? " · cached" : ""}
          {r.usage ? ` · ${r.usage.prompt_tokens} in / ${r.usage.completion_tokens} out tokens` : ""}
        </p>
      </Card>
      <Card title="Timeline" hint="Measured on the server for this request.">
        <Waterfall stages={t.stages} />
      </Card>
      <div className="grid gap-6 md:grid-cols-2">
        <Card title="Context" hint={`${r.retrievedIds.length} retrieved · ${r.passages.length} sent · ${r.budgetDroppedIds.length} dropped by the token budget`}>
          <ul className="space-y-1.5 font-mono text-xs">
            {r.retrievedIds.map((id) => (
              <li key={id} className="flex items-center justify-between gap-2">
                <span className="text-muted">{id}</span>
                {sent.has(id) ? (
                  <Pill tone="brand" mono>
                    {r.passages.find((p) => p.chunkId === id)?.label}
                  </Pill>
                ) : (
                  <Pill mono>dropped</Pill>
                )}
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Validation">
          <ul className="space-y-2 text-sm">
            <Check ok={!r.failure} label={r.failure ? `Model output rejected: ${r.failure}` : "Reply matched the answer schema"} />
            <Check ok={r.invalidCitations.length === 0} label={r.invalidCitations.length ? `Unknown citations removed: ${r.invalidCitations.join(", ")}` : "Every citation pointed at a passage that was sent"} />
            <Check ok={r.dropped.length === 0} label={r.dropped.length ? `${r.dropped.length} claim(s) dropped for missing citations` : "No claim without a citation"} />
            {r.abstainReason && <li className="text-warn">Abstained: {r.abstainReason.replaceAll("_", " ")}</li>}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function Check({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className={`flex items-start gap-2 ${ok ? "" : "text-danger"}`}>
      <span aria-hidden className={`mt-1.5 size-2 shrink-0 rounded-full ${ok ? "bg-success" : "bg-danger"}`} />
      <span>
        <span className="sr-only">{ok ? "Passed: " : "Failed: "}</span>
        {label}
      </span>
    </li>
  );
}
