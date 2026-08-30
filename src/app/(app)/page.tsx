"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  Clock3,
  MapPin,
  Trophy,
  Upload,
  UsersRound,
} from "lucide-react";

import { CalendarWidget } from "@/components/overview/calendar-widget";
import { SyncFixturesButton } from "@/components/overview/sync-fixtures-button";
import { useAuth } from "@/components/auth/auth-provider";
import { createClient } from "@/lib/supabase/client";

type MatchRow = {
  match_id: number;
  date: string;
  kickoff_time: string | null;
  opponent: string;
  home_away: "home" | "away";
  competition: string | null;
  venue: string | null;
  status: "upcoming" | "played" | "postponed" | "cancelled";
  score_for: number | null;
  score_against: number | null;
};

function todayInNewYork() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

function formatDate(value: string, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...options,
  }).format(new Date(`${value}T12:00:00`));
}

function formatKickoff(value: string | null) {
  if (!value) return "TBD";
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(`2000-01-01T${value}`));
}

function daysUntil(date: string, today: string) {
  const difference =
    new Date(`${date}T12:00:00`).getTime() - new Date(`${today}T12:00:00`).getTime();
  return Math.max(0, Math.ceil(difference / 86_400_000));
}

function resultFor(match: MatchRow) {
  if (match.score_for === null || match.score_against === null) return null;
  if (match.score_for > match.score_against) return "W";
  if (match.score_for < match.score_against) return "L";
  return "T";
}

function opponentInitials(opponent: string) {
  return opponent
    .replace(/\([^)]*\)/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

export default function Home() {
  const { profile } = useAuth();
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const today = todayInNewYork();

  async function loadMatches() {
    const { data, error: queryError } = await createClient()
      .from("matches")
      .select("match_id, date, kickoff_time, opponent, home_away, competition, venue, status, score_for, score_against")
      .order("date", { ascending: true })
      .order("kickoff_time", { ascending: true, nullsFirst: false });
    setMatches((data as MatchRow[] | null) ?? []);
    setError(queryError?.message ?? null);
    setLoading(false);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void loadMatches(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  if (loading) return <div className="grid min-h-80 place-items-center text-sm font-semibold text-muted">Loading fixtures…</div>;
  const upcoming = matches.filter(
    (match) => match.status === "upcoming" && match.date >= today,
  );
  const played = matches
    .filter((match) => match.status === "played")
    .sort((a, b) => b.date.localeCompare(a.date));
  const nextMatch = upcoming[0] ?? null;
  const latestResult = played[0] ?? null;
  const canManage = profile.role === "admin" || profile.role === "importer";
  const calendarStart = nextMatch?.date ?? latestResult?.date ?? today;

  return (
    <div className="mx-auto w-full max-w-[1600px] px-3 py-4 sm:px-5 lg:px-6">
      {error ? (
        <div className="mb-4 rounded-md border border-pass-fail bg-panel px-4 py-3 text-sm text-pass-fail">
          Fixtures could not be loaded: {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(230px,0.78fr)_minmax(0,1.7fr)_minmax(280px,1fr)]">
        <aside className="space-y-4">
          <Widget title="Next Match" eyebrow="Fixture focus">
            {nextMatch ? (
              <div>
                <div className="flex items-center gap-3">
                  <div className="grid size-14 shrink-0 place-items-center rounded-md border border-border bg-elevated text-lg font-black text-accent">
                    {opponentInitials(nextMatch.opponent)}
                  </div>
                  <div className="min-w-0">
                    <span className="inline-flex rounded-sm border border-accent px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-accent">
                      {nextMatch.home_away === "home" ? "Home" : "Away"}
                    </span>
                    <h2 className="mt-1.5 text-base font-bold leading-tight text-foreground">
                      {nextMatch.opponent}
                    </h2>
                  </div>
                </div>

                <div className="mt-5 space-y-2.5 border-t border-border pt-4 text-xs">
                  <Detail icon={<CalendarDays className="size-3.5" />}>
                    {formatDate(nextMatch.date, { weekday: "short" })}
                  </Detail>
                  <Detail icon={<Clock3 className="size-3.5" />}>
                    {formatKickoff(nextMatch.kickoff_time)}
                  </Detail>
                  <Detail icon={<MapPin className="size-3.5" />}>
                    {nextMatch.venue ?? "Venue TBD"}
                  </Detail>
                </div>

                <div className="mt-4 rounded-md bg-elevated p-3 text-center">
                  <p className="text-3xl font-black tabular-nums text-accent">
                    {daysUntil(nextMatch.date, today)}
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted">
                    days to kickoff
                  </p>
                </div>
              </div>
            ) : (
              <EmptyState>No upcoming match is scheduled.</EmptyState>
            )}
          </Widget>

          <Widget title="Quick Actions" eyebrow="Shortcuts">
            <div className="grid gap-2">
              <ActionLink href="/analytics" icon={<BarChart3 className="size-4" />}>
                Analytics Hub
              </ActionLink>
              <ActionLink href="/players" icon={<UsersRound className="size-4" />}>
                Player Analysis
              </ActionLink>
              {canManage ? (
                <>
                  <SyncFixturesButton onSynced={loadMatches} />
                  <ActionLink href="/import" icon={<Upload className="size-4" />} accent>
                    Import Events
                  </ActionLink>
                </>
              ) : null}
            </div>
          </Widget>
        </aside>

        <section className="min-w-0 space-y-4">
          <Widget title="Latest Result" eyebrow="Match center" flush>
            {latestResult ? (
              <div className="relative overflow-hidden bg-elevated px-5 py-6 sm:px-8 sm:py-8">
                <div className="absolute inset-y-0 left-0 w-1 bg-accent" />
                <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
                  <div className="flex items-center gap-4">
                    <div className="grid size-16 place-items-center rounded-md border border-border bg-panel text-xl font-black text-accent">
                      {opponentInitials(latestResult.opponent)}
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted">
                        {formatDate(latestResult.date)} ·{" "}
                        {latestResult.home_away === "home" ? "Home" : "Away"}
                      </p>
                      <h2 className="mt-1 text-xl font-bold text-foreground">
                        {latestResult.opponent}
                      </h2>
                      <p className="mt-1 text-xs text-muted">
                        {latestResult.competition ?? "Match"}
                      </p>
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center gap-3">
                      <ResultPill result={resultFor(latestResult)} />
                      <p className="text-5xl font-black tabular-nums tracking-tight text-foreground">
                        {latestResult.score_for ?? "–"}
                        <span className="px-2 text-muted">:</span>
                        {latestResult.score_against ?? "–"}
                      </p>
                    </div>
                    <Link
                      href={`/analytics?match=${latestResult.match_id}`}
                      className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-accent hover:underline"
                    >
                      Open in Analytics Hub <ArrowRight className="size-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6">
                <EmptyState>No played match with a result is available yet.</EmptyState>
              </div>
            )}
          </Widget>

          <CalendarWidget
            fixtures={matches.map(({ match_id, date, opponent, status }) => ({
              match_id,
              date,
              opponent,
              status,
            }))}
            initialDate={calendarStart}
          />
        </section>

        <aside className="space-y-4">
          <Widget title="Fixture Schedule" eyebrow="Season timeline" flush>
            <div className="max-h-[540px] overflow-y-auto">
              {upcoming.length || played.length ? (
                <>
                  {upcoming.length ? (
                    <ScheduleGroup label="Upcoming" matches={upcoming} />
                  ) : null}
                  {played.length ? (
                    <ScheduleGroup label="Recent results" matches={played.slice(0, 8)} />
                  ) : null}
                </>
              ) : (
                <div className="p-5">
                  <EmptyState>Sync the team calendar to load fixtures.</EmptyState>
                </div>
              )}
            </div>
          </Widget>

          <Widget title="Standings" eyebrow="Conference">
            <div className="flex items-center gap-3 rounded-md border border-dashed border-border bg-elevated p-4">
              <Trophy className="size-7 shrink-0 text-accent" />
              <div>
                <p className="text-sm font-semibold text-foreground">Conference standings</p>
                <p className="mt-0.5 text-xs text-muted">Coming soon</p>
              </div>
            </div>
          </Widget>
        </aside>
      </div>
    </div>
  );
}

function Widget({
  title,
  eyebrow,
  children,
  flush = false,
}: {
  title: string;
  eyebrow: string;
  children: React.ReactNode;
  flush?: boolean;
}) {
  return (
    <section className="overflow-hidden rounded-md border border-border bg-panel">
      <header className="border-b border-border bg-elevated px-4 py-3">
        <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-accent">{eyebrow}</p>
        <h2 className="mt-0.5 text-sm font-bold uppercase tracking-wide text-foreground">{title}</h2>
      </header>
      <div className={flush ? "" : "p-4"}>{children}</div>
    </section>
  );
}

function Detail({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-muted">
      <span className="text-accent">{icon}</span>
      <span className="text-foreground">{children}</span>
    </div>
  );
}

function ActionLink({
  href,
  icon,
  children,
  accent = false,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center justify-between rounded border px-3 py-2.5 text-xs font-bold uppercase tracking-wide transition-colors ${
        accent
          ? "border-accent text-accent hover:bg-elevated"
          : "border-border bg-elevated text-foreground hover:border-accent"
      }`}
    >
      <span className="flex items-center gap-2">
        <span className="text-accent">{icon}</span>
        {children}
      </span>
      <ArrowRight className="size-3.5 text-muted" />
    </Link>
  );
}

function ResultPill({ result }: { result: "W" | "L" | "T" | null }) {
  const className =
    result === "W"
      ? "border-pass-ok text-pass-ok"
      : result === "L"
        ? "border-pass-fail text-pass-fail"
        : "border-assist text-assist";

  return (
    <span className={`grid size-8 place-items-center rounded-full border text-sm font-black ${className}`}>
      {result ?? "–"}
    </span>
  );
}

function ScheduleGroup({ label, matches }: { label: string; matches: MatchRow[] }) {
  return (
    <div>
      <p className="sticky top-0 z-10 border-b border-border bg-elevated px-4 py-2 text-[9px] font-bold uppercase tracking-[0.18em] text-muted">
        {label}
      </p>
      <div className="divide-y divide-border">
        {matches.map((match) => (
          <div key={match.match_id} className="flex items-center gap-3 px-4 py-3 hover:bg-elevated/60">
            <div className="w-10 shrink-0 text-center">
              <p className="text-[9px] font-bold uppercase text-muted">
                {formatDate(match.date, { month: "short", year: undefined }).split(" ")[0]}
              </p>
              <p className="text-lg font-black leading-none text-foreground">
                {new Date(`${match.date}T12:00:00`).getDate()}
              </p>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-foreground">{match.opponent}</p>
              <p className="mt-0.5 truncate text-[10px] text-muted">
                {match.competition ?? "Fixture"} · {match.home_away === "home" ? "H" : "A"}
              </p>
            </div>
            {match.status === "played" ? (
              <span className="shrink-0 text-sm font-black tabular-nums text-foreground">
                {match.score_for ?? "–"}–{match.score_against ?? "–"}
              </span>
            ) : (
              <span className="shrink-0 text-[10px] font-semibold text-accent">
                {formatKickoff(match.kickoff_time)}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return <p className="text-sm leading-6 text-muted">{children}</p>;
}
