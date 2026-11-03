"use client";
import { useRouter } from "next/navigation";
import { USER_COOKIE, USERS, type UserId } from "@/core/auth/access";

/** Demo identity picker. Sets the cookie the server reads, then re-renders with the new access. */
export function UserSwitch({ user }: { user: UserId }) {
  const router = useRouter();
  return (
    <label className="flex h-10 items-center gap-2 rounded-full border border-line bg-surface/70 pl-3 pr-1 font-mono text-xs text-muted">
      <span aria-hidden className="size-1.5 rounded-full bg-success" />
      <span className="sr-only">Demo user</span>
      <select
        value={user}
        onChange={(e) => {
          document.cookie = `${USER_COOKIE}=${e.target.value}; path=/; samesite=lax`;
          router.refresh();
        }}
        className="h-8 cursor-pointer rounded-full bg-transparent pr-1 text-ink focus:outline-none"
      >
        {(Object.keys(USERS) as UserId[]).map((u) => (
          <option key={u} value={u}>
            {u}
          </option>
        ))}
      </select>
    </label>
  );
}
