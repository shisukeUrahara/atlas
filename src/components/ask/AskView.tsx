"use client";
import { useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { AskThread } from "./AskThread";
import { EvidencePanel } from "./EvidencePanel";
import type { Passage } from "./types";

interface Evidence {
  passages: Passage[];
  label: string | null;
  claim: string | null;
  /** Phone bottom sheet: opens only when the user taps a citation, never by itself. */
  sheetOpen: boolean;
}

const MIN = 35;
const MAX = 70;
const clamp = (n: number) => Math.min(MAX, Math.max(MIN, Math.round(n)));

/**
 * Desktop: two panes (conversation | evidence) with a draggable divider; each pane scrolls on its own.
 * Phone: one column, evidence as a bottom sheet.
 */
export function AskView({ workspaceId, workspaceName, draft }: { workspaceId: string; workspaceName: string; draft: string }) {
  const [ev, setEv] = useState<Evidence>({ passages: [], label: null, claim: null, sheetOpen: false });
  const [split, setSplit] = useState(55);
  const grid = useRef<HTMLDivElement>(null);

  function drag(e: ReactPointerEvent) {
    const box = grid.current?.getBoundingClientRect();
    if (!box) return;
    e.preventDefault();
    const move = (m: PointerEvent) => setSplit(clamp(((m.clientX - box.left) / box.width) * 100));
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      document.body.style.userSelect = "";
    };
    document.body.style.userSelect = "none";
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  return (
    <div
      ref={grid}
      style={{ "--split": `${split}%` } as CSSProperties}
      className="grid min-w-0 gap-6 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,var(--split))_16px_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)] lg:gap-0"
    >
      <AskThread
        key={workspaceId + draft}
        workspaceId={workspaceId}
        workspaceName={workspaceName}
        draft={draft}
        onEvidence={(passages, label, claim, byUser) => setEv({ passages, label, claim, sheetOpen: byUser })}
      />
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize conversation and evidence"
        aria-valuenow={split}
        aria-valuemin={MIN}
        aria-valuemax={MAX}
        tabIndex={0}
        onPointerDown={drag}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") setSplit((s) => clamp(s - 5));
          if (e.key === "ArrowRight") setSplit((s) => clamp(s + 5));
        }}
        className="group hidden cursor-col-resize touch-none items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-brand lg:flex"
      >
        <span aria-hidden className="h-10 w-1 rounded-full bg-line transition-colors group-hover:bg-brand group-focus-visible:bg-brand" />
      </div>
      <EvidencePanel
        passages={ev.passages}
        selected={ev.label}
        claim={ev.claim}
        sheetOpen={ev.sheetOpen}
        onSelect={(label) => setEv((e) => ({ ...e, label }))}
        onClose={() => setEv((e) => ({ ...e, sheetOpen: false }))}
      />
    </div>
  );
}
