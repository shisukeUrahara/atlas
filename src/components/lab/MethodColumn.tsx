import { METHOD_INFO, MethodName } from "../ui/Method";
import { shortPath, type SearchResponse } from "./types";

type Result = SearchResponse["results"][number];

/** One method's ranked list. Bars are relative to the column's best score (scores differ in scale per method). */
export function MethodColumn({ result }: { result: Result }) {
  const info = METHOD_INFO[result.method];
  const max = Math.max(...result.hits.map((h) => h.score), 0) || 1;
  return (
    <section aria-label={`${info.label} results`} className="min-w-0 rounded-[20px] border border-line bg-surface/85 p-4 shadow-card">
      <header className="mb-2 flex items-center justify-between gap-2 border-b border-line pb-3">
        <MethodName method={result.method} />
        <span className="truncate text-xs text-muted">{info.hint}</span>
      </header>
      {result.unavailable && (
        <p className="mb-2 rounded-xl bg-warn-bg px-3 py-2 text-xs text-warn">{result.unavailable}</p>
      )}
      {result.hits.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">{result.unavailable ? "No results from this method." : "No chunk matched."}</p>
      ) : (
        <ol>
          {result.hits.map((h) => (
            <li key={h.chunkId} className="border-b border-line/70 py-3 last:border-0">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-mono text-xs text-muted">#{h.rank}</span>
                <span className="num font-mono text-xs text-muted">{h.score < 0.1 ? h.score.toFixed(4) : h.score.toFixed(2)}</span>
              </div>
              <p className="mt-1 text-sm font-medium">
                {h.title}
                {h.heading && <span className="font-normal text-muted"> › {h.heading}</span>}
              </p>
              <p className="truncate font-mono text-[11px] text-muted" title={shortPath(h.url)}>
                {shortPath(h.url)}
              </p>
              <div className="mt-2 h-1 rounded-full bg-surface-2">
                <div className={`h-1 rounded-full ${info.bar}`} style={{ width: `${Math.max(4, (h.score / max) * 100)}%` }} />
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
