import { Inbox } from "lucide-react";
import type { ReactNode } from "react";

/** One sentence on what is missing plus the exact next step. */
export function Empty({ title, hint, action }: { title: string; hint?: ReactNode; action?: ReactNode }) {
  return (
    <div className="rounded-[20px] border border-dashed border-line bg-surface/50 p-10 text-center">
      <span className="mx-auto grid size-11 place-items-center rounded-xl bg-brand-bg">
        <Inbox aria-hidden className="size-5 text-brand" />
      </span>
      <p className="mt-4 font-medium">{title}</p>
      {hint && <p className="mx-auto mt-1 max-w-md text-sm text-muted">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
