"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  CalendarDays,
  ChevronDown,
  LogOut,
  Moon,
  Sun,
  UserRound,
} from "lucide-react";

import { signOut } from "@/app/(app)/actions";
import { useTheme } from "@/hooks/use-theme";
import type { CurrentProfile } from "@/lib/auth";

export type UpcomingMatch = {
  opponent: string;
  home_away: "home" | "away";
  date: string;
};

const PRIMARY_LINKS = [
  { label: "Overview", href: "/" },
  { label: "Squad", href: "/roster" },
  { label: "Analytics", href: "/analytics" },
  { label: "Players", href: "/players" },
];

const SECTION_LABELS = [
  { prefix: "/roster", label: "Squad" },
  { prefix: "/analytics", label: "Analytics" },
  { prefix: "/players", label: "Players" },
  { prefix: "/import", label: "Import" },
  { prefix: "/admin", label: "Users" },
];

function pathIsActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function formatMatchDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

export function PortalShell({
  children,
  profile,
  todayLabel,
  upcomingMatch,
}: {
  children: ReactNode;
  profile: CurrentProfile;
  todayLabel: string;
  upcomingMatch: UpcomingMatch | null;
}) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const sectionLabel =
    SECTION_LABELS.find(({ prefix }) => pathname.startsWith(prefix))?.label ??
    "Overview";
  const canImport = profile.role === "importer" || profile.role === "admin";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-panel shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
        <div className="flex min-h-16 items-center gap-4 px-4 lg:px-6">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2.5"
            aria-label="NCF Men's Soccer home"
          >
            <span className="flex size-11 items-center justify-center overflow-hidden rounded-md border border-border bg-elevated">
              <Image
                src="/mascotMightyBanyan.png"
                alt="NCF Mighty Banyan mascot"
                width={42}
                height={42}
                className="size-10 object-contain"
                priority
              />
            </span>
            <span className="hidden text-sm font-bold tracking-wide text-foreground sm:block">
              NCF Men&apos;s Soccer
            </span>
          </Link>

          <nav
            className="min-w-0 flex-1 self-stretch overflow-x-auto"
            aria-label="Primary navigation"
          >
            <div className="flex h-full min-w-max items-stretch">
              {PRIMARY_LINKS.map((item) => {
                const active = pathIsActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`relative flex items-center px-3 text-sm font-semibold transition-colors hover:bg-elevated hover:text-foreground ${
                      active ? "text-foreground" : "text-muted"
                    }`}
                  >
                    {item.label}
                    {active ? (
                      <span className="absolute inset-x-3 bottom-0 h-0.5 bg-accent" />
                    ) : null}
                  </Link>
                );
              })}

              {canImport ? <PrimaryManagementLink href="/import" label="Import" pathname={pathname} /> : null}
              {profile.role === "admin" ? <PrimaryManagementLink href="/admin" label="Users" pathname={pathname} /> : null}
            </div>
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
              title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
              className="grid size-9 place-items-center rounded-md border border-border bg-elevated text-foreground transition-colors hover:border-accent hover:text-accent"
            >
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>

            <div className="hidden text-right xl:block">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                Today
              </p>
              <p className="text-xs font-medium text-foreground">{todayLabel}</p>
            </div>

            {upcomingMatch ? (
              <div className="hidden items-center gap-2 rounded-md border border-border bg-elevated px-2.5 py-1.5 lg:flex">
                <CalendarDays className="size-3.5 text-accent" />
                <div className="leading-tight">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted">
                    Next match
                  </p>
                  <p className="max-w-36 truncate text-xs font-semibold text-foreground">
                    {upcomingMatch.opponent} · {upcomingMatch.home_away === "home" ? "H" : "A"} ·{" "}
                    {formatMatchDate(upcomingMatch.date)}
                  </p>
                </div>
              </div>
            ) : null}

            <details className="group relative">
              <summary className="flex cursor-pointer list-none items-center gap-2 rounded-md border border-border bg-elevated px-2.5 py-1.5 transition-colors hover:border-accent [&::-webkit-details-marker]:hidden">
                <UserRound className="size-4 text-accent" />
                <span className="hidden max-w-36 truncate text-xs font-medium text-foreground md:block">
                  {profile.email}
                </span>
                <span className="rounded-full border border-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent">
                  {profile.role}
                </span>
                <ChevronDown className="size-3.5 text-muted transition-transform group-open:rotate-180" />
              </summary>
              <div className="absolute top-[calc(100%+8px)] right-0 z-50 w-64 rounded-md border border-border bg-panel p-3 shadow-xl">
                <p className="truncate text-sm font-medium text-foreground">{profile.email}</p>
                <p className="mt-1 text-xs capitalize text-muted">{profile.role} access</p>
                <form action={signOut} className="mt-3 border-t border-border pt-3">
                  <button
                    type="submit"
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium text-foreground transition-colors hover:bg-elevated hover:text-accent"
                  >
                    <LogOut className="size-4" />
                    Sign out
                  </button>
                </form>
              </div>
            </details>
          </div>
        </div>

        <div className="flex h-10 items-end border-t border-border bg-elevated px-4 lg:px-6">
          <span className="relative flex h-full items-center px-3 text-xs font-semibold uppercase tracking-[0.12em] text-foreground">
            {sectionLabel}
            <span className="absolute inset-x-3 bottom-0 h-0.5 bg-accent" />
          </span>
        </div>
      </header>

      <main className="flex min-h-[calc(100vh-6.5rem)] flex-col bg-background">
        {children}
      </main>
    </div>
  );
}

function PrimaryManagementLink({ href, label, pathname }: { href: string; label: string; pathname: string }) {
  const active = pathIsActive(pathname, href);
  return (
    <Link
      href={href}
      className={`relative flex items-center px-3 text-sm font-semibold transition-colors hover:bg-elevated hover:text-foreground ${active ? "text-foreground" : "text-muted"}`}
    >
      {label}
      {active ? <span className="absolute inset-x-3 bottom-0 h-0.5 bg-accent" /> : null}
    </Link>
  );
}
