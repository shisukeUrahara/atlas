import type { Metadata } from "next";
import { Card } from "@/components/ui/Card";
import { Empty } from "@/components/ui/Empty";
import { MethodName } from "@/components/ui/Method";

export const metadata: Metadata = { title: "Evaluation" };

const METRICS = [
  { name: "Recall@5", part: "Retrieval", def: "Share of questions whose labeled passage is in the top 5." },
  { name: "MRR@10", part: "Retrieval", def: "Mean of 1 / rank of the first labeled passage within the top 10." },
  { name: "Cited-claim rate", part: "Answers", def: "Claims shown with at least one valid citation, out of all drafted claims." },
  { name: "Claim support", part: "Answers", def: "Share of reviewed claims whose cited passage really states them (human review)." },
  { name: "Abstention accuracy", part: "Answers", def: "Unanswerable and cross-workspace questions that end in “Not enough evidence”." },
  { name: "Cross-workspace leaks", part: "Safety", def: "Answers citing a chunk from a workspace the user cannot read. Must be 0." },
];

const CLASSES = [
  ["exact_id", "names an API symbol, e.g. InMemorySaver"],
  ["paraphrase", "same need, different words"],
  ["version_new", "a fact that only exists in the pinned new docs"],
  ["unanswerable", "the docs never cover it: the right result is to abstain"],
  ["cross_workspace", "the answer lives in another workspace: abstain, never leak"],
];

/** Every number on this page will come from a saved run folder; until one exists, nothing is shown. */
export default function EvaluationPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-light tracking-tight">Evaluation</h1>
        <p className="mt-1 max-w-xl text-muted">Every number here comes from a saved run folder. No run exists yet, so no number is shown.</p>
      </header>
      <Empty
        title="No evaluation runs yet"
        hint="The 120 labeled questions are the next build step. A run then writes runs/<corpus>/<run-id>/ with a manifest, per-question results and scores."
      />
      <div className="grid gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-7" title="What will be measured">
          <dl className="divide-y divide-line/70">
            {METRICS.map((m) => (
              <div key={m.name} className="grid gap-1 py-3 sm:grid-cols-[180px_minmax(0,1fr)]">
                <dt className="font-medium">
                  {m.name} <span className="micro ml-1">{m.part}</span>
                </dt>
                <dd className="text-sm text-muted">{m.def}</dd>
              </div>
            ))}
          </dl>
        </Card>
        <div className="space-y-6 lg:col-span-5">
          <Card title="Question classes" hint="24 questions each; 40 tuning, 80 holdout (planned).">
            <ul className="space-y-2 text-sm">
              {CLASSES.map(([c, d]) => (
                <li key={c}>
                  <span className="font-mono text-brand">{c}</span> <span className="text-muted">· {d}</span>
                </li>
              ))}
            </ul>
          </Card>
          <Card title="Methods compared">
            <ul className="flex flex-wrap gap-4">
              <li><MethodName method="bm25" /></li>
              <li><MethodName method="dense" /></li>
              <li><MethodName method="hybrid" /></li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
