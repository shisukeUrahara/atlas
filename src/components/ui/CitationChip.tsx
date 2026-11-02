/** Mono citation label placed right after the sentence it supports. Selected = violet outline. */
export function CitationChip({ label, selected = false, onSelect }: { label: string; selected?: boolean; onSelect?: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={`Show evidence ${label}`}
      className={`mx-0.5 inline-flex h-5 items-center rounded-md bg-brand-bg px-1.5 align-[1px] font-mono text-[11px] text-brand transition-colors hover:outline hover:outline-1 hover:outline-brand ${
        selected ? "outline outline-1 outline-brand" : ""
      }`}
    >
      {label}
    </button>
  );
}
