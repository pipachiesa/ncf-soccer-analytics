"use client";

import { useMemo, useSyncExternalStore } from "react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import { calculateAnalyticsKpis, type AnalyticsEvent } from "@/lib/analytics";

const DEFENSIVE_ACTIONS = new Set([
  "Tackle",
  "Interception",
  "Recovery",
  "Clearance",
  "Block",
]);

type MetricKey =
  | "passes"
  | "passAccuracy"
  | "progressivePasses"
  | "shots"
  | "xg"
  | "recoveries"
  | "duelWinRate"
  | "defensiveActions";

type RawMetrics = Record<MetricKey, number>;

type RadarDatum = {
  metric: string;
  key: MetricKey;
  player: number;
  teamAverage: number;
  playerRaw: number;
  teamAverageRaw: number;
};

const METRICS: { key: MetricKey; label: string }[] = [
  { key: "passes", label: "Passes" },
  { key: "passAccuracy", label: "Pass %" },
  { key: "progressivePasses", label: "Prog. passes" },
  { key: "shots", label: "Shots" },
  { key: "xg", label: "xG" },
  { key: "recoveries", label: "Recoveries" },
  { key: "duelWinRate", label: "Duels won %" },
  { key: "defensiveActions", label: "Def. actions" },
];

const DEFAULT_COLORS = {
  accent: "#C6A44A",
  muted: "#8FA6C0",
  border: "#243B5E",
  text: "#EAF0F7",
  panel: "#10233F",
};

const LIGHT_COLORS = {
  accent: "#B99A3E",
  muted: "#5B6B80",
  border: "#E3E1D8",
  text: "#13294B",
  panel: "#FFFFFF",
};

const COLOR_KEYS = ["accent", "muted", "border", "text", "panel"] as const;
const DARK_COLOR_SNAPSHOT = COLOR_KEYS.map((key) => DEFAULT_COLORS[key]).join("|");

export function PlayerRadar({
  playerEvents,
  teamEvents,
  loading,
}: {
  playerEvents: AnalyticsEvent[];
  teamEvents: AnalyticsEvent[];
  loading: boolean;
}) {
  const colorSnapshot = useSyncExternalStore(
    subscribeToThemeChanges,
    readColorSnapshot,
    () => DARK_COLOR_SNAPSHOT,
  );
  const colors = useMemo(() => {
    const values = colorSnapshot.split("|");
    return Object.fromEntries(COLOR_KEYS.map((key, index) => [key, values[index]])) as typeof DEFAULT_COLORS;
  }, [colorSnapshot]);

  const data = useMemo(() => buildRadarData(playerEvents, teamEvents), [playerEvents, teamEvents]);
  const participantCount = useMemo(() => {
    return new Set(teamEvents.map((event) => event.player_id).filter((id) => id !== null)).size;
  }, [teamEvents]);

  return (
    <div className={`bg-elevated/30 p-3 sm:p-5 ${loading ? "animate-pulse opacity-50" : ""}`}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] font-semibold text-muted">
          Compared with {participantCount || 0} team players in this scope
        </p>
        <p className="text-[9px] font-black uppercase tracking-wider text-muted">
          Team average = middle ring
        </p>
      </div>

      <div className="h-[360px] min-w-0 sm:h-[430px]">
        <ResponsiveContainer height="100%" width="100%">
          <RadarChart data={data} outerRadius="72%">
            <PolarGrid stroke={colors.border} />
            <PolarAngleAxis
              dataKey="metric"
              tick={{ fill: colors.text, fontSize: 11, fontWeight: 700 }}
              tickLine={false}
            />
            <PolarRadiusAxis
              angle={90}
              axisLine={false}
              domain={[0, 100]}
              tick={false}
              tickCount={5}
            />
            <Radar
              dataKey="teamAverage"
              fill="transparent"
              name="Team average"
              stroke={colors.muted}
              strokeDasharray="5 4"
              strokeWidth={2}
            />
            <Radar
              dataKey="player"
              fill={colors.accent}
              fillOpacity={0.3}
              name="Selected player"
              stroke={colors.accent}
              strokeWidth={2.5}
            />
            <Tooltip content={<RadarTooltip colors={colors} />} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-1 flex flex-wrap justify-center gap-5 text-[10px] font-bold text-muted">
        <LegendLine color={colors.accent} filled label="Selected player" />
        <LegendLine color={colors.muted} label="Team average" />
      </div>
    </div>
  );
}

function subscribeToThemeChanges(onStoreChange: () => void) {
  const observer = new MutationObserver(onStoreChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}

function readColorSnapshot() {
  const styles = getComputedStyle(document.documentElement);
  const fallback = document.documentElement.classList.contains("dark") ? DEFAULT_COLORS : LIGHT_COLORS;
  return COLOR_KEYS.map((key) => styles.getPropertyValue(`--${key}`).trim() || fallback[key]).join("|");
}

function buildRadarData(playerEvents: AnalyticsEvent[], teamEvents: AnalyticsEvent[]): RadarDatum[] {
  const playerMetrics = calculateRawMetrics(playerEvents);
  const eventsByPlayer = new Map<number, AnalyticsEvent[]>();

  for (const event of teamEvents) {
    if (event.player_id === null) continue;
    const existing = eventsByPlayer.get(event.player_id) ?? [];
    existing.push(event);
    eventsByPlayer.set(event.player_id, existing);
  }

  const teamPlayers = [...eventsByPlayer.values()].map(calculateRawMetrics);
  const teamAverage = METRICS.reduce((average, { key }) => {
    average[key] = teamPlayers.length
      ? teamPlayers.reduce((sum, metrics) => sum + metrics[key], 0) / teamPlayers.length
      : 0;
    return average;
  }, emptyMetrics());

  return METRICS.map(({ key, label }) => {
    const average = teamAverage[key];
    return {
      metric: label,
      key,
      player: normalizeAgainstAverage(playerMetrics[key], average),
      teamAverage: average > 0 ? 50 : 0,
      playerRaw: playerMetrics[key],
      teamAverageRaw: average,
    };
  });
}

function calculateRawMetrics(events: AnalyticsEvent[]): RawMetrics {
  const stats = calculateAnalyticsKpis(events);
  return {
    passes: stats.totalPasses,
    passAccuracy: stats.passAccuracy,
    progressivePasses: stats.progressivePasses,
    shots: stats.totalShots,
    xg: stats.xgTotal,
    recoveries: stats.totalRecoveries,
    duelWinRate: stats.duelSuccessRate,
    defensiveActions: events.filter((event) => DEFENSIVE_ACTIONS.has(event.event_type ?? "")).length,
  };
}

function emptyMetrics(): RawMetrics {
  return {
    passes: 0,
    passAccuracy: 0,
    progressivePasses: 0,
    shots: 0,
    xg: 0,
    recoveries: 0,
    duelWinRate: 0,
    defensiveActions: 0,
  };
}

function normalizeAgainstAverage(value: number, average: number) {
  if (average <= 0) return value > 0 ? 100 : 0;
  return Math.min(100, Math.max(0, (value / average) * 50));
}

function RadarTooltip({
  active,
  payload,
  colors,
}: {
  active?: boolean;
  payload?: { payload?: RadarDatum }[];
  colors: typeof DEFAULT_COLORS;
}) {
  const item = payload?.[0]?.payload;
  if (!active || !item) return null;

  return (
    <div
      className="rounded-sm border px-3 py-2 text-xs shadow-xl"
      style={{ backgroundColor: colors.panel, borderColor: colors.border, color: colors.text }}
    >
      <p className="font-black">{item.metric}</p>
      <p className="mt-1" style={{ color: colors.accent }}>
        Player: {formatRawValue(item.key, item.playerRaw)}
      </p>
      <p style={{ color: colors.muted }}>
        Team average: {formatRawValue(item.key, item.teamAverageRaw)}
      </p>
    </div>
  );
}

function formatRawValue(key: MetricKey, value: number) {
  if (key === "passAccuracy" || key === "duelWinRate") return `${value.toFixed(1)}%`;
  if (key === "xg") return value.toFixed(2);
  return Number.isInteger(value) ? value.toString() : value.toFixed(1);
}

function LegendLine({ color, label, filled = false }: { color: string; label: string; filled?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="inline-block h-2.5 w-5 border-2"
        style={{ backgroundColor: filled ? `${color}4D` : "transparent", borderColor: color }}
      />
      {label}
    </span>
  );
}
