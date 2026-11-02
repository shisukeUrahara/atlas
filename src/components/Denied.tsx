import { Lock } from "lucide-react";

export function Denied({ user, workspace }: { user: string; workspace: string }) {
  return (
    <div role="alert" className="rounded-[20px] border border-danger/30 bg-danger-bg p-8 text-center">
      <Lock aria-hidden className="mx-auto size-5 text-danger" />
      <p className="mt-3 font-medium text-danger">No access</p>
      <p className="mt-1 text-sm text-danger">
        <span className="font-mono">{user}</span> cannot open the workspace <span className="font-mono">{workspace}</span>. Switch user or pick another workspace.
      </p>
    </div>
  );
}
