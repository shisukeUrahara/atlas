"use client";
import { useState } from "react";
import { AskThread } from "./AskThread";
import { EvidencePanel } from "./EvidencePanel";
import type { Passage } from "./types";

interface Evidence {
  passages: Passage[];
  label: string | null;
  claim: string | null;
}

/** Thread plus the evidence column; selecting a citation in the thread drives the panel. */
export function AskView({ workspaceId, workspaceName, draft }: { workspaceId: string; workspaceName: string; draft: string }) {
  const [ev, setEv] = useState<Evidence>({ passages: [], label: null, claim: null });
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
      <AskThread
        key={workspaceId + draft}
        workspaceId={workspaceId}
        workspaceName={workspaceName}
        draft={draft}
        onEvidence={(passages, label, claim) => setEv({ passages, label, claim })}
      />
      <EvidencePanel
        passages={ev.passages}
        selected={ev.label}
        claim={ev.claim}
        onSelect={(label) => setEv((e) => ({ ...e, label }))}
        onClose={() => setEv((e) => ({ ...e, label: null }))}
      />
    </div>
  );
}
