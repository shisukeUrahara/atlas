"use client";
import { ArrowUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AnswerBlock } from "./AnswerBlock";
import type { AnswerResponse, Passage, Turn } from "./types";

/** Question/answer thread for one workspace. Evidence selection is lifted to the parent. */
export function AskThread({
  workspaceId,
  workspaceName,
  draft,
  onEvidence,
}: {
  workspaceId: string;
  workspaceName: string;
  draft: string;
  /** byUser: a citation was tapped (opens the phone sheet); false when an answer just arrived. */
  onEvidence: (passages: Passage[], label: string | null, claim: string | null, byUser: boolean) => void;
}) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [question, setQuestion] = useState(draft);
  const [selected, setSelected] = useState<{ turn: number; label: string } | null>(null);
  const nextId = useRef(1);
  const log = useRef<HTMLDivElement>(null);

  // Bring the newest question to the top of the pane when it is asked and when its answer arrives.
  useEffect(() => {
    if (turns.length) log.current?.lastElementChild?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [turns]);

  async function ask(q: string) {
    const id = nextId.current++;
    setTurns((t) => [...t, { id, question: q, state: "loading" }]);
    setQuestion("");
    try {
      const res = await fetch("/api/answer", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ workspaceId, question: q }),
      });
      const body = await res.json();
      if (!res.ok) {
        setTurns((t) => t.map((x) => (x.id === id ? { id, question: q, state: "error", code: body?.error?.code ?? "error", message: body?.error?.message ?? `HTTP ${res.status}` } : x)));
        return;
      }
      const answer = body as AnswerResponse;
      setTurns((t) => t.map((x) => (x.id === id ? { id, question: q, state: "done", answer } : x)));
      const first = answer.claims[0]?.citations[0] ?? null;
      setSelected(first ? { turn: id, label: first } : null);
      onEvidence(answer.passages, first, answer.claims[0]?.text ?? null, false);
    } catch {
      setTurns((t) => t.map((x) => (x.id === id ? { id, question: q, state: "error", code: "network", message: "Network error. Try again." } : x)));
    }
  }

  return (
    <div className="flex min-h-[60vh] flex-col lg:min-h-0 lg:rounded-[20px] lg:border lg:border-line lg:bg-surface/60">
      {/* Desktop: this list scrolls on its own; tabIndex lets keyboard users scroll it. */}
      <div ref={log} role="log" aria-label="Conversation" tabIndex={0} className="flex-1 space-y-5 focus:outline-none lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain lg:p-5">
        {turns.length === 0 && (
          <div className="rounded-[20px] border border-dashed border-line p-8 text-center text-sm text-muted">
            Ask about the {workspaceName}. Every sentence in the answer will cite the passage behind it.
          </div>
        )}
        {turns.map((t) => (
          <div key={t.id} className="scroll-mt-24 space-y-3 lg:scroll-mt-5">
            <p className="ml-auto w-fit max-w-[85%] rounded-2xl border border-line bg-surface-2 px-4 py-2.5 text-sm">{t.question}</p>
            <AnswerBlock
              turn={t}
              workspaceId={workspaceId}
              selected={selected?.turn === t.id ? selected.label : null}
              onSelect={(label, claim) => {
                setSelected({ turn: t.id, label });
                if (t.state === "done") onEvidence(t.answer.passages, label, claim, true);
              }}
            />
          </div>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const q = question.trim();
          if (q.length >= 3) void ask(q);
        }}
        className="sticky bottom-20 mt-6 rounded-2xl border border-line bg-surface/95 p-3 backdrop-blur-xl md:bottom-4 lg:static lg:mt-0 lg:rounded-none lg:rounded-b-[20px] lg:border-0 lg:border-t lg:bg-transparent lg:px-5 lg:py-4 lg:backdrop-blur-none"
      >
        <label htmlFor="question" className="micro">
          Ask the {workspaceName}
        </label>
        <div className="mt-1.5 flex items-center gap-2">
          <input
            id="question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a question…"
            maxLength={500}
            className="h-10 min-w-0 flex-1 bg-transparent text-ink placeholder:text-muted focus:outline-none"
          />
          <button
            type="submit"
            disabled={question.trim().length < 3}
            className="inline-flex h-10 items-center gap-1.5 rounded-[10px] bg-primary px-4 text-sm font-medium text-primary-ink active:translate-y-px disabled:opacity-50"
          >
            Ask <ArrowUp aria-hidden className="size-4" />
          </button>
        </div>
        <p className="mt-1 text-xs text-muted">Answers only use this workspace&apos;s documents.</p>
      </form>
    </div>
  );
}
