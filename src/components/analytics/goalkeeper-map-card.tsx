"use client";

import { Goal, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";

import { Pitch, ShotMarker, useVizTooltip } from "@/components/viz";
import { calculateGoalkeeperStats, type AnalyticsEvent } from "@/lib/analytics";

type MapMode = "goal" | "faced";

export function GoalkeeperMapCard({ events, loading }: { events: AnalyticsEvent[]; loading: boolean }) {
  const [mode, setMode] = useState<MapMode>("goal");
  const tooltip = useVizTooltip();
  const stats = useMemo(() => calculateGoalkeeperStats(events), [events]);
  const actions = stats.gkActions;
  const goalLocations = actions.filter(hasGoalCoordinates);
  const facedLocations = actions.filter(hasStartCoordinates);
  const goalsAgainst = actions.filter(isGoalConceded).length;
  const shotsFaced = stats.saves + goalsAgainst;
  const saveRate = shotsFaced ? (stats.saves / shotsFaced) * 100 : 0;

  return (
    <article className="overflow-hidden rounded-md border border-border bg-panel">
      <header className="border-b border-border px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-accent">Goalkeeper analysis</p>
            <select
              aria-label="Goalkeeper map"
              className="mt-1 h-9 rounded-sm border border-border bg-elevated px-3 text-sm font-black text-foreground focus:border-accent"
              onChange={(event) => setMode(event.target.value as MapMode)}
              value={mode}
            >
              <option value="goal">Goal Map (Saves)</option>
              <option value="faced">Shots Faced Map</option>
            </select>
          </div>
          {mode === "goal" ? <Goal className="size-4 text-muted" /> : <ShieldCheck className="size-4 text-muted" />}
        </div>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-bold uppercase tracking-wider text-muted">
          <span><strong className="text-foreground">{loading ? "—" : stats.saves}</strong> saves</span>
          <span><strong className="text-foreground">{loading ? "—" : goalsAgainst}</strong> conceded</span>
          <span><strong className="text-foreground">{loading ? "—" : `${saveRate.toFixed(1)}%`}</strong> save rate</span>
        </div>
      </header>

      <div className="bg-elevated/30 p-3 sm:p-4">
        {mode === "goal" ? (
          <div className="relative overflow-hidden rounded-md border border-border bg-[var(--pitch-bg)] p-2">
            <svg aria-label="Goal map of saves and goals conceded" className={`block h-auto w-full ${loading ? "animate-pulse opacity-50" : ""}`} role="img" viewBox="0 0 100 58">
              <rect fill="var(--pitch-bg)" height="58" width="100" />
              <g fill="none" stroke="var(--pitch-line)" strokeWidth="1.1">
                <rect height="34" rx="1" width="84" x="8" y="8" />
                {[22, 36, 50, 64, 78].map((x) => <line key={x} x1={x} x2={x} y1="8" y2="42" />)}
                {[19, 30].map((y) => <line key={y} x1="8" x2="92" y1={y} y2={y} />)}
                <line x1="0" x2="100" y1="42" y2="42" />
              </g>
              {goalLocations.map((event) => {
                const x = 8 + (Number(event.goal_x) / 100) * 84;
                const y = 42 - (Number(event.goal_y) / 100) * 34;
                const conceded = isGoalConceded(event);
                return (
                  <g key={event.id} {...tooltip.bind(eventTooltip(event))}>
                    <circle cx={x} cy={y} fill="transparent" pointerEvents="all" r={5} />
                    <circle cx={x} cy={y} fill={conceded ? "var(--pass-fail)" : "var(--assist)"} fillOpacity={conceded ? 0.95 : 0.35} r={2.5} stroke={conceded ? "var(--pass-fail)" : "var(--assist)"} strokeWidth={0.9} />
                  </g>
                );
              })}
            </svg>
            {!loading && !goalLocations.length ? <EmptyLabel text="No goal-location data in this selection" /> : null}
          </div>
        ) : (
          <div className="relative rounded-md border border-border bg-[var(--pitch-bg)] p-2 sm:p-3">
            <Pitch className={`mx-auto block h-auto w-full max-w-2xl ${loading ? "animate-pulse opacity-50" : ""}`}>
              {facedLocations.map((event) => (
                <g key={event.id} {...tooltip.bind(eventTooltip(event))}>
                  <ShotMarker
                    color={isGoalConceded(event) ? "var(--pass-fail)" : "var(--assist)"}
                    isGoal={isGoalConceded(event)}
                    opacity={0.9}
                    x={Number(event.start_x)}
                    xg={event.xg}
                    y={Number(event.start_y)}
                  />
                </g>
              ))}
            </Pitch>
            {!loading && !facedLocations.length ? <EmptyLabel text="No shot-origin data in this selection" /> : null}
          </div>
        )}
        {tooltip.overlay}
        <div className="mt-3 flex flex-wrap gap-4 text-[10px] font-semibold text-muted">
          <Legend color="var(--assist)" label="Saved" />
          <Legend color="var(--pass-fail)" label="Goal conceded" />
          <span>Hover a marker for match, minute and outcome.</span>
        </div>
      </div>
    </article>
  );
}

function hasStartCoordinates(event: AnalyticsEvent) {
  return event.start_x !== null && event.start_y !== null && Number.isFinite(Number(event.start_x)) && Number.isFinite(Number(event.start_y));
}

function hasGoalCoordinates(event: AnalyticsEvent) {
  return event.goal_x !== null && event.goal_x !== undefined && event.goal_y !== null && event.goal_y !== undefined && Number.isFinite(Number(event.goal_x)) && Number.isFinite(Number(event.goal_y));
}

function isGoalConceded(event: AnalyticsEvent) {
  return (event.outcome ?? "").toLowerCase().includes("goal conceded");
}

function eventTooltip(event: AnalyticsEvent) {
  return [
    event.matches?.opponent ? `vs ${event.matches.opponent}` : "Selected match",
    `${event.minute ?? 0}:${String(event.second ?? 0).padStart(2, "0")} · ${event.outcome ?? "Goalkeeper action"}`,
    Number(event.xg) > 0 ? `xGOT ${Number(event.xg).toFixed(2)}` : event.phase || event.set_piece || "Open play",
  ];
}

function EmptyLabel({ text }: { text: string }) {
  return <div className="pointer-events-none absolute inset-0 grid place-items-center"><span className="rounded border border-border bg-panel/90 px-3 py-2 text-xs font-semibold text-muted">{text}</span></div>;
}

function Legend({ color, label }: { color: string; label: string }) {
  return <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ backgroundColor: color }} />{label}</span>;
}
