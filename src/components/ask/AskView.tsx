"use client";
import { useState } from "react";
import { AskThread } from "./AskThread";
import type { Passage } from "./types";

/** Thread plus the evidence column. The evidence panel arrives in the next commit. */
export function AskView({ workspaceId, workspaceName, draft }: { workspaceId: string; workspaceName: string; draft: string }) {
  const [, setEvidence] = useState<{ passages: Passage[]; label: string | null }>({ passages: [], label: null });
  return (
    <AskThread
      key={workspaceId + draft}
      workspaceId={workspaceId}
      workspaceName={workspaceName}
      draft={draft}
      onEvidence={(passages, label) => setEvidence({ passages, label })}
    />
  );
}
