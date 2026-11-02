import type { Method } from "@/core/domain/schemas";

export const METHOD_INFO: Record<Method, { label: string; hint: string; dot: string; ink: string; bar: string }> = {
  bm25: { label: "BM25", hint: "keyword match", dot: "bg-m-bm25", ink: "text-m-bm25-ink", bar: "bg-m-bm25" },
  dense: { label: "Dense", hint: "vector similarity", dot: "bg-m-dense", ink: "text-m-dense-ink", bar: "bg-m-dense" },
  hybrid: { label: "Hybrid", hint: "reciprocal rank fusion, k=60", dot: "bg-m-hybrid", ink: "text-m-hybrid-ink", bar: "bg-m-hybrid" },
};

/** Small coloured dot plus the method name in mono. Text uses the ink tone, never the fill. */
export function MethodName({ method }: { method: Method }) {
  const m = METHOD_INFO[method];
  return (
    <span className="inline-flex items-center gap-2 font-mono text-sm">
      <span aria-hidden className={`size-2 rounded-full ${m.dot}`} />
      <span className={m.ink}>{m.label}</span>
    </span>
  );
}
