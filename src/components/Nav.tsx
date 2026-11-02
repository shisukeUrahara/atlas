"use client";
import { Activity, BarChart3, FlaskConical, Home, Library, MessageSquareText } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { UserId } from "@/core/auth/access";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { UserSwitch } from "./UserSwitch";

export const LINKS = [
  { href: "/", label: "Overview", short: "Home", icon: Home },
  { href: "/ask", label: "Ask", short: "Ask", icon: MessageSquareText },
  { href: "/sources", label: "Sources", short: "Sources", icon: Library },
  { href: "/lab", label: "Retrieval Lab", short: "Lab", icon: FlaskConical },
  { href: "/traces", label: "Traces", short: "Traces", icon: Activity },
  { href: "/evaluation", label: "Evaluation", short: "Evals", icon: BarChart3 },
];

export const isActive = (path: string, href: string) => (href === "/" ? path === "/" : path.startsWith(href));

/** Top bar with pill tabs (desktop) and a bottom tab bar (phone). */
export function Nav({ user }: { user: UserId }) {
  const path = usePathname();
  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line/70 bg-canvas/75 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-4 px-4 md:px-6">
          <Link href="/" className="flex shrink-0 items-center gap-2.5 font-display text-[17px] font-medium tracking-tight">
            <Logo />
            Atlas
          </Link>
          <nav aria-label="Main" className="mx-auto hidden rounded-full border border-line bg-surface/70 p-1 md:flex">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                aria-current={isActive(path, l.href) ? "page" : undefined}
                className="rounded-full px-3.5 py-1.5 text-sm text-muted transition-colors hover:text-ink aria-[current=page]:bg-brand-bg aria-[current=page]:font-medium aria-[current=page]:text-brand lg:px-4"
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2 md:ml-0">
            <UserSwitch user={user} />
            <ThemeToggle />
          </div>
        </div>
      </header>
      <nav aria-label="Mobile" className="fixed inset-x-0 bottom-0 z-30 border-t border-line/70 bg-canvas/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
        <ul className="mx-auto grid max-w-lg grid-cols-6">
          {LINKS.map((l) => {
            const Icon = l.icon;
            return (
              <li key={l.href}>
                <Link
                  href={l.href}
                  aria-current={isActive(path, l.href) ? "page" : undefined}
                  className="flex min-h-14 flex-col items-center justify-center gap-1 text-[11px] text-muted aria-[current=page]:font-medium aria-[current=page]:text-brand"
                >
                  <Icon className="size-5" aria-hidden />
                  {l.short}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
