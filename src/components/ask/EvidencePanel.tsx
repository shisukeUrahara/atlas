"use client";
import { ExternalLink, X } from "lucide-react";
import { shortPath } from "../lab/types";
import { claimTerms, highlight, passageBlocks, type Segment } from "./highlight";
import type { Passage } from "./types";

/**
 * The passage behind the selected citation. Desktop: a sticky column. Phone: a bottom sheet
 * that leaves the cited sentence visible above it.
 */
export function EvidencePanel({
  passages,
  selected,
  claim,
  onSelect,
  onClose,
}: {
  passages: Passage[];
  selected: string | null;
  claim: string | null;
  onSelect: (label: string) => void;
  onClose: () => void;
}) {
  const current = passages.find((p) => p.label === selected) ?? null;
  const terms = claim ? claimTerms(claim) : [];
  return (
    <aside
      aria-label="Evidence"
      className={`${current ? "fixed" : "hidden"} inset-x-0 bottom-16 z-20 max-h-[55vh] overflow-y-auto rounded-t-[20px] border border-line bg-surface p-5 shadow-card lg:sticky lg:top-24 lg:block lg:max-h-[calc(100vh-8rem)] lg:rounded-[20px] lg:bg-surface/85`}
    >
      <div aria-hidden className="mx-auto mb-3 h-1 w-10 rounded-full bg-line lg:hidden" />
      <header className="flex items-center justify-between gap-2">
        <h2 className="font-display text-base font-medium">Evidence</h2>
        <div className="flex items-center gap-1">
          {passages.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => onSelect(p.label)}
              aria-pressed={p.label === selected}
              className="rounded-md px-2 py-0.5 font-mono text-xs text-muted aria-pressed:bg-brand-bg aria-pressed:text-brand aria-pressed:outline aria-pressed:outline-1 aria-pressed:outline-brand"
            >
              {p.label}
            </button>
          ))}
          <button type="button" onClick={onClose} aria-label="Close evidence" className="ml-1 grid size-8 place-items-center rounded-full text-muted hover:text-ink lg:hidden">
            <X aria-hidden className="size-4" />
          </button>
        </div>
      </header>
      {!current ? (
        <p className="mt-6 text-sm text-muted">Ask a question, then click a citation such as <span className="font-mono text-brand">c1</span> to read the passage behind it.</p>
      ) : (
        <div className="mt-4 space-y-3">
          <div>
            <p className="font-medium">{current.title}</p>
            <p className="break-all font-mono text-xs text-muted">{shortPath(current.url)}</p>
          </div>
          <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
            <span className="rounded-full bg-surface-2 px-2 py-0.5 text-muted">chunk {current.chunkId.slice(0, 8)}</span>
            {current.page && <span className="rounded-full bg-surface-2 px-2 py-0.5 text-muted">page {current.page}</span>}
          </div>
          {current.heading && (
            <div>
              <p className="micro">Section</p>
              <p className="text-sm">{current.heading}</p>
            </div>
          )}
          <div className="max-h-96 space-y-3 overflow-y-auto rounded-xl bg-surface-2 p-4 text-sm leading-relaxed text-ink">
            {passageBlocks(current.text).map((b, i) =>
              b.kind === "code" ? (
                <pre key={i} className="overflow-x-auto rounded-lg border border-line bg-canvas/60 p-3 font-mono text-xs leading-relaxed">
                  <Marked segments={highlight(b.text, terms)} />
                </pre>
              ) : (
                <p key={i} className="whitespace-pre-wrap break-words">
                  <Marked segments={highlight(b.text, terms)} />
                </p>
              ),
            )}
          </div>
          {claim && <p className="text-xs text-muted">Underlined: words this passage shares with the selected claim.</p>}
          {current.url.startsWith("http") && (
            <a href={current.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-brand hover:underline">
              Open in source <ExternalLink aria-hidden className="size-3.5" />
            </a>
          )}
        </div>
      )}
    </aside>
  );
}

function Marked({ segments }: { segments: Segment[] }) {
  return segments.map((s, i) =>
    s.mark ? (
      <mark key={i} className="evidence-mark">
        {s.text}
      </mark>
    ) : (
      <span key={i}>{s.text}</span>
    ),
  );
}
