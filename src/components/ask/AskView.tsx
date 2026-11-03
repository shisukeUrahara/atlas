"use client";
import { useState } from "react";
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

/** Thread plus the evidence column; selecting a citation in the thread drives the panel. */
export function AskView({ workspaceId, workspaceName, draft }: { workspaceId: string; workspaceName: string; draft: string }) {
  const [ev, setEv] = useState<Evidence>({ passages: [], label: null, claim: null, sheetOpen: false });
  return (
    <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
      <AskThread
        key={workspaceId + draft}
        workspaceId={workspaceId}
        workspaceName={workspaceName}
        draft={draft}
        onEvidence={(passages, label, claim, byUser) => setEv({ passages, label, claim, sheetOpen: byUser })}
      />
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
