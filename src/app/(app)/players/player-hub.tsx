"use client";

import { UsersRound } from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { TouchMapCard } from "@/components/analytics/touch-map-card";
import { useAnalyticsData } from "@/hooks/use-analytics-data";
import {
  calculateAnalyticsKpis,
  calculateGoalkeeperStats,
} from "@/lib/analytics";

import { PlayerMatchDashboard } from "./player-match-dashboard";
import { GoalkeeperAnalysis } from "./goalkeeper-analysis";
import { PlayerPhotoUploader } from "./player-photo-uploader";
import { PlayerStatsTable } from "./player-stats-table";

export type PlayerHubPlayer = {
  player_id: number;
  first_name: string | null;
  last_name: string | null;
  shirt_number: number | null;
  position: string | null;
  image_url: string | null;
};

export type PlayerHubMatch = {
  match_id: number;
  date: string;
  opponent: string;
  home_away: "home" | "away";
};

type PlayerHubProps = {
  players: PlayerHubPlayer[];
  matches: PlayerHubMatch[];
  setupError?: string | null;
  onPlayersChanged: () => void | Promise<void>;
};

function playerName(player?: PlayerHubPlayer) {
  if (!player) return "No player selected";
  return [player.first_name, player.last_name].filter(Boolean).join(" ") || "Unnamed player";
}

function formatMatch(match: PlayerHubMatch) {
  const date = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" })
    .format(new Date(`${match.date}T12:00:00`));
  return `${match.opponent} · ${date} · ${match.home_away === "home" ? "H" : "A"}`;
}

export function PlayerHub({ players, matches, setupError, onPlayersChanged }: PlayerHubProps) {
  const { profile } = useAuth();
  const canEdit = profile.role === "admin" || profile.role === "importer";
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | undefined>(players[0]?.player_id);
  const [matchId, setMatchId] = useState<"all" | number>("all");
  const selectedPlayer = players.find((player) => player.player_id === selectedPlayerId);
  const { events, minutesPlayed, loading, error } = useAnalyticsData({
    matchId,
    playerId: selectedPlayerId,
  });
  const {
    events: teamEvents,
    loading: teamLoading,
    error: teamError,
  } = useAnalyticsData({ matchId });
  const stats = useMemo(() => calculateAnalyticsKpis(events), [events]);
  const goalkeeperStats = useMemo(() => calculateGoalkeeperStats(events), [events]);
  const isGoalkeeper = selectedPlayer?.position?.toUpperCase() === "GK" || goalkeeperStats.gkActions.length > 0;
  const effectivePosition = isGoalkeeper ? "GK" : selectedPlayer?.position ?? "—";
  const scopeLabel = matchId === "all"
    ? "Whole season"
    : matches.find((match) => match.match_id === matchId)?.opponent ?? "Selected match";

  if (!players.length) {
    return (
      <div className="grid min-h-80 place-items-center rounded-md border border-dashed border-border bg-panel p-8 text-center">
        <div>
          <UsersRound aria-hidden="true" className="mx-auto size-9 text-accent" />
          <h1 className="mt-3 text-xl font-black text-foreground">No players available</h1>
          <p className="mt-1 text-sm text-muted">Add players to the roster before opening Player Hub.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <section className="mb-4 rounded-md border border-border bg-panel p-3 sm:p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Selector label="Player">
            <select
              aria-label="Player"
              className="h-10 w-full rounded-sm border border-border bg-elevated px-3 text-sm font-bold text-foreground focus:border-accent"
              onChange={(event) => setSelectedPlayerId(Number(event.target.value))}
              value={selectedPlayerId ?? ""}
            >
              {players.map((player) => (
                <option key={player.player_id} value={player.player_id}>
                  {player.shirt_number !== null ? `#${player.shirt_number} · ` : ""}{playerName(player)}
                </option>
              ))}
            </select>
          </Selector>
          <Selector label="Match scope">
            <select
              aria-label="Match scope"
              className="h-10 w-full rounded-sm border border-border bg-elevated px-3 text-sm font-bold text-foreground focus:border-accent"
              onChange={(event) => setMatchId(event.target.value === "all" ? "all" : Number(event.target.value))}
              value={matchId}
            >
              <option value="all">Whole season</option>
              {matches.map((match) => <option key={match.match_id} value={match.match_id}>{formatMatch(match)}</option>)}
            </select>
          </Selector>
        </div>
      </section>

      {setupError || error || teamError ? (
        <div className="mb-4 rounded-md border border-pass-fail bg-panel px-4 py-3 text-sm text-pass-fail">
          {setupError || error || teamError}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-md border border-border bg-panel">
        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr]">
          <div className="grid min-h-52 place-items-center border-b border-border bg-elevated p-5 lg:border-r lg:border-b-0">
            {selectedPlayer ? (
              <PlayerPhotoUploader
                canEdit={canEdit}
                imageUrl={selectedPlayer.image_url}
                onUploaded={onPlayersChanged}
                playerId={selectedPlayer.player_id}
                playerName={playerName(selectedPlayer)}
              />
            ) : null}
          </div>
          <div className="p-4 sm:p-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-accent">Player Hub</p>
                <h1 className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-2xl font-black tracking-tight text-foreground sm:text-3xl">
                  <span>{playerName(selectedPlayer)}</span>
                  <span className="text-base font-black text-accent sm:text-lg">
                    #{selectedPlayer?.shirt_number ?? "—"} · {effectivePosition}
                  </span>
                </h1>
                <p className="mt-1 text-xs font-semibold text-muted">{scopeLabel} · Totals</p>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted">
                {loading ? "Loading…" : `${events.length} recorded actions`}
              </p>
            </div>

            {isGoalkeeper ? (
              <MetricRow
                loading={loading}
                metrics={[
                  { label: "Minutes", value: minutesPlayed.toLocaleString("en-US") },
                  { label: "Saves", value: goalkeeperStats.saves.toString() },
                  { label: "Claims", value: goalkeeperStats.claims.toString() },
                  { label: "Punches", value: goalkeeperStats.punches.toString() },
                  { label: "Distribution", value: `${goalkeeperStats.distributionRate}%` },
                  { label: "GK actions", value: goalkeeperStats.gkActions.length.toString() },
                ]}
              />
            ) : (
              <MetricRow
                loading={loading}
                metrics={[
                  { label: "Minutes", value: minutesPlayed.toLocaleString("en-US") },
                  { label: "Goals", value: stats.goals.toString() },
                  { label: "Assists", value: stats.assists.toString() },
                  { label: "Passes", value: stats.totalPasses.toString() },
                  { label: "Pass %", value: `${stats.passAccuracy.toFixed(1)}%` },
                  { label: "xG", value: stats.xgTotal.toFixed(2) },
                ]}
              />
            )}
          </div>
        </div>
      </section>

      {isGoalkeeper ? (
        <>
          <GoalkeeperAnalysis events={events} loading={loading} />
          <section className="mt-4">
            <TouchMapCard events={events} large loading={loading} title="Goalkeeper Touch Map" />
          </section>
        </>
      ) : (
        <PlayerMatchDashboard
          events={events}
          loading={loading || teamLoading}
          teamEvents={teamEvents}
        />
      )}
      <PlayerStatsTable
        events={events}
        goalkeeper={isGoalkeeper}
        loading={loading || teamLoading}
        playerId={selectedPlayerId}
        teamEvents={teamEvents}
      />
    </div>
  );
}

function Selector({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-muted">
      {label}
      {children}
    </label>
  );
}

function MetricRow({ loading, metrics }: { loading: boolean; metrics: { label: string; value: string }[] }) {
  return (
    <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-sm border border-border bg-border sm:grid-cols-3 xl:grid-cols-6">
      {metrics.map((metric) => (
        <div className="bg-elevated px-3 py-3" key={metric.label}>
          <p className="text-[8px] font-black uppercase tracking-wider text-muted">{metric.label}</p>
          <p className={`mt-1 text-xl font-black tabular-nums text-foreground ${loading ? "animate-pulse opacity-40" : ""}`}>
            {loading ? "—" : metric.value}
          </p>
        </div>
      ))}
    </div>
  );
}
