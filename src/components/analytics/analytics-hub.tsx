"use client";

import { type ReactNode, useMemo, useState } from "react";
import {
  Activity,
  ChartNoAxesCombined,
  CircleDot,
  Goal,
  ScanSearch,
  ShieldCheck,
  Target,
  UsersRound,
} from "lucide-react";

import { ShotMapCard } from "@/components/analytics/shot-map-card";
import { PassMapsCard } from "@/components/analytics/pass-maps-card";
import { PassingNetworkCard } from "@/components/analytics/passing-network-card";
import { HeatmapCard } from "@/components/analytics/heatmap-card";
import { MatchSummary } from "@/components/analytics/match-summary";
import { useAnalyticsData } from "@/hooks/use-analytics-data";
import { calculateAnalyticsKpis, per90 } from "@/lib/analytics";

export type AnalyticsMatch = {
  match_id: number;
  date: string;
  opponent: string;
  home_away: "home" | "away";
  competition: string | null;
  score_for: number | null;
  score_against: number | null;
};

export type AnalyticsPlayer = {
  player_id: number;
  first_name: string | null;
  last_name: string | null;
  shirt_number: number | null;
  position: string | null;
};

type AnalyticsHubProps = {
  matches: AnalyticsMatch[];
  players: AnalyticsPlayer[];
  initialMatchId: "all" | number;
  setupError?: string | null;
};

type DisplayMode = "totals" | "per90";

function formatMatchDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

function playerName(player?: AnalyticsPlayer) {
  if (!player) return "No player selected";
  return [player.first_name, player.last_name].filter(Boolean).join(" ") || "Unknown player";
}

export function AnalyticsHub({
  matches,
  players,
  initialMatchId,
  setupError,
}: AnalyticsHubProps) {
  const [activeMatchId, setActiveMatchId] = useState<"all" | number>(initialMatchId);
  const [scopeType, setScopeType] = useState<"team" | "player">("team");
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | undefined>(
    players[0]?.player_id,
  );
  const [displayMode, setDisplayMode] = useState<DisplayMode>("totals");

  const playerId = scopeType === "player" ? selectedPlayerId : undefined;
  const { events, minutesPlayed, loading, error } = useAnalyticsData({
    matchId: activeMatchId,
    playerId,
  });
  const stats = useMemo(() => calculateAnalyticsKpis(events), [events]);
  const activeMatch = matches.find((match) => match.match_id === activeMatchId);
  const activePlayer = players.find((player) => player.player_id === selectedPlayerId);
  const per90Mode = displayMode === "per90";

  const countValue = (value: number) => (per90Mode ? per90(value, minutesPlayed) : value);
  const metricTiles = [
    { label: "xG", value: countValue(stats.xgTotal), kind: "decimal", icon: CircleDot },
    { label: "Goals", value: countValue(stats.goals), kind: "count", icon: Goal },
    { label: "Shots", value: countValue(stats.totalShots), kind: "count", icon: Target },
    {
      label: "Shots on target",
      value: countValue(stats.shotsOnTarget),
      kind: "count",
      icon: ScanSearch,
    },
    { label: "Passes", value: countValue(stats.totalPasses), kind: "count", icon: Activity },
    { label: "Pass %", value: stats.passAccuracy, kind: "percent", icon: ShieldCheck },
    {
      label: "Progressive passes",
      value: countValue(stats.progressivePasses),
      kind: "count",
      icon: ChartNoAxesCombined,
    },
    {
      label: "Recoveries",
      value: countValue(stats.totalRecoveries),
      kind: "count",
      icon: UsersRound,
    },
    {
      label: "Duels won %",
      value: stats.duelSuccessRate,
      kind: "percent",
      icon: ShieldCheck,
    },
  ] as const;

  function formatMetric(value: number, kind: "count" | "decimal" | "percent") {
    if (kind === "percent") return `${value.toFixed(1)}%`;
    if (kind === "decimal") return value.toFixed(2);
    return per90Mode ? value.toFixed(1) : Math.round(value).toLocaleString("en-US");
  }

  function selectPlayerScope() {
    setScopeType("player");
    if (selectedPlayerId === undefined && players[0]) {
      setSelectedPlayerId(players[0].player_id);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] px-3 py-4 sm:px-5 lg:px-6">
      <header className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">
            Performance center
          </p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Analytics Hub
          </h1>
        </div>
        <p className="text-xs text-muted">
          {scopeType === "team" ? "NCF Men's Soccer" : playerName(activePlayer ?? players[0])}
          {per90Mode ? " · normalized per 90" : " · total output"}
        </p>
      </header>

      {setupError || error ? (
        <div className="mb-4 rounded-md border border-pass-fail bg-panel px-4 py-3 text-sm text-pass-fail">
          {setupError || error}
        </div>
      ) : null}

      <section aria-label="Match filter" className="mb-4 border-y border-border bg-panel">
        <div className="flex snap-x gap-2 overflow-x-auto px-3 py-3 sm:px-4">
          <MatchChip
            active={activeMatchId === "all"}
            label="All season"
            onClick={() => setActiveMatchId("all")}
          />
          {matches.map((match) => (
            <MatchChip
              active={activeMatchId === match.match_id}
              key={match.match_id}
              label={match.opponent}
              meta={`${formatMatchDate(match.date)} · ${match.home_away === "home" ? "H" : "A"}`}
              onClick={() => setActiveMatchId(match.match_id)}
            />
          ))}
        </div>
      </section>

      {activeMatch ? (
        <MatchSummary match={activeMatch} />
      ) : null}

      <section className="mb-4 rounded-md border border-border bg-panel p-3 sm:p-4">
        <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <ControlGroup label="Scope">
              <SegmentButton active={scopeType === "team"} onClick={() => setScopeType("team")}>
                Team
              </SegmentButton>
              <SegmentButton active={scopeType === "player"} onClick={selectPlayerScope}>
                Player
              </SegmentButton>
            </ControlGroup>

            {scopeType === "player" ? (
              <label className="flex min-w-0 flex-col gap-1 text-[10px] font-bold uppercase tracking-wider text-muted sm:min-w-64">
                Player
                <select
                  className="h-9 rounded-sm border border-border bg-elevated px-3 text-sm font-semibold normal-case tracking-normal text-foreground"
                  disabled={!players.length}
                  onChange={(event) => setSelectedPlayerId(Number(event.target.value))}
                  value={selectedPlayerId ?? ""}
                >
                  {players.length ? (
                    players.map((player) => (
                      <option key={player.player_id} value={player.player_id}>
                        {player.shirt_number !== null ? `#${player.shirt_number} · ` : ""}
                        {playerName(player)}
                      </option>
                    ))
                  ) : (
                    <option value="">No players available</option>
                  )}
                </select>
              </label>
            ) : null}
          </div>

          <div className="flex flex-wrap items-end justify-between gap-3 sm:justify-start">
            <div className="text-right text-[10px] font-bold uppercase tracking-wider text-muted">
              <p>{loading ? "Loading data…" : `${events.length.toLocaleString("en-US")} events`}</p>
              <p>{minutesPlayed.toLocaleString("en-US")} lineup minutes</p>
            </div>
            <ControlGroup label="View">
              <SegmentButton active={displayMode === "totals"} onClick={() => setDisplayMode("totals")}>
                Totals
              </SegmentButton>
              <SegmentButton active={displayMode === "per90"} onClick={() => setDisplayMode("per90")}>
                Per 90
              </SegmentButton>
            </ControlGroup>
          </div>
        </div>
      </section>

      <section aria-label="Headline metrics" className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9">
        {metricTiles.map(({ label, value, kind, icon: Icon }) => (
          <article className="relative min-h-28 overflow-hidden rounded-md border border-border bg-panel p-3" key={label}>
            <div className="absolute inset-x-0 top-0 h-0.5 bg-accent" />
            <div className="flex items-start justify-between gap-2">
              <p className="text-[10px] font-bold uppercase leading-tight tracking-[0.12em] text-muted">
                {label}
              </p>
              <Icon aria-hidden="true" className="size-3.5 shrink-0 text-accent" />
            </div>
            <p className={`mt-4 text-2xl font-black tabular-nums text-foreground ${loading ? "animate-pulse opacity-40" : ""}`}>
              {loading ? "—" : formatMetric(value, kind)}
            </p>
            <p className="mt-1 text-[9px] font-semibold uppercase tracking-wider text-muted">
              {kind === "percent"
                ? "success rate"
                : per90Mode
                  ? "per 90 min"
                  : activeMatch
                    ? "match total"
                    : "season total"}
            </p>
          </article>
        ))}
      </section>

      <section className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ShotMapCard matchId={activeMatchId} playerId={playerId} />
        <PassingNetworkCard
          matchId={activeMatchId}
          players={players}
          scopeType={scopeType}
        />
        <div className="lg:col-span-2">
          <PassMapsCard
            matchId={activeMatchId}
            playerId={playerId}
            scopeType={scopeType}
            selectedPlayerLabel={playerName(activePlayer)}
            selectedShirtNumber={activePlayer?.shirt_number}
          />
        </div>
        <div className="lg:col-span-2"><HeatmapCard events={events} loading={loading} /></div>
      </section>
    </div>
  );
}

function MatchChip({
  active,
  label,
  meta,
  onClick,
}: {
  active: boolean;
  label: string;
  meta?: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-pressed={active}
      className={`relative min-w-max snap-start rounded-sm border px-3 py-2 text-left transition-colors ${
        active
          ? "border-accent bg-elevated text-foreground"
          : "border-border bg-panel text-muted hover:border-accent hover:text-foreground"
      }`}
      onClick={onClick}
      type="button"
    >
      <span className="block text-xs font-bold">{label}</span>
      {meta ? <span className="mt-0.5 block text-[9px] font-semibold uppercase tracking-wider">{meta}</span> : null}
      {active ? <span className="absolute inset-x-2 -bottom-px h-0.5 bg-accent" /> : null}
    </button>
  );
}

function ControlGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted">{label}</p>
      <div className="inline-flex rounded-sm border border-border bg-elevated p-0.5">{children}</div>
    </div>
  );
}

function SegmentButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      aria-pressed={active}
      className={`min-w-20 rounded-sm px-3 py-2 text-xs font-bold transition-colors ${
        active ? "bg-accent text-[var(--bg)]" : "text-muted hover:text-foreground"
      }`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}
