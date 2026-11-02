import type { IndexChange } from "@/core/store/sqlite";

/** What the latest index version changed: counts, bars and the first removed / added sections. */
export function VersionDiff({
  version,
  info,
  changes,
}: {
  version: number;
  info: { added: number; removed: number; unchanged: number } | null;
  changes: IndexChange[];
}) {
  if (!info) return <p className="text-sm text-muted">Nothing indexed yet.</p>;
  const total = Math.max(1, info.added + info.removed + info.unchanged);
  const rows = [
    { label: "Added", n: info.added, bar: "bg-success", ink: "text-success" },
    { label: "Removed", n: info.removed, bar: "bg-danger", ink: "text-danger" },
    { label: "Unchanged", n: info.unchanged, bar: "bg-muted/60", ink: "text-muted" },
  ];
  const sample = (kind: IndexChange["change"]) => {
    const seen = new Set<string>();
    return changes.filter((c) => c.change === kind && !seen.has(c.title + c.heading) && seen.add(c.title + c.heading)).slice(0, 3);
  };
  return (
    <div>
      <p className="font-mono text-xs text-muted">
        index v{version - 1 > 0 ? version - 1 : 0} → v{version}
      </p>
      <ul className="mt-4 space-y-3">
        {rows.map((r) => (
          <li key={r.label}>
            <div className="flex justify-between text-sm">
              <span className={r.ink}>
                {r.label} {r.n.toLocaleString("en-US")} chunks
              </span>
            </div>
            <div className="mt-1.5 h-1.5 rounded-full bg-surface-2">
              <div className={`h-1.5 rounded-full ${r.bar}`} style={{ width: `${(r.n / total) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
      {(["removed", "added"] as const).map((kind) =>
        sample(kind).length ? (
          <div key={kind} className="mt-5">
            <p className="micro">{kind === "removed" ? "Removed sections, e.g." : "Added sections, e.g."}</p>
            <ul className="mt-2 space-y-2">
              {sample(kind).map((c) => (
                <li
                  key={c.chunkId}
                  className={`rounded-xl border-l-2 bg-surface-2 px-3 py-2 text-sm ${kind === "removed" ? "border-danger" : "border-success"}`}
                >
                  <span className="font-medium">{c.title}</span>
                  {c.heading && <span className="text-muted"> › {c.heading}</span>}
                </li>
              ))}
            </ul>
          </div>
        ) : null,
      )}
      <p className="mt-4 text-xs text-muted">Removed chunks are deleted from the index and the vector store, so they can never be cited.</p>
    </div>
  );
}
