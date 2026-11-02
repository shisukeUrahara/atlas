import Link from "next/link";
import type { Doc } from "@/core/domain/schemas";
import { Pill, type Tone } from "../ui/Pill";

const STATUS: Record<Doc["status"], { tone: Tone; label: string }> = {
  indexed: { tone: "success", label: "Indexed" },
  ingesting: { tone: "brand", label: "Ingesting" },
  queued: { tone: "neutral", label: "Queued" },
  failed: { tone: "danger", label: "Failed" },
};

/** Documents with hairline dividers. Wide content scrolls inside the card, never the page. */
export function DocTable({ docs, counts, ws, filter }: { docs: Doc[]; counts: Map<string, number>; ws: string; filter: string }) {
  const shown = filter === "all" ? docs : docs.filter((d) => d.status === filter);
  const chips = ["all", "indexed", "failed"] as const;
  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        {chips.map((c) => (
          <Link
            key={c}
            href={`/sources?ws=${ws}&status=${c}`}
            aria-current={filter === c ? "true" : undefined}
            className="rounded-full border border-line px-3 py-1 text-xs capitalize text-muted hover:text-ink aria-[current=true]:border-brand aria-[current=true]:bg-brand-bg aria-[current=true]:text-brand"
          >
            {c} <span className="num font-mono">{c === "all" ? docs.length : docs.filter((d) => d.status === c).length}</span>
          </Link>
        ))}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="micro border-b border-line">
              <th className="py-2 pr-4 font-medium">Document</th>
              <th className="py-2 pr-4 font-medium">License</th>
              <th className="py-2 pr-4 font-medium">SHA-256</th>
              <th className="py-2 pr-4 text-right font-medium">Chunks</th>
              <th className="py-2 text-right font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((d) => (
              <tr key={d.id} className="border-b border-line/70 align-top last:border-0">
                <td className="max-w-[380px] py-3 pr-4">
                  <a href={d.url.startsWith("http") ? d.url : undefined} className="font-medium hover:underline">
                    {d.title}
                  </a>
                  <p className="truncate font-mono text-xs text-muted" title={d.path}>
                    {d.path}
                  </p>
                </td>
                <td className="py-3 pr-4">
                  <Pill mono>{d.license}</Pill>
                </td>
                <td className="py-3 pr-4 font-mono text-xs text-muted">{d.sha256.slice(0, 7)}</td>
                <td className="num py-3 pr-4 text-right font-mono">{counts.get(d.id) ?? 0}</td>
                <td className="py-3 text-right">
                  <Pill tone={STATUS[d.status].tone} dot>
                    {STATUS[d.status].label}
                  </Pill>
                  {d.error && <p className="mt-1 text-xs text-danger">{d.error}</p>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-muted">
        {shown.length} of {docs.length} documents
      </p>
    </div>
  );
}
