"use client";

import { Activity, Goal, Hand, type LucideIcon } from "lucide-react";
import { useMemo } from "react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import { Pitch, mapPitchCoordinates, useVizTooltip } from "@/components/viz";
import { calculateAnalyticsKpis, calculateGoalkeeperStats, type AnalyticsEvent } from "@/lib/analytics";

export function GoalkeeperAnalysis({ events, loading }: { events: AnalyticsEvent[]; loading: boolean }) {
  const stats = useMemo(() => calculateGoalkeeperStats(events), [events]);
  const actions = stats.gkActions.filter(hasStartCoordinates);
  const goalActions = stats.gkActions.filter(hasGoalCoordinates);

  return (
    <section className={`mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2 ${loading ? "animate-pulse opacity-60" : ""}`}>
      <article className="overflow-hidden rounded-md border border-border bg-panel">
        <PanelHeader icon={Hand} eyebrow="Goalkeeper analysis" title="GK action map" />
        <GoalkeeperActionMap actions={actions} />
      </article>
      <article className="overflow-hidden rounded-md border border-border bg-panel">
        <PanelHeader icon={Goal} eyebrow="Shot stopping" title="Goal mouth" />
        <GoalMouth actions={goalActions} />
      </article>
      <article className="overflow-hidden rounded-md border border-border bg-panel xl:col-span-2">
        <PanelHeader icon={Activity} eyebrow="Goalkeeper traits" title="Distribution & shot-stopping profile" />
        <GoalkeeperRadar events={events} />
      </article>
    </section>
  );
}

function GoalkeeperActionMap({ actions }: { actions: AnalyticsEvent[] }) {
  const tooltip = useVizTooltip();
  return (
    <div className="bg-elevated/30 p-3 sm:p-4">
      <div className="relative rounded-md border border-border bg-[var(--pitch-bg)] p-2">
        <Pitch className="mx-auto block h-auto w-full max-w-3xl">
          {actions.map((event) => {
            const point = mapPitchCoordinates(Number(event.start_x), Number(event.start_y));
            return (
              <g key={event.id} {...tooltip.bind(actionTooltip(event))}>
                <circle cx={point.x} cy={point.y} fill="transparent" pointerEvents="all" r={4} />
                <circle cx={point.x} cy={point.y} fill={gkActionColor(event)} opacity={0.92} r={1.55} stroke="var(--pitch-bg)" strokeWidth={0.45} />
              </g>
            );
          })}
        </Pitch>
        {!actions.length ? <EmptyLabel text="No GK actions in this selection" /> : null}
      </div>
      {tooltip.overlay}
      <div className="mt-3 flex flex-wrap gap-3 text-[10px] font-semibold text-muted">
        <Legend color="var(--assist)" label="Save / claim" />
        <Legend color="var(--accent)" label="Punch" />
        <Legend color="var(--pass-fail)" label="Goal conceded" />
        <Legend color="var(--muted)" label="Other" />
      </div>
    </div>
  );
}

function GoalMouth({ actions }: { actions: AnalyticsEvent[] }) {
  const tooltip = useVizTooltip();
  const saves = actions.filter((event) => event.outcome?.toLowerCase().includes("save")).length;
  const goals = actions.filter((event) => event.outcome?.toLowerCase().includes("goal conceded")).length;
  const xgot = actions.reduce((sum, event) => sum + (Number(event.xg) || 0), 0);

  return (
    <div className="bg-elevated/30 p-3 sm:p-4">
      <div className="relative overflow-hidden rounded-md border border-border bg-[var(--pitch-bg)] p-2">
        <svg aria-label="Goalkeeper shot stopping goal map" className="block h-auto w-full" role="img" viewBox="0 0 100 58">
          <rect fill="var(--pitch-bg)" height="58" width="100" />
          <g fill="none" stroke="var(--pitch-line)" strokeWidth="1.1">
            <rect height="34" rx="1" width="84" x="8" y="8" />
            {[22, 36, 50, 64, 78].map((x) => <line key={x} x1={x} x2={x} y1="8" y2="42" />)}
            {[19, 30].map((y) => <line key={y} x1="8" x2="92" y1={y} y2={y} />)}
            <line x1="0" x2="100" y1="42" y2="42" />
          </g>
          {actions.map((event) => {
            const x = 8 + (Number(event.goal_x) / 100) * 84;
            const y = 42 - (Number(event.goal_y) / 100) * 34;
            const conceded = event.outcome?.toLowerCase().includes("goal conceded");
            return (
              <g key={event.id} {...tooltip.bind(actionTooltip(event))}>
                <circle cx={x} cy={y} fill="transparent" pointerEvents="all" r={5} />
                <circle cx={x} cy={y} fill={conceded ? "var(--pass-fail)" : "var(--assist)"} fillOpacity={conceded ? 0.95 : 0.3} r={2.4} stroke={conceded ? "var(--pass-fail)" : "var(--assist)"} strokeWidth={0.9} />
              </g>
            );
          })}
        </svg>
        {!actions.length ? <EmptyLabel text="No goal-location data in this selection" /> : null}
      </div>
      {tooltip.overlay}
      <div className="mt-4 grid grid-cols-3 gap-px overflow-hidden rounded border border-border bg-border text-center">
        <GoalStat label="Shots faced" value={actions.length.toString()} />
        <GoalStat label="Goals against" value={goals.toString()} />
        <GoalStat label="xGOT faced" value={xgot ? xgot.toFixed(2) : "—"} />
      </div>
      <p className="mt-2 text-[9px] text-muted">{saves} saves plotted · hover a marker for match, minute and outcome.</p>
    </div>
  );
}

function GoalkeeperRadar({ events }: { events: AnalyticsEvent[] }) {
  const stats = calculateGoalkeeperStats(events);
  const kpis = calculateAnalyticsKpis(events);
  const goals = stats.gkActions.filter((event) => event.outcome?.toLowerCase().includes("goal conceded")).length;
  const faced = stats.saves + goals;
  const sweeperActions = stats.gkActions.filter((event) => Number(event.start_x) >= 16.5).length;
  const values = [
    { metric: "Save %", value: faced ? (stats.saves / faced) * 100 : 0, raw: faced ? `${((stats.saves / faced) * 100).toFixed(1)}%` : "—" },
    { metric: "Distribution", value: stats.distributionRate, raw: `${stats.distributionRate}%` },
    { metric: "Pass %", value: kpis.passAccuracy, raw: `${kpis.passAccuracy.toFixed(1)}%` },
    { metric: "Long pass %", value: kpis.longPassAccuracy, raw: `${kpis.longPassAccuracy.toFixed(1)}%` },
    { metric: "Claims", value: Math.min(100, stats.claims * 20), raw: stats.claims.toString() },
    { metric: "Sweeper", value: stats.gkActions.length ? (sweeperActions / stats.gkActions.length) * 100 : 0, raw: sweeperActions.toString() },
  ];
  return (
    <div className="grid grid-cols-1 gap-4 bg-elevated/30 p-4 lg:grid-cols-[1fr_260px] lg:items-center">
      <div className="h-[360px] min-w-0">
        <ResponsiveContainer height="100%" width="100%">
          <RadarChart data={values} outerRadius="72%">
            <PolarGrid stroke="var(--border)" />
            <PolarAngleAxis dataKey="metric" tick={{ fill: "var(--text)", fontSize: 11, fontWeight: 700 }} />
            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} />
            <Radar dataKey="value" fill="var(--accent)" fillOpacity={0.3} stroke="var(--accent)" strokeWidth={2.5} />
            <Tooltip content={<GkRadarTooltip />} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
        {values.map((item) => <GoalStat key={item.metric} label={item.metric} value={item.raw} />)}
      </div>
    </div>
  );
}

function GkRadarTooltip({ active, payload }: { active?: boolean; payload?: { payload?: { metric: string; raw: string } }[] }) {
  const item = payload?.[0]?.payload;
  if (!active || !item) return null;
  return <div className="rounded border border-border bg-panel px-3 py-2 text-xs shadow-xl"><p className="font-black text-accent">{item.metric}</p><p className="text-foreground">{item.raw}</p></div>;
}

function GoalStat({ label, value }: { label: string; value: string }) {
  return <div className="bg-panel px-3 py-3"><p className="text-lg font-black tabular-nums text-foreground">{value}</p><p className="text-[8px] font-black uppercase tracking-wider text-muted">{label}</p></div>;
}

function PanelHeader({ title, eyebrow, icon: Icon }: { title: string; eyebrow: string; icon: LucideIcon }) {
  return <header className="flex items-center justify-between border-b border-border px-4 py-3"><div><p className="text-[9px] font-black uppercase tracking-[0.18em] text-accent">{eyebrow}</p><h2 className="mt-0.5 text-sm font-black text-foreground">{title}</h2></div><Icon aria-hidden="true" className="size-4 text-muted" /></header>;
}

function EmptyLabel({ text }: { text: string }) {
  return <div className="pointer-events-none absolute inset-0 grid place-items-center"><span className="rounded border border-border bg-panel/90 px-3 py-2 text-xs font-semibold text-muted">{text}</span></div>;
}

function Legend({ color, label }: { color: string; label: string }) {
  return <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ backgroundColor: color }} />{label}</span>;
}

function gkActionColor(event: AnalyticsEvent) {
  const outcome = (event.outcome ?? "").toLowerCase();
  if (outcome.includes("save") || outcome.includes("catch") || outcome.includes("claim")) return "var(--assist)";
  if (outcome.includes("punch")) return "var(--accent)";
  if (outcome.includes("goal conceded")) return "var(--pass-fail)";
  return "var(--muted)";
}

function actionTooltip(event: AnalyticsEvent) {
  return [
    event.matches?.opponent ? `vs ${event.matches.opponent}` : "Selected match",
    `${event.minute ?? 0}:${String(event.second ?? 0).padStart(2, "0")} · ${event.outcome ?? "GK action"}`,
    event.phase || event.set_piece || "Open play",
  ];
}

function hasStartCoordinates(event: AnalyticsEvent) {
  return event.start_x !== null && event.start_y !== null && Number.isFinite(Number(event.start_x)) && Number.isFinite(Number(event.start_y));
}

function hasGoalCoordinates(event: AnalyticsEvent) {
  return event.goal_x !== null && event.goal_x !== undefined && event.goal_y !== null && event.goal_y !== undefined && Number.isFinite(Number(event.goal_x)) && Number.isFinite(Number(event.goal_y));
}
