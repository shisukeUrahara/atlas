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
      <div ref={log} role="log" aria-label="Conversation" tabIndex={0} className="flex flex-1 flex-col space-y-5 focus:outline-none lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain lg:p-5">
        {turns.length === 0 && (
          <div className="m-auto max-w-md py-12 text-center">
            <p className="font-display text-2xl font-light tracking-tight">What do you want to check?</p>
            <p className="mt-2 text-sm text-muted">Ask about the {workspaceName}. Every sentence in the answer cites the passage behind it.</p>
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
        className="sticky bottom-20 mt-6 bg-canvas/85 py-2 backdrop-blur-xl md:bottom-4 lg:static lg:mt-0 lg:bg-transparent lg:px-5 lg:pb-4 lg:pt-3 lg:backdrop-blur-none"
      >
        {/* One rounded field with the send button inside, pinned under the conversation. */}
        <div className="flex items-center gap-2 rounded-[28px] border border-line bg-surface-2 py-1.5 pl-5 pr-1.5 shadow-card focus-within:border-brand">
          <label htmlFor="question" className="sr-only">
            Ask the {workspaceName}
          </label>
          <input
            id="question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={`Ask the ${workspaceName}…`}
            maxLength={500}
            autoComplete="off"
            className="h-10 min-w-0 flex-1 bg-transparent text-ink placeholder:text-muted focus:outline-none"
          />
          <button
            type="submit"
            aria-label="Ask"
            title="Ask"
            disabled={question.trim().length < 3}
            className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-primary-ink transition-opacity active:translate-y-px disabled:opacity-40"
          >
            <ArrowUp aria-hidden className="size-5" />
          </button>
        </div>
        <p className="mt-2 text-center text-xs text-muted">Answers only use this workspace&apos;s documents.</p>
      </form>
    </div>
  );
}
