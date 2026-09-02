"use client";

import { BarChart3 } from "lucide-react";
import { useMemo } from "react";

import {
  calculateAnalyticsKpis,
  calculateGoalkeeperStats,
  type AnalyticsEvent,
} from "@/lib/analytics";

type Metric = {
  key: string;
  label: string;
  value: number;
  format?: "count" | "decimal" | "percent";
  lowIsGood?: boolean;
};

type Category = { title: string; metrics: Metric[] };

export function PlayerStatsTable({
  events,
  teamEvents,
  playerId,
  goalkeeper,
  loading,
}: {
  events: AnalyticsEvent[];
  teamEvents: AnalyticsEvent[];
  playerId?: number;
  goalkeeper: boolean;
  loading: boolean;
}) {
  const categories = useMemo(
    () => buildCategories(events, goalkeeper),
    [events, goalkeeper],
  );
  const peers = useMemo(
    () => buildPeerMetrics(teamEvents, goalkeeper, playerId),
    [teamEvents, goalkeeper, playerId],
  );

  return (
    <article className="mt-4 overflow-hidden rounded-md border border-border bg-panel">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-4">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-accent">Complete statistical profile</p>
          <h2 className="mt-0.5 text-lg font-black text-foreground">Player statistics</h2>
          <p className="mt-1 text-[10px] font-semibold text-muted">
            Percentile compares this player with {peers.length} {goalkeeper ? "team goalkeeper" : "team outfield player"}{peers.length === 1 ? "" : "s"} in the same match scope.
          </p>
        </div>
        <BarChart3 aria-hidden="true" className="size-5 text-accent" />
      </header>

      <div className={`grid grid-cols-1 gap-px bg-border lg:grid-cols-2 ${loading ? "animate-pulse opacity-60" : ""}`}>
        {categories.map((category) => (
          <section className="bg-panel p-4 sm:p-5" key={category.title}>
            <h3 className="mb-4 border-b border-border pb-2 text-[10px] font-black uppercase tracking-[0.18em] text-accent">
              {category.title}
            </h3>
            <div className="space-y-3.5">
              {category.metrics.map((metric) => {
                const peerValues = peers.map((peer) => peer.get(metric.key) ?? 0);
                const percentile = percentileRank(metric.value, peerValues, metric.lowIsGood);
                return (
                  <div className="grid grid-cols-[minmax(0,1fr)_4.5rem] items-center gap-3 sm:grid-cols-[minmax(0,1fr)_4.5rem_45%]" key={metric.key}>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-foreground">{metric.label}</p>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-elevated sm:hidden">
                        <div className={`h-full rounded-full ${percentileColor(percentile)}`} style={{ width: `${percentile}%` }} />
                      </div>
                    </div>
                    <p className="text-right text-sm font-black tabular-nums text-foreground">{formatMetric(metric)}</p>
                    <div className="hidden items-center gap-2 sm:flex">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-elevated">
                        <div className={`h-full rounded-full transition-[width] ${percentileColor(percentile)}`} style={{ width: `${percentile}%` }} />
                      </div>
                      <span className="w-8 text-right text-[9px] font-black tabular-nums text-muted">P{Math.round(percentile)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
      <footer className="border-t border-border bg-elevated/40 px-4 py-3 text-[9px] font-semibold text-muted">
        Green = upper third · gold = middle third · red = lower third. Lower values are rewarded for losses, fouls and cards.
      </footer>
    </article>
  );
}

function buildPeerMetrics(teamEvents: AnalyticsEvent[], goalkeeper: boolean, selectedPlayerId?: number) {
  const grouped = new Map<number, AnalyticsEvent[]>();
  for (const event of teamEvents) {
    if (event.player_id === null) continue;
    const position = event.players?.position?.toUpperCase();
    const hasGkAction = ["GK Action", "Goalkeeper"].includes(event.event_type ?? "");
    if (goalkeeper ? position !== "GK" && !hasGkAction : position === "GK" || hasGkAction) continue;
    const list = grouped.get(event.player_id) ?? [];
    list.push(event);
    grouped.set(event.player_id, list);
  }
  if (selectedPlayerId !== undefined && !grouped.has(selectedPlayerId)) grouped.set(selectedPlayerId, []);
  return [...grouped.values()].map((playerEvents) => {
    const metricMap = new Map<string, number>();
    for (const category of buildCategories(playerEvents, goalkeeper)) {
      for (const metric of category.metrics) metricMap.set(metric.key, metric.value);
    }
    return metricMap;
  });
}

function buildCategories(events: AnalyticsEvent[], goalkeeper: boolean): Category[] {
  return goalkeeper ? goalkeeperCategories(events) : outfieldCategories(events);
}

function outfieldCategories(events: AnalyticsEvent[]): Category[] {
  const k = calculateAnalyticsKpis(events);
  const carries = events.filter((event) => event.event_type === "Carry");
  const dribbles = events.filter((event) => event.event_type === "Dribble");
  const dribblesWon = dribbles.filter((event) => isWon(event.outcome)).length;
  const finalThirdTouches = events.filter((event) => Number(event.start_x) >= 66.67).length;
  const foulsWon = events.filter((event) => event.event_type === "Foul Won").length;
  const yellowCards = events.filter((event) => ["Yellow Card", "Booking"].includes(event.event_type ?? "") || event.outcome === "Yellow Card").length;
  const redCards = events.filter((event) => event.event_type === "Red Card" || event.outcome === "Red Card").length;
  const defensiveActions = k.tackles + k.interceptions + k.totalRecoveries + k.clearances + k.blocks;

  return [
    { title: "Shooting", metrics: [
      metric("goals", "Goals", k.goals), metric("shots", "Shots", k.totalShots),
      metric("shots_on_target", "Shots on target", k.shotsOnTarget), metric("xg", "Expected goals (xG)", k.xgTotal, "decimal"),
      metric("shot_accuracy", "Shot accuracy", k.shotAccuracy, "percent"), metric("conversion", "Conversion rate", k.conversionRate, "percent"),
    ] },
    { title: "Passing", metrics: [
      metric("passes", "Passes attempted", k.totalPasses), metric("passes_complete", "Passes completed", k.passesSuccessful),
      metric("pass_accuracy", "Pass accuracy", k.passAccuracy, "percent"), metric("progressive_passes", "Progressive passes", k.progressivePasses),
      metric("key_passes", "Key passes", k.keyPasses), metric("assists", "Assists", k.assists),
      metric("long_pass_accuracy", "Long pass accuracy", k.longPassAccuracy, "percent"), metric("crosses", "Crosses", k.crosses),
    ] },
    { title: "Possession", metrics: [
      metric("touches", "Recorded touches", events.length), metric("final_third_touches", "Touches in attacking third", finalThirdTouches),
      metric("carries", "Carries", carries.length), metric("dribbles_won", "Dribbles won", dribblesWon),
      metric("dribble_success", "Dribble success", percentage(dribblesWon, dribbles.length), "percent"),
      metric("losses", "Possessions lost", k.losses, "count", true), metric("recovery_loss_ratio", "Recovery / loss ratio", k.recoveryLossRatio, "decimal"),
    ] },
    { title: "Defense", metrics: [
      metric("def_actions", "Defensive actions", defensiveActions), metric("tackles", "Tackles", k.tackles),
      metric("tackle_success", "Tackle success", k.tackleSuccess, "percent"), metric("interceptions", "Interceptions", k.interceptions),
      metric("recoveries", "Recoveries", k.totalRecoveries), metric("clearances", "Clearances", k.clearances),
      metric("blocks", "Blocks", k.blocks), metric("duels_won", "Duels won", k.duelsWon),
      metric("duel_success", "Duels won %", k.duelSuccessRate, "percent"), metric("aerial_success", "Aerial duels won %", k.aerialWinRate, "percent"),
    ] },
    { title: "Discipline", metrics: [
      metric("fouls_committed", "Fouls committed", k.foulsCommitted, "count", true), metric("fouls_won", "Fouls won", foulsWon),
      metric("yellow_cards", "Yellow cards", yellowCards, "count", true), metric("red_cards", "Red cards", redCards, "count", true),
    ] },
  ];
}

function goalkeeperCategories(events: AnalyticsEvent[]): Category[] {
  const gk = calculateGoalkeeperStats(events);
  const k = calculateAnalyticsKpis(events);
  const goalsAgainst = gk.gkActions.filter((event) => (event.outcome ?? "").toLowerCase().includes("goal conceded")).length;
  const shotsFaced = gk.saves + goalsAgainst;
  const saveRate = percentage(gk.saves, shotsFaced);
  const xgot = gk.gkActions.reduce((sum, event) => sum + (Number(event.xg) || 0), 0);
  const catches = gk.gkActions.filter((event) => ["catch", "caught", "collected"].some((term) => (event.outcome ?? "").toLowerCase().includes(term))).length;
  const sweeperActions = gk.gkActions.filter((event) => Number(event.start_x) >= 16.5).length;
  const fouls = events.filter((event) => event.event_type === "Foul Committed").length;
  const yellowCards = events.filter((event) => ["Yellow Card", "Booking"].includes(event.event_type ?? "") || event.outcome === "Yellow Card").length;
  const redCards = events.filter((event) => event.event_type === "Red Card" || event.outcome === "Red Card").length;

  return [
    { title: "Shot stopping", metrics: [
      metric("saves", "Saves", gk.saves), metric("shots_faced", "Shots faced", shotsFaced),
      metric("goals_against", "Goals conceded", goalsAgainst, "count", true), metric("save_rate", "Save percentage", saveRate, "percent"),
      metric("xgot_faced", "xGOT faced", xgot, "decimal"),
    ] },
    { title: "Distribution", metrics: [
      metric("gk_distribution", "Distribution attempts", gk.distributionTotal), metric("gk_distribution_success", "Successful distribution", gk.distributionSuccess),
      metric("gk_distribution_rate", "Distribution accuracy", gk.distributionRate, "percent"), metric("gk_passes", "Passes", k.totalPasses),
      metric("gk_pass_accuracy", "Pass accuracy", k.passAccuracy, "percent"), metric("gk_long_passes", "Long passes", k.longPasses),
      metric("gk_long_accuracy", "Long pass accuracy", k.longPassAccuracy, "percent"),
    ] },
    { title: "Area command", metrics: [
      metric("claims", "Claims", gk.claims), metric("catches", "Catches / collections", catches),
      metric("punches", "Punches", gk.punches), metric("gk_actions", "Goalkeeper actions", gk.gkActions.length),
    ] },
    { title: "Sweeper keeper", metrics: [
      metric("sweeper_actions", "Actions outside goal area", sweeperActions), metric("gk_recoveries", "Recoveries", k.totalRecoveries),
      metric("gk_clearances", "Clearances", k.clearances), metric("gk_touches", "Recorded touches", events.length),
    ] },
    { title: "Discipline", metrics: [
      metric("gk_fouls", "Fouls committed", fouls, "count", true), metric("gk_yellow", "Yellow cards", yellowCards, "count", true),
      metric("gk_red", "Red cards", redCards, "count", true),
    ] },
  ];
}

function metric(key: string, label: string, value: number, format: Metric["format"] = "count", lowIsGood = false): Metric {
  return { key, label, value, format, lowIsGood };
}

function percentileRank(value: number, cohort: number[], lowIsGood = false) {
  if (cohort.length <= 1) return 50;
  const better = cohort.filter((peer) => lowIsGood ? peer > value : peer < value).length;
  const equal = cohort.filter((peer) => peer === value).length;
  return Math.max(1, Math.min(99, ((better + equal * 0.5) / cohort.length) * 100));
}

function percentileColor(percentile: number) {
  if (percentile >= 67) return "bg-pass-ok";
  if (percentile >= 34) return "bg-accent";
  return "bg-pass-fail";
}

function formatMetric(metric: Metric) {
  if (metric.format === "percent") return `${metric.value.toFixed(1)}%`;
  if (metric.format === "decimal") return metric.value.toFixed(2);
  return Math.round(metric.value).toLocaleString("en-US");
}

function percentage(part: number, total: number) {
  return total > 0 ? (part / total) * 100 : 0;
}

function isWon(outcome: string | null) {
  return ["Won", "Successful", "Completed"].includes(outcome ?? "");
}
