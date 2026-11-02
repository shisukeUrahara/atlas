"use client";
import { Search } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { MethodColumn } from "./MethodColumn";
import type { SearchResponse } from "./types";

export const EXAMPLES: Record<string, string[]> = {
  langchain: ["InMemorySaver", "How do I add short-term memory to an agent?", "stream tokens from a graph", "magic_retry"],
  cookbook: ["cosine similarity of embeddings", "How do I embed text longer than the token limit?", "structured outputs with a JSON schema"],
  uploads: ["exponential backoff"],
};

/** Query box + three ranked columns. The question lives in the URL (?q=), so a search can be shared. */
export function LabSearch({
  workspaceId,
  initialQuery,
  initialData,
}: {
  workspaceId: string;
  initialQuery: string;
  /** Results rendered on the server when the link already carries ?q=. */
  initialData: SearchResponse | null;
}) {
  const router = useRouter();
  const path = usePathname();
  const [query, setQuery] = useState(initialQuery);
  const [topK, setTopK] = useState(10);
  const [data, setData] = useState<SearchResponse | null>(initialData);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const run = useCallback(
    async (q: string, k: number) => {
      if (!q.trim()) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/search", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ workspaceId, query: q, topK: k }),
        });
        const body = await res.json();
        if (!res.ok) throw new Error(body?.error?.message ?? `Search failed (${res.status}).`);
        setData(body);
        router.replace(`${path}?ws=${workspaceId}&q=${encodeURIComponent(q)}`, { scroll: false });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Search failed.");
      } finally {
        setLoading(false);
      }
    },
    [workspaceId, path, router],
  );

  return (
    <div className="space-y-5">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          void run(query, topK);
        }}
        className="flex flex-wrap gap-2"
      >
        <label className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-xl border border-line bg-surface px-3 focus-within:border-brand">
          <Search aria-hidden className="size-4 shrink-0 text-muted" />
          <span className="sr-only">Question</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask something the docs might answer…"
            maxLength={500}
            className="w-full bg-transparent text-ink placeholder:text-muted focus:outline-none"
          />
        </label>
        <label className="flex h-11 items-center gap-2 rounded-xl border border-line bg-surface px-3 font-mono text-xs text-muted">
          top-k
          <select value={topK} onChange={(e) => setTopK(Number(e.target.value))} className="bg-transparent text-ink focus:outline-none">
            {[5, 10, 20].map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
        </label>
        <button type="submit" disabled={loading || !query.trim()} className="h-11 rounded-[10px] bg-primary px-5 text-sm font-medium text-primary-ink active:translate-y-px disabled:opacity-60">
          {loading ? "Searching…" : "Search"}
        </button>
      </form>
      <div className="flex flex-wrap items-center gap-2">
        <span className="micro">Try</span>
        {(EXAMPLES[workspaceId] ?? []).map((ex) => (
          <button
            key={ex}
            type="button"
            onClick={() => {
              setQuery(ex);
              void run(ex, topK);
            }}
            className="rounded-full border border-line px-3 py-1 font-mono text-xs text-muted hover:border-brand hover:text-ink"
          >
            {ex}
          </button>
        ))}
      </div>
      {error && <p role="alert" className="rounded-xl bg-danger-bg px-3 py-2 text-sm text-danger">{error}</p>}
      {data && (
        <>
          <p className="font-mono text-xs text-muted">
            workspace {data.workspaceId} · index v{data.indexVersion}
          </p>
          <div className={`grid gap-4 md:grid-cols-3 ${loading ? "opacity-60" : ""}`} aria-busy={loading}>
            {data.results.map((r) => (
              <MethodColumn key={r.method} result={r} />
            ))}
          </div>
        </>
      )}
      {!data && !error && !loading && (
        <p className="rounded-[20px] border border-dashed border-line p-8 text-center text-sm text-muted">Type a question or pick an example to compare the three methods.</p>
      )}
      {!data && loading && (
        <div className="grid gap-4 md:grid-cols-3" aria-hidden>
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-80 animate-pulse rounded-[20px] border border-line bg-surface-2/60" />
          ))}
        </div>
      )}
    </div>
  );
}
