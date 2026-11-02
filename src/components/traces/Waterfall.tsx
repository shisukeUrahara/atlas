/** Stage timings as offset bars on one time axis. The model stage is violet; the rest are neutral. */
export function Waterfall({ stages }: { stages: { name: string; ms: number }[] }) {
  const total = stages.reduce((n, s) => n + s.ms, 0);
  const scale = Math.max(total, 1);
  const starts = stages.map((_, i) => stages.slice(0, i).reduce((n, s) => n + s.ms, 0));
  return (
    <div>
      <ul className="space-y-2.5">
        {stages.map((s, i) => {
          const left = (starts[i] / scale) * 100;
          return (
            <li key={s.name} className="grid grid-cols-[80px_minmax(0,1fr)_80px] items-center gap-3 text-sm">
              <span className={`font-mono text-xs ${s.name === "model" ? "text-brand" : "text-muted"}`}>{s.name}</span>
              <span className="relative h-2 rounded-full bg-surface-2">
                <span
                  className={`absolute top-0 h-2 rounded-full ${s.name === "model" ? "bg-brand" : "bg-muted/60"}`}
                  style={{ left: `${left}%`, width: `${Math.max(0.8, (s.ms / scale) * 100)}%` }}
                />
              </span>
              <span className="num text-right font-mono text-xs">{formatMs(s.ms)}</span>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 flex justify-between border-t border-line pt-2 font-mono text-xs">
        <span className="text-muted">total</span>
        <span className="num">{formatMs(total)}</span>
      </p>
    </div>
  );
}

export const formatMs = (ms: number) => (ms >= 1000 ? `${(ms / 1000).toFixed(2)} s` : `${ms.toLocaleString("en-US", { maximumFractionDigits: 1 })} ms`);
