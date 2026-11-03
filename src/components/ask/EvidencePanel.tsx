"use client";
import { ExternalLink, X } from "lucide-react";
import { shortPath } from "../lab/types";
import { claimTerms, highlight, passageBlocks, type Segment } from "./highlight";
import type { Passage } from "./types";

/**
 * The passage behind the selected citation. Desktop: a pane with one scroll. Phone: a bottom sheet
 * that leaves the cited sentence visible above it.
 */
export function EvidencePanel({
  passages,
  selected,
  claim,
  onSelect,
  onClose,
  sheetOpen = true,
}: {
  passages: Passage[];
  selected: string | null;
  claim: string | null;
  onSelect: (label: string) => void;
  onClose: () => void;
  /** Phones only: whether the bottom sheet is open. The desktop column is always shown. */
  sheetOpen?: boolean;
}) {
  const current = passages.find((p) => p.label === selected) ?? null;
  const terms = claim ? claimTerms(claim) : [];
  return (
    <aside
      aria-label="Evidence"
      className={`${current && sheetOpen ? "flex" : "hidden"} fixed inset-x-0 bottom-16 z-20 max-h-[55vh] flex-col rounded-t-[20px] border border-line bg-surface shadow-card lg:static lg:flex lg:max-h-none lg:min-h-0 lg:rounded-[20px] lg:bg-surface/85`}
    >
      <header className="border-b border-line px-5 pb-3 pt-4">
        <div aria-hidden className="mx-auto mb-3 h-1 w-10 rounded-full bg-line lg:hidden" />
        <div className="flex items-center gap-3">
          <h2 className="font-display text-base font-medium">Evidence</h2>
          {passages.length > 0 && <span className="font-mono text-xs text-muted">{passages.length} passages sent</span>}
          <button type="button" onClick={onClose} aria-label="Close evidence" className="ml-auto grid size-8 place-items-center rounded-full text-muted hover:text-ink lg:hidden">
            <X aria-hidden className="size-4" />
          </button>
        </div>
        {passages.length > 0 && (
          <div className="-mx-1 mt-2 flex gap-1 overflow-x-auto px-1 pb-1">
            {passages.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => onSelect(p.label)}
                aria-pressed={p.label === selected}
                className="shrink-0 rounded-md px-2.5 py-1 font-mono text-xs text-muted hover:text-ink aria-pressed:bg-brand-bg aria-pressed:text-brand aria-pressed:outline aria-pressed:outline-1 aria-pressed:outline-brand"
              >
                {p.label}
              </button>
            ))}
          </div>
        )}
      </header>
      {!current ? (
        <p className="p-5 text-sm text-muted">
          Ask a question, then click a citation such as <span className="font-mono text-brand">c1</span> to read the passage behind it.
        </p>
      ) : (
        <>
          {/* One scroll for the whole passage; tabIndex lets keyboard users scroll it. */}
          <div role="region" aria-label={`Passage ${current.label}`} tabIndex={0} className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-5 focus:outline-none">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="text-lg font-medium leading-snug">{current.title}</p>
                <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
                  <span className="rounded-full bg-surface-2 px-2 py-0.5 text-muted">chunk {current.chunkId.slice(0, 8)}</span>
                  {current.page && <span className="rounded-full bg-surface-2 px-2 py-0.5 text-muted">page {current.page}</span>}
                </div>
              </div>
              <p className="break-all font-mono text-xs text-muted">{shortPath(current.url)}</p>
              {current.heading && (
                <p className="text-sm">
                  <span className="micro mr-2">Section</span>
                  {current.heading}
                </p>
              )}
            </div>
            <div className="space-y-3 border-t border-line pt-4 text-[15px] leading-7 text-ink">
              {passageBlocks(current.text).map((b, i) =>
                b.kind === "code" ? (
                  <pre key={i} className="overflow-x-auto rounded-xl border border-line bg-surface-2 p-3 font-mono text-xs leading-relaxed">
                    <Marked segments={highlight(b.text, terms)} />
                  </pre>
                ) : (
                  // one <p> per paragraph: blank lines inside a block would render as tall gaps
                  b.text.split(/\n\s*\n/).map((para, j) => (
                    <p key={`${i}-${j}`} className="whitespace-pre-wrap break-words">
                      <Marked segments={highlight(para, terms)} />
                    </p>
                  ))
                ),
              )}
            </div>
          </div>
          <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-5 py-3 text-xs text-muted">
            {claim ? <span>Underlined: words this passage shares with the selected claim.</span> : <span />}
            {current.url.startsWith("http") && (
              <a href={current.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-brand hover:underline">
                Open in source <ExternalLink aria-hidden className="size-3.5" />
              </a>
            )}
          </footer>
        </>
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
