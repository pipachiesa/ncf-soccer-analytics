"use client";

import { type ReactNode, useMemo } from "react";

import {
  mapPitchCoordinates,
  PassArrow,
  Pitch,
  ShotMarker,
  useVizTooltip,
} from "@/components/viz";
import { calculateAnalyticsKpis, type AnalyticsEvent } from "@/lib/analytics";

import { PlayerRadar } from "./player-radar";

const PASS_TYPES = new Set(["Pass", "Long Pass", "Short Pass", "Through Pass", "Cross"]);
const PASS_OK = new Set(["Successful", "Assist", "Key Pass", "Progressive Pass"]);
const SHOTS_ON_TARGET = new Set(["Goal", "Saved", "On Target"]);
const LOST_OUTCOMES = new Set(["Dispossessed", "Unsuccessful", "Lost"]);
const DEFENSIVE_TYPES = new Set([
  "Tackle",
  "Interception",
  "Recovery",
  "Clearance",
  "Block",
  "Foul Committed",
]);

export function PlayerMatchDashboard({
  events,
  teamEvents,
  loading,
}: {
  events: AnalyticsEvent[];
  teamEvents: AnalyticsEvent[];
  loading: boolean;
}) {
  return (
    <>
      <section className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <PassesPanel events={events} loading={loading} />
        <CarriesPanel events={events} loading={loading} />
        <DefensivePanel events={events} loading={loading} />
        <ShotsPanel events={events} loading={loading} />
      </section>
      <article className="mt-4 overflow-hidden rounded-md border border-border bg-panel">
        <PanelTitle number="05" title="PLAYER RADAR" />
        <PlayerRadar loading={loading} playerEvents={events} teamEvents={teamEvents} />
      </article>
    </>
  );
}

function PassesPanel({ events, loading }: PanelProps) {
  const tooltip = useVizTooltip();
  const passes = useMemo(() => events.filter((event) => PASS_TYPES.has(event.event_type ?? "")), [events]);
  const complete = passes.filter((event) => PASS_OK.has(event.outcome ?? ""));
  const progressive = passes.filter(isProgressivePass);
  const plotted = passes.filter(hasEndCoordinates);
  const accuracy = passes.length ? (complete.length / passes.length) * 100 : 0;

  return (
    <DashboardPanel number="01" title="PASSES" loading={loading} empty={!passes.length} emptyLabel="No passes">
      <Pitch className="block h-auto w-full">
        {plotted.map((event) => (
          <g key={event.id} {...tooltip.bind(eventTooltip(event))}>
            <PassArrow
            color={isProgressivePass(event) ? "var(--progressive)" : PASS_OK.has(event.outcome ?? "") ? "var(--pass-ok)" : "var(--pass-fail)"}
            end_x={event.end_x}
            end_y={event.end_y}
            opacity={0.72}
            start_x={Number(event.start_x)}
            start_y={Number(event.start_y)}
            strokeWidth={0.65}
            />
          </g>
        ))}
      </Pitch>
      {tooltip.overlay}
      <StatGrid stats={[
        ["Complete", `${complete.length}/${passes.length} (${accuracy.toFixed(0)}%)`],
        ["Progressive", progressive.length],
        ["Key passes", passes.filter((event) => event.outcome === "Key Pass").length],
        ["Assists", passes.filter((event) => event.outcome === "Assist").length],
        ["Crosses", passes.filter((event) => event.event_type === "Cross").length],
        ["Long balls", passes.filter((event) => event.event_type === "Long Pass").length],
      ]} />
    </DashboardPanel>
  );
}

function CarriesPanel({ events, loading }: PanelProps) {
  const tooltip = useVizTooltip();
  const carries = useMemo(() => events.filter((event) => event.event_type === "Carry"), [events]);
  const dribbles = useMemo(() => events.filter((event) => event.event_type === "Dribble"), [events]);
  const plottedCarries = carries.filter(hasEndCoordinates);
  const progressiveCarries = carries.filter(isProgressiveCarry);
  const dribblesWon = dribbles.filter((event) => ["Successful", "Won", "Completed"].includes(event.outcome ?? ""));
  const possessionsLost = [...carries, ...dribbles].filter((event) => LOST_OUTCOMES.has(event.outcome ?? "")).length;
  const distance = carries.reduce((sum, event) => sum + carryDistance(event), 0);
  const progression = carries.reduce((sum, event) => {
    if (event.start_x === null || event.end_x === null) return sum;
    return sum + Math.max(0, Number(event.end_x) - Number(event.start_x));
  }, 0);

  return (
    <DashboardPanel number="02" title="CARRIES & DRIBBLES" loading={loading} empty={!carries.length && !dribbles.length} emptyLabel="No carries or dribbles">
      <Pitch className="block h-auto w-full">
        {plottedCarries.map((event) => (
          <g key={event.id} {...tooltip.bind(eventTooltip(event))}>
            <PassArrow
            color={LOST_OUTCOMES.has(event.outcome ?? "") ? "var(--pass-fail)" : isProgressiveCarry(event) ? "var(--progressive)" : "var(--assist)"}
            end_x={event.end_x}
            end_y={event.end_y}
            opacity={0.82}
            start_x={Number(event.start_x)}
            start_y={Number(event.start_y)}
            strokeDasharray="2 1.4"
            strokeWidth={0.75}
            />
          </g>
        ))}
        {dribbles.filter(hasStartCoordinates).map((event) => {
          const point = mapPitchCoordinates(Number(event.start_x), Number(event.start_y));
          const won = ["Successful", "Won", "Completed"].includes(event.outcome ?? "");
          return <g key={event.id} {...tooltip.bind(eventTooltip(event))}><circle cx={point.x} cy={point.y} fill="transparent" pointerEvents="all" r={4} /><circle cx={point.x} cy={point.y} fill={won ? "var(--pass-ok)" : "none"} r={1.2} stroke={won ? "var(--pass-ok)" : "var(--pass-fail)"} strokeWidth={0.65} /></g>;
        })}
      </Pitch>
      {tooltip.overlay}
      <StatGrid stats={[
        ["Carries", carries.length],
        ["Progressive", progressiveCarries.length],
        ["Dribbles", `${dribblesWon.length}/${dribbles.length}`],
        ["Distance", distance ? `${distance.toFixed(0)}m` : "—"],
        ["Progression", progression ? `+${progression.toFixed(0)}` : "—"],
        ["Poss. lost", possessionsLost],
      ]} />
    </DashboardPanel>
  );
}

function DefensivePanel({ events, loading }: PanelProps) {
  const tooltip = useVizTooltip();
  const actions = useMemo(() => events.filter((event) => DEFENSIVE_TYPES.has(event.event_type ?? "")), [events]);
  const tackles = events.filter((event) => event.event_type === "Tackle");
  const groundDuels = events.filter((event) => ["Ground Duel", "Defensive Duel"].includes(event.event_type ?? ""));
  const aerialDuels = events.filter((event) => event.event_type === "Aerial Duel");

  return (
    <DashboardPanel number="03" title="DEFENSIVE ACTIONS" loading={loading} empty={!actions.length} emptyLabel="No defensive actions">
      <Pitch className="block h-auto w-full">
        {actions.filter(hasStartCoordinates).map((event) => {
          const point = mapPitchCoordinates(Number(event.start_x), Number(event.start_y));
          return <g key={event.id} {...tooltip.bind(eventTooltip(event))}><circle cx={point.x} cy={point.y} fill="transparent" pointerEvents="all" r={4} /><DefensiveMarker event={event} /></g>;
        })}
      </Pitch>
      {tooltip.overlay}
      <div className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-[8px] font-bold text-muted">
        <MarkerLegend marker="●" label="Tackle" />
        <MarkerLegend marker="■" label="Interception" />
        <MarkerLegend marker="◆" label="Recovery" />
        <MarkerLegend marker="▲" label="Clearance" />
        <MarkerLegend marker="×" label="Block" />
        <MarkerLegend marker="○" label="Foul" />
      </div>
      <StatGrid stats={[
        ["Tackles", `${wonCount(tackles)}/${tackles.length}`],
        ["Intercept.", events.filter((event) => event.event_type === "Interception").length],
        ["Clearances", events.filter((event) => event.event_type === "Clearance").length],
        ["Recoveries", events.filter((event) => event.event_type === "Recovery").length],
        ["Aerial won", wonCount(aerialDuels)],
        ["Ground won", wonCount(groundDuels)],
      ]} />
    </DashboardPanel>
  );
}

function ShotsPanel({ events, loading }: PanelProps) {
  const tooltip = useVizTooltip();
  const shots = useMemo(() => events.filter((event) => event.event_type === "Shot"), [events]);
  const stats = calculateAnalyticsKpis(shots);

  return (
    <DashboardPanel number="04" title="SHOTS" loading={loading} empty={!shots.length} emptyLabel="No shots">
      <Pitch className="block h-auto w-full">
        {shots.filter(hasStartCoordinates).map((event) => (
          <g key={event.id} {...tooltip.bind(eventTooltip(event))}>
            <ShotMarker
            color={event.outcome === "Goal" ? "var(--accent)" : SHOTS_ON_TARGET.has(event.outcome ?? "") ? "var(--assist)" : "var(--pass-fail)"}
            isGoal={event.outcome === "Goal"}
            opacity={event.outcome === "Goal" ? 1 : 0.78}
            x={Number(event.start_x)}
            xg={event.xg}
            y={Number(event.start_y)}
            />
          </g>
        ))}
      </Pitch>
      {tooltip.overlay}
      <StatGrid stats={[
        ["Shots", stats.totalShots],
        ["On target", stats.shotsOnTarget],
        ["Goals", stats.goals],
        ["xG", stats.xgTotal.toFixed(2)],
      ]} />
    </DashboardPanel>
  );
}

type PanelProps = { events: AnalyticsEvent[]; loading: boolean };

function DashboardPanel({ number, title, loading, empty, emptyLabel, children }: { number: string; title: string; loading: boolean; empty: boolean; emptyLabel: string; children: ReactNode }) {
  return (
    <article className="overflow-hidden rounded-md border border-border bg-panel">
      <PanelTitle number={number} title={title} />
      <div className={`relative bg-elevated/30 p-3 ${loading ? "animate-pulse opacity-50" : ""}`}>
        {children}
        {!loading && empty ? (
          <div className="pointer-events-none absolute inset-x-3 top-3 grid aspect-[110/70] place-items-center">
            <span className="rounded border border-border bg-panel/90 px-2.5 py-1.5 text-[10px] font-bold text-muted">{emptyLabel}</span>
          </div>
        ) : null}
      </div>
    </article>
  );
}

function PanelTitle({ number, title }: { number: string; title: string }) {
  return (
    <header className="flex items-center gap-2 border-b border-border px-3 py-3">
      <span className="text-base font-black text-accent">{number}</span>
      <h2 className="text-[10px] font-black uppercase tracking-[0.14em] text-foreground">{title}</h2>
    </header>
  );
}

function StatGrid({ stats }: { stats: [string, string | number][] }) {
  return (
    <div className="mt-3 grid grid-cols-2 gap-px overflow-hidden rounded-sm border border-border bg-border">
      {stats.map(([label, value]) => (
        <div className="bg-panel px-2 py-2" key={label}>
          <p className="text-[7px] font-black uppercase tracking-wider text-muted">{label}</p>
          <p className="mt-0.5 text-xs font-black tabular-nums text-foreground">{value}</p>
        </div>
      ))}
    </div>
  );
}

function DefensiveMarker({ event }: { event: AnalyticsEvent }) {
  const point = mapPitchCoordinates(Number(event.start_x), Number(event.start_y));
  const common = { fill: "var(--accent)", stroke: "var(--pitch-bg)", strokeWidth: 0.45 };
  if (event.event_type === "Tackle") return <circle {...common} cx={point.x} cy={point.y} r={1.25} />;
  if (event.event_type === "Interception") return <rect {...common} height={2.3} width={2.3} x={point.x - 1.15} y={point.y - 1.15} />;
  if (event.event_type === "Recovery") return <path {...common} d={`M ${point.x} ${point.y - 1.5} L ${point.x + 1.5} ${point.y} L ${point.x} ${point.y + 1.5} L ${point.x - 1.5} ${point.y} Z`} />;
  if (event.event_type === "Clearance") return <path {...common} d={`M ${point.x} ${point.y - 1.6} L ${point.x + 1.5} ${point.y + 1.2} L ${point.x - 1.5} ${point.y + 1.2} Z`} />;
  if (event.event_type === "Block") return <path d={`M ${point.x - 1.2} ${point.y - 1.2} L ${point.x + 1.2} ${point.y + 1.2} M ${point.x + 1.2} ${point.y - 1.2} L ${point.x - 1.2} ${point.y + 1.2}`} fill="none" stroke="var(--assist)" strokeWidth={0.75} />;
  return <circle cx={point.x} cy={point.y} fill="none" r={1.35} stroke="var(--pass-fail)" strokeWidth={0.7} />;
}

function MarkerLegend({ marker, label }: { marker: string; label: string }) {
  return <span><strong className="text-accent">{marker}</strong> {label}</span>;
}

function hasStartCoordinates(event: AnalyticsEvent) {
  return event.start_x !== null && event.start_y !== null && Number.isFinite(Number(event.start_x)) && Number.isFinite(Number(event.start_y));
}

function hasEndCoordinates(event: AnalyticsEvent) {
  return hasStartCoordinates(event) && event.end_x !== null && event.end_y !== null && Number.isFinite(Number(event.end_x)) && Number.isFinite(Number(event.end_y));
}

function isProgressivePass(event: AnalyticsEvent) {
  return event.progressive === true || event.outcome === "Progressive Pass";
}

function isProgressiveCarry(event: AnalyticsEvent) {
  return event.progressive === true || (event.start_x !== null && event.end_x !== null && Number(event.end_x) - Number(event.start_x) >= 10);
}

function carryDistance(event: AnalyticsEvent) {
  if (Number.isFinite(Number(event.distance_m)) && Number(event.distance_m) > 0) return Number(event.distance_m);
  if (!hasEndCoordinates(event)) return 0;
  const dx = ((Number(event.end_x) - Number(event.start_x)) / 100) * 105;
  const dy = ((Number(event.end_y) - Number(event.start_y)) / 100) * 68;
  return Math.hypot(dx, dy);
}

function wonCount(events: AnalyticsEvent[]) {
  return events.filter((event) => ["Won", "Successful"].includes(event.outcome ?? "")).length;
}

function eventTooltip(event: AnalyticsEvent) {
  return [
    event.matches?.opponent ? `vs ${event.matches.opponent}` : "Selected match",
    `${event.minute ?? 0}:${String(event.second ?? 0).padStart(2, "0")} · ${event.event_type ?? "Action"}`,
    event.outcome ?? "No outcome",
  ];
}
