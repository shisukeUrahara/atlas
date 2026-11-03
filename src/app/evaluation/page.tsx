import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Empty } from "@/components/ui/Empty";
import { METHOD_INFO, MethodName } from "@/components/ui/Method";
import { Pill } from "@/components/ui/Pill";
import { rightOutcome } from "@/core/metrics/answers";
import { METHODS } from "@/core/eval/retrieval";
import { LABEL_TEXT, loadEval } from "../_lib/runs";

export const metadata: Metadata = { title: "Evaluation" };

const pct = (x: number) => `${(x * 100).toFixed(1)}%`;
const f3 = (x: number) => x.toFixed(3);

export default async function EvaluationPage({ searchParams }: PageProps<"/evaluation">) {
  const sp = await searchParams;
  const split = sp.split === "tuning" ? "tuning" : "holdout";
  const v = loadEval(split);
  const m = v.retrieval?.manifest ?? v.answers?.manifest;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-light tracking-tight">Evaluation</h1>
          <p className="mt-1 max-w-xl text-muted">Every number here comes from a committed run folder in runs/.</p>
        </div>
        <nav aria-label="Split" className="inline-flex rounded-full border border-line bg-surface/70 p-1">
          {(["holdout", "tuning"] as const).map((s) => (
            <Link key={s} href={`/evaluation?split=${s}`} aria-current={s === split ? "true" : undefined} className="rounded-full px-4 py-1.5 text-sm capitalize text-muted aria-[current=true]:bg-surface-2 aria-[current=true]:text-ink">
              {s}
            </Link>
          ))}
        </nav>
      </header>

      {!m ? (
        <Empty title="No evaluation runs yet" hint="Run pnpm atlas eval and pnpm atlas eval-answers; their folders appear in runs/." />
      ) : (
        <>
          {m.labels !== "owner_reviewed" && (
            <p role="note" className="rounded-xl border-l-2 border-warn bg-warn-bg px-4 py-3 text-sm text-warn">
              <strong>{LABEL_TEXT[m.labels]}.</strong>{" "}
              {m.labels === "model_reviewed"
                ? "Gold passages and classes were drafted by GPT-4.1-mini, then every label was checked by a second model family (Claude); no person checked them (docs/labeling_guide.md)."
                : "Gold passages and classes were drafted by an LLM and checked by an LLM judge (docs/labeling_guide.md). Treat these numbers as provisional."}
            </p>
          )}
          <p tabIndex={0} aria-label="Run manifest" className="overflow-x-auto whitespace-nowrap rounded-xl border border-line bg-surface/70 px-4 py-2 font-mono text-xs text-muted">
            {[v.retrieval?.manifest.run_id, v.answers?.manifest.run_id].filter(Boolean).join(" + ")} · git {m.git_sha.slice(0, 7)}
            {m.git_dirty ? " (dirty)" : ""} · questions {m.questions_sha256.slice(0, 8)} · index {Object.entries(m.index_versions).map(([w, n]) => `${w} v${n}`).join(", ")} · {v.answers?.manifest.answer_model ?? ""} · {v.answers?.manifest.prompt_version ?? ""} · {m.replay ? "replay" : "live"}
          </p>

          {v.retrieval && v.answers && <Kpis v={v} />}

          <div className="grid gap-6 lg:grid-cols-12">
            {v.retrieval && (
              <Card className="lg:col-span-7" title="Retrieval by question class" hint={`Recall@5, ${v.retrieval.scores.n} answerable questions`}>
                <div tabIndex={0} role="region" aria-label="Recall@5 by class table" className="overflow-x-auto">
                  <table className="w-full min-w-[420px] text-sm">
                    <thead>
                      <tr className="micro border-b border-line text-left">
                        <th className="py-2 font-medium">Class</th>
                        {METHODS.map((me) => (
                          <th key={me} className="py-2 font-medium"><MethodName method={me} /></th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(v.retrieval.scores.byClass).map(([cls, row]) => {
                        const best = Math.max(...METHODS.map((me) => row.scores[me]["recall@5"]));
                        return (
                          <tr key={cls} className="border-b border-line/70 last:border-0">
                            <td className="py-2.5 font-mono text-xs">{cls} <span className="text-muted">n={row.n}</span></td>
                            {METHODS.map((me) => {
                              const val = row.scores[me]["recall@5"];
                              return (
                                <td key={me} className="py-2.5 pr-3">
                                  <span className={`num font-mono ${val === best ? "font-semibold text-ink" : "text-muted"}`}>{f3(val)}</span>
                                  <span className="mt-1 block h-1 rounded-full bg-surface-2">
                                    <span className={`block h-1 rounded-full ${METHOD_INFO[me].bar}`} style={{ width: `${val * 100}%` }} />
                                  </span>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
            {v.retrieval && (
              <Card className="lg:col-span-5" title="Methods compared" hint="Hit@5, exact McNemar, Holm-adjusted">
                <dl className="divide-y divide-line/70 text-sm">
                  {METHODS.map((me) => (
                    <div key={me} className="flex items-center justify-between gap-3 py-2">
                      <dt><MethodName method={me} /></dt>
                      <dd className="num font-mono text-xs">
                        R@5 {f3(v.retrieval!.scores.overall[me]["recall@5"].point)} · MRR {f3(v.retrieval!.scores.overall[me]["mrr@10"].point)}
                      </dd>
                    </div>
                  ))}
                  {v.retrieval.scores.comparisons.map((c) => (
                    <div key={c.a} className="py-2">
                      <dt className="text-xs text-muted">hybrid vs {c.a}</dt>
                      <dd className="num font-mono text-xs">
                        only hybrid {c.counts.b_only} · only {c.a} {c.counts.a_only} · Holm p {c.pHolm.toFixed(2)} · ΔMRR {c.mrrDiff.point >= 0 ? "+" : ""}
                        {f3(c.mrrDiff.point)} [{f3(c.mrrDiff.lo)}, {f3(c.mrrDiff.hi)}]
                      </dd>
                    </div>
                  ))}
                </dl>
              </Card>
            )}
          </div>

          {v.answers && <Failures v={v} />}
        </>
      )}
    </div>
  );
}

function Kpis({ v }: { v: ReturnType<typeof loadEval> }) {
  const r = v.retrieval!.scores.overall.hybrid["recall@5"];
  const a = v.answers!.scores.overall;
  const abst = v.answers!.cases.filter((c) => c.queryClass === "unanswerable" || c.queryClass === "cross_workspace");
  const tiles = [
    { label: "Right outcome", value: pct(a.rightOutcome), hint: `${v.answers!.cases.filter(rightOutcome).length} of ${a.n} questions` },
    { label: "Correct abstentions", value: `${abst.filter((c) => c.status === "abstained").length} / ${abst.length}`, hint: "unanswerable + cross-workspace" },
    { label: "Cross-workspace leaks", value: String(a.leaks), hint: "must be 0", tone: a.leaks === 0 ? "text-success" : "text-danger" },
    v.timing
      ? {
          label: "Latency p95",
          value: `${(v.timing.summary.p95Ms / 1000).toFixed(2)} s`,
          hint: `p50 ${(v.timing.summary.p50Ms / 1000).toFixed(2)} s · cost $${v.timing.summary.costUsd.toFixed(3)} · ${v.timing.runId === v.answers!.manifest.run_id ? "this run" : `live run ${v.timing.runId}`}`,
        }
      : { label: "Latency p95", value: "—", hint: "replayed from cache: no live timing" },
  ];
  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <Card className="lg:col-span-5" as="div">
        <p className="micro">Recall@5 · hybrid</p>
        <p className="display mt-3 text-6xl">{f3(r.point)}</p>
        <p className="mt-2 font-mono text-xs text-muted">95% CI [{f3(r.lo)}, {f3(r.hi)}] · n = {v.retrieval!.scores.n}</p>
        <div className="relative mt-3 h-1.5 rounded-full bg-surface-2">
          <span className="absolute h-1.5 rounded-full bg-brand/60" style={{ left: `${r.lo * 100}%`, width: `${(r.hi - r.lo) * 100}%` }} />
          <span className="absolute -top-1 h-3.5 w-0.5 bg-brand" style={{ left: `${r.point * 100}%` }} />
        </div>
      </Card>
      <div className="grid gap-4 sm:grid-cols-2 lg:col-span-7">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-[20px] border border-line bg-surface/85 p-5 shadow-card">
            <p className="micro">{t.label}</p>
            <p className={`display mt-2 text-4xl ${t.tone ?? ""}`}>{t.value}</p>
            <p className="mt-1 text-xs text-muted">{t.hint}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Failures({ v }: { v: ReturnType<typeof loadEval> }) {
  const wrong = v.answers!.cases.filter((c) => !rightOutcome(c));
  const misses = (v.retrieval?.cases ?? []).filter((c) => c.methods.hybrid.firstGold === null || c.methods.hybrid.firstGold > 5);
  const questionOf = new Map(v.answers!.cases.map((c) => [c.id, c.question]));
  return (
    <Card title="Failures only" hint={`${wrong.length} wrong answer outcomes · ${misses.length} hybrid misses at rank 5`}>
      <div tabIndex={0} role="region" aria-label="Failures table" className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="micro border-b border-line">
              <th className="py-2 pr-3 font-medium">Id</th>
              <th className="py-2 pr-3 font-medium">Question</th>
              <th className="py-2 pr-3 font-medium">Class</th>
              <th className="py-2 font-medium">What went wrong</th>
            </tr>
          </thead>
          <tbody>
            {wrong.map((c) => (
              <tr key={`a-${c.id}`} className="border-b border-line/70 align-top">
                <td className="py-2.5 pr-3 font-mono text-xs">{c.id}</td>
                <td className="py-2.5 pr-3">{c.question}</td>
                <td className="py-2.5 pr-3 font-mono text-xs text-muted">{c.queryClass}</td>
                <td className="py-2.5">
                  <Pill tone={c.status === "answered" ? "danger" : "warn"}>{c.status === "answered" ? "answered; should abstain" : c.status === "abstained" ? "abstained; should answer" : `failed: ${c.failure}`}</Pill>
                </td>
              </tr>
            ))}
            {misses.map((c) => (
              <tr key={`r-${c.id}`} className="border-b border-line/70 align-top last:border-0">
                <td className="py-2.5 pr-3 font-mono text-xs">{c.id}</td>
                <td className="py-2.5 pr-3">
                  {questionOf.get(c.id) ?? ""} <span className="micro ml-1">retrieval</span>
                </td>
                <td className="py-2.5 pr-3 font-mono text-xs text-muted">{c.queryClass}</td>
                <td className="py-2.5 font-mono text-xs">
                  gold rank: bm25 {c.methods.bm25.firstGold ?? "–"} · dense {c.methods.dense.firstGold ?? "–"} · hybrid {c.methods.hybrid.firstGold ?? "–"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-muted">Discussion of each case: docs/analysis.md.</p>
    </Card>
  );
}
