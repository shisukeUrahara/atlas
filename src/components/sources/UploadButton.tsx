"use client";
import { Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

type State =
  | { kind: "idle" }
  | { kind: "uploading"; name: string }
  | { kind: "done"; name: string; added: number; removed: number; unchanged: number; jobId: string; version: number }
  | { kind: "error"; message: string };

/** Picks a file, posts it to the upload route, then shows the job result and refreshes the table. */
export function UploadButton({ workspaceId }: { workspaceId: string }) {
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [state, setState] = useState<State>({ kind: "idle" });

  async function send(file: File) {
    setState({ kind: "uploading", name: file.name });
    const form = new FormData();
    form.set("file", file);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/documents`, { method: "POST", body: form });
      const body = await res.json();
      if (!res.ok) return setState({ kind: "error", message: body?.error?.message ?? `Upload failed (${res.status}).` });
      setState({ kind: "done", name: file.name, added: body.added, removed: body.removed, unchanged: body.unchanged, jobId: body.jobId, version: body.indexVersion });
      router.refresh();
    } catch {
      setState({ kind: "error", message: "Network error. Try again." });
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <input
        ref={input}
        type="file"
        accept=".pdf,.md,.mdx,.markdown,.txt"
        className="sr-only"
        aria-label="Choose a PDF or Markdown file"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void send(f);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        disabled={state.kind === "uploading"}
        onClick={() => input.current?.click()}
        className="inline-flex h-10 items-center gap-2 rounded-[10px] bg-primary px-4 text-sm font-medium text-primary-ink transition-transform active:translate-y-px disabled:opacity-60"
      >
        <Upload aria-hidden className="size-4" />
        {state.kind === "uploading" ? `Uploading ${state.name}…` : "Upload PDF or Markdown"}
      </button>
      <p role="status" aria-live="polite" className="max-w-sm text-right text-xs">
        {state.kind === "done" && (
          <span className="text-success">
            {state.name}: +{state.added} −{state.removed} ={state.unchanged} chunks, index v{state.version}{" "}
            <span className="font-mono text-muted">job {state.jobId.slice(0, 8)}</span>
          </span>
        )}
        {state.kind === "error" && <span className="text-danger">{state.message}</span>}
      </p>
    </div>
  );
}
