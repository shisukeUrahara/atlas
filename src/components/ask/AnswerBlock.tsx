import { CircleAlert, CircleSlash } from "lucide-react";
import Link from "next/link";
import { CitationChip } from "../ui/CitationChip";
import { Pill } from "../ui/Pill";
import { ABSTAIN_TEXT, type Turn } from "./types";

/** One answer: cited claims, or an abstention, or a failure, never a mix. */
export function AnswerBlock({
  turn,
  workspaceId,
  selected,
  onSelect,
}: {
  turn: Turn;
  workspaceId: string;
  selected: string | null;
  onSelect: (label: string, claim: string) => void;
}) {
  if (turn.state === "loading") {
    return (
      <div aria-busy className="space-y-2 rounded-[20px] border border-line bg-surface/85 p-5">
        <p className="micro">Searching and answering…</p>
        {[90, 75, 60].map((w) => (
          <div key={w} className="h-3 animate-pulse rounded bg-surface-2" style={{ width: `${w}%` }} />
        ))}
      </div>
    );
  }
  if (turn.state === "error") {
    const replay = turn.code === "not_cached";
    return (
      <div role="alert" className={`rounded-[20px] border-l-2 p-5 ${replay ? "border-warn bg-warn-bg" : "border-danger bg-danger-bg"}`}>
        <p className={`flex items-center gap-2 text-sm font-medium ${replay ? "text-warn" : "text-danger"}`}>
          <CircleAlert aria-hidden className="size-4" />
          {replay ? "No API key: replay mode" : "Request failed"}
        </p>
        <p className={`mt-1 text-sm ${replay ? "text-warn" : "text-danger"}`}>{turn.message}</p>
        {replay && <p className="mt-2 text-xs text-warn">Add OPENAI_API_KEY to atlas/.env and restart the app to answer new questions.</p>}
      </div>
    );
  }
  const a = turn.answer;
  const meta = (
    <p className="font-mono text-xs text-muted">
      {a.requestId} · prompt {a.promptVersion} · index v{a.indexVersion}
      {a.cached ? " · cached" : ""} ·{" "}
      <Link className="underline underline-offset-2 hover:text-ink" href={`/traces?ws=${workspaceId}&id=${a.requestId}`}>
        View trace →
      </Link>
    </p>
  );
  if (a.status !== "answered") {
    const failed = a.status === "failed";
    return (
      <div className={`space-y-2 rounded-[20px] border-l-2 bg-surface/85 p-5 ${failed ? "border-danger" : "border-warn"}`}>
        <Pill tone={failed ? "danger" : "warn"} dot mono>
          {failed ? `Model output rejected: ${a.failure}` : "Not enough evidence"}
        </Pill>
        <p className="flex items-start gap-2 text-sm">
          <CircleSlash aria-hidden className="mt-0.5 size-4 shrink-0 text-muted" />
          {failed ? "The model's reply did not match the answer contract, so nothing is shown." : ABSTAIN_TEXT[a.abstainReason ?? "model_said_insufficient"]}
        </p>
        <p className="font-mono text-xs text-muted">searched hybrid · {a.passages.length} passages sent to the model</p>
        {meta}
      </div>
    );
  }
  return (
    <div className="space-y-4 rounded-[20px] border border-line bg-surface/85 p-5 lg:border-0 lg:bg-transparent lg:p-0">
      <div className="space-y-2.5 leading-relaxed">
        {a.claims.map((c, i) => (
          <p key={i} className={`rounded-r-lg border-l-2 px-3 py-1.5 ${selected && c.citations.includes(selected) ? "border-brand bg-brand-bg/50" : "border-transparent"}`}>
            {c.text}{" "}
            {c.citations.map((l) => (
              <CitationChip key={l} label={l} selected={selected === l} onSelect={() => onSelect(l, c.text)} />
            ))}
          </p>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3 border-t border-line pt-3">
        <Pill tone="success" dot mono>
          {a.claims.length} of {a.claims.length + a.droppedClaims} claims cited
        </Pill>
        {meta}
      </div>
    </div>
  );
}
