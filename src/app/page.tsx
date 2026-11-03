import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { passageBlocks } from "@/components/ask/highlight";
import { shortPath } from "@/components/lab/types";
import { Card } from "@/components/ui/Card";
import { CitationChip } from "@/components/ui/CitationChip";
import { Pill } from "@/components/ui/Pill";
import { allowedWorkspaces } from "@/core/auth/access";
import { getServices } from "./api/_lib/services";
import { LABEL_TEXT, loadEval } from "./_lib/runs";
import { pageUser } from "./_lib/session";

const STEPS = [
  ["Ingest", "hash each doc, version each chunk"],
  ["Search", "BM25 + dense, fused"],
  ["Assemble", "fit the token budget"],
  ["Answer", "strict JSON with chunk ids"],
  ["Check", "drop claims with unknown ids"],
];

const EXAMPLE_Q = "How do I add short-term memory to an agent?";

export default async function Home() {
  const user = await pageUser();
  const { store, search } = getServices();
  const allowed = allowedWorkspaces(user);
  const spaces = store.workspaces().filter((w) => allowed.includes(w.id));
  const counts = spaces.map((w) => ({
    w,
    docs: store.documents(w.id).length,
    chunks: [...store.chunkCounts(w.id).values()].reduce((a, n) => a + n, 0),
    version: store.indexVersion(w.id),
  }));
  const lc = counts.find((c) => c.w.id === "langchain");

  const ev = loadEval("holdout");
  // Proof card: a real answered trace, else a real answer from the holdout run, else a live retrieval.
  const trace = lc ? store.traces("langchain", 50).find((t) => t.status === "answered") : undefined;
  // Only for users who may read LangChain: the card shows a LangChain claim and passage.
  const fromRun = lc && !trace ? ev.answers?.cases.find((c) => c.workspaceId === "langchain" && c.status === "answered" && c.queryClass === "paraphrase") : undefined;
  const answered = trace ?? (fromRun ? { id: fromRun.id, question: fromRun.question } : undefined);
  const firstClaim = trace
    ? (trace.result as { claims: { text: string; labels: string[]; chunkIds: string[] }[] }).claims[0]
    : fromRun
      ? { text: fromRun.claims[0].text, labels: ["c1"], chunkIds: fromRun.claims[0].chunkIds }
      : null;
  const proofChunk = firstClaim
    ? store.chunk("langchain", firstClaim.chunkIds[0])
    : lc && lc.chunks
      ? ((await search.search("langchain", EXAMPLE_Q, ["hybrid"], 1)).results[0].hits[0]?.chunk ?? null)
      : null;

  return (
    <div className="space-y-12">
      <section className="grid items-start gap-8 lg:grid-cols-12">
        <div className="lg:col-span-5 lg:pt-6">
          <p className="micro">Evidence-first RAG · LangChain + OpenAI Cookbook docs</p>
          <h1 className="mt-4 font-display text-5xl font-light leading-[1.05] tracking-tight md:text-6xl">
            Answers you can <span className="underline decoration-brand decoration-2 underline-offset-[10px]">check</span>.
          </h1>
          <p className="mt-5 max-w-[46ch] text-muted">
            Atlas answers from the docs you give it. Every sentence cites the passage behind it, and when the docs don&apos;t cover a question it says so instead of guessing.
          </p>
          <Link
            href={lc ? `/ask?ws=langchain&q=${encodeURIComponent(EXAMPLE_Q)}` : "/ask"}
            className="mt-7 inline-flex h-11 items-center gap-2 rounded-[10px] bg-primary px-5 text-sm font-medium text-primary-ink active:translate-y-px"
          >
            Ask the LangChain docs <ArrowRight aria-hidden className="size-4" />
          </Link>
        </div>
        <Card className="lg:col-span-7" as="div">
          {proofChunk ? (
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <p className="micro">Question</p>
                <p className="mt-1 text-sm">“{answered?.question ?? EXAMPLE_Q}”</p>
                <p className="micro mt-5">{firstClaim ? "Atlas answer" : "Retrieved now"}</p>
                {firstClaim ? (
                  <p className="mt-1 text-sm leading-relaxed">
                    {firstClaim.text} <CitationChip label={firstClaim.labels[0]} selected />
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-muted">Hybrid search ran just now on the pinned docs. Written answers appear here once an answered trace exists (needs an API key).</p>
                )}
              </div>
              <div className="rounded-xl bg-surface-2 p-4">
                <p className="flex items-center gap-2 text-sm font-medium">
                  <span className="rounded-md bg-brand-bg px-1.5 font-mono text-[11px] text-brand">{firstClaim?.labels[0] ?? "c1"}</span>
                  {proofChunk.title}
                </p>
                <p className="mt-1 break-all font-mono text-[11px] text-muted">{shortPath(proofChunk.url)}</p>
                <p className="mt-3 line-clamp-6 whitespace-pre-wrap text-sm leading-relaxed">{passageBlocks(proofChunk.text).map((b) => b.text).join("\n\n")}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3 border-t border-line pt-3 md:col-span-2">
                {firstClaim ? (
                  <Pill tone="success" dot mono>
                    cited answer · {trace ? trace.id : `holdout ${answered!.id}`}
                  </Pill>
                ) : (
                  <Pill mono>live retrieval · no answer yet</Pill>
                )}
                <span className="font-mono text-xs text-muted">index v{lc?.version ?? 0}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted">Ingest a corpus to see a live example here.</p>
          )}
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-7" title="How an answer is made">
          <ol className="grid gap-4 sm:grid-cols-5">
            {STEPS.map(([name, hint], i) => (
              <li key={name} className="relative">
                <span className={`grid size-7 place-items-center rounded-full border font-mono text-[11px] ${i === 4 ? "border-success text-success" : "border-line text-muted"}`}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="mt-2 text-sm font-medium">{name}</p>
                <p className="text-xs text-muted">{hint}</p>
              </li>
            ))}
          </ol>
        </Card>
        <Card className="lg:col-span-5" title="Measured, not claimed" action={<Link href="/evaluation" className="text-sm text-brand hover:underline">Evaluation →</Link>}>
          <dl className="divide-y divide-line/70 text-sm">
            {counts.map((c) => (
              <div key={c.w.id} className="flex justify-between gap-3 py-2">
                <dt>{c.w.name}</dt>
                <dd className="num font-mono text-muted">
                  {c.docs} docs · {c.chunks.toLocaleString("en-US")} chunks · v{c.version}
                </dd>
              </div>
            ))}
            {ev.retrieval && ev.answers ? (
              <>
                {[
                  ["Recall@5, hybrid (holdout)", ev.retrieval.scores.overall.hybrid["recall@5"].point.toFixed(3)],
                  ["Right outcome (holdout)", `${(ev.answers.scores.overall.rightOutcome * 100).toFixed(1)}%`],
                  ["Correct abstentions", `${ev.answers.cases.filter((c) => (c.queryClass === "unanswerable" || c.queryClass === "cross_workspace") && c.status === "abstained").length} / ${ev.answers.cases.filter((c) => c.queryClass === "unanswerable" || c.queryClass === "cross_workspace").length}`],
                  ["Cross-workspace leaks", String(ev.answers.scores.overall.leaks)],
                ].map(([k, val]) => (
                  <div key={k} className="flex justify-between gap-3 py-2">
                    <dt>{k}</dt>
                    <dd className="num font-mono">{val}</dd>
                  </div>
                ))}
              </>
            ) : (
              <div className="flex justify-between gap-3 py-2">
                <dt>Retrieval and answer metrics</dt>
                <dd className="font-mono text-xs text-muted">not measured yet</dd>
              </div>
            )}
          </dl>
          {ev.retrieval && ev.retrieval.manifest.labels !== "owner_reviewed" && <p className="pt-2 text-xs text-warn">{LABEL_TEXT[ev.retrieval.manifest.labels]}.</p>}
        </Card>
      </section>
    </div>
  );
}
