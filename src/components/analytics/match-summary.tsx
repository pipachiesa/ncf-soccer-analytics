"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { AnalyticsMatch } from "@/components/analytics/analytics-hub";
import { Pitch, ShotMarker, useVizTooltip } from "@/components/viz";
import { useAnalyticsData } from "@/hooks/use-analytics-data";
import { calculateAnalyticsKpis, type AnalyticsEvent } from "@/lib/analytics";

const PASS_TYPES = new Set(["Pass", "Long Pass", "Short Pass", "Through Pass", "Cross"]);
const ON_TARGET = new Set(["Goal", "Saved", "On Target"]);

// To enable full both-team visuals, add a `team` column to events and import
// opponent events; then populate the opponent side here.
export function MatchSummary({ match }: { match: AnalyticsMatch }) {
  const { events, loading, error } = useAnalyticsData({ matchId: match.match_id });
  const stats = useMemo(() => calculateAnalyticsKpis(events), [events]);
  const shots = useMemo(() => events.filter((event) => event.event_type === "Shot"), [events]);
  const momentum = useMemo(() => buildMomentum(events), [events]);
  const xgRace = useMemo(() => buildXgRace(shots), [shots]);
  const result = matchResult(match.score_for, match.score_against);
  const score = match.score_for !== null && match.score_against !== null
    ? `${match.score_for}–${match.score_against}`
    : "—";

  return (
    <section className="mb-4 overflow-hidden rounded-md border border-border bg-panel">
      <header className="border-b border-border bg-elevated/50 px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-accent">Match Summary</p>
            <h2 className="mt-1 text-xl font-black tracking-tight text-foreground sm:text-2xl">
              NCF vs {match.opponent}
            </h2>
            <p className="mt-1 text-xs font-semibold text-muted">
              {match.competition || "Fixture"} · {formatLongDate(match.date)} · {match.home_away === "home" ? "Home" : "Away"}
            </p>
          </div>
          <div className="flex items-center gap-3 sm:justify-end">
            <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${resultClass(result)}`}>
              {result}
            </span>
            <span aria-label={`Final score ${score}`} className="text-4xl font-black tabular-nums text-foreground">
              {score}
            </span>
          </div>
        </div>
      </header>

      {error ? (
        <div className="m-4 rounded border border-pass-fail px-3 py-2 text-xs text-pass-fail">{error}</div>
      ) : null}

      <div className={`grid grid-cols-1 gap-px bg-border xl:grid-cols-12 ${loading ? "animate-pulse opacity-60" : ""}`}>
        <SummaryPanel className="xl:col-span-12" eyebrow="Match flow" title="NCF Momentum">
          <MomentumStrip data={momentum} />
        </SummaryPanel>

        <SummaryPanel className="xl:col-span-7" eyebrow="Chance locations" title="Shot Map">
          <MatchShotMap ncfShots={shots} />
        </SummaryPanel>

        <SummaryPanel className="xl:col-span-5" eyebrow="Match data" title="Team Stats">
          <StatsTable opponentGoals={match.score_against} stats={stats} />
        </SummaryPanel>

        <SummaryPanel className="xl:col-span-12" eyebrow="Cumulative threat" title="xG Race">
          <XgRace data={xgRace} />
        </SummaryPanel>
      </div>
    </section>
  );
}

function SummaryPanel({
  eyebrow,
  title,
  className = "",
  children,
}: {
  eyebrow: string;
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <article className={`min-w-0 bg-panel p-4 ${className}`}>
      <p className="text-[8px] font-black uppercase tracking-[0.18em] text-accent">{eyebrow}</p>
      <h3 className="mt-0.5 text-sm font-black uppercase tracking-wide text-foreground">{title}</h3>
      <div className="mt-3">{children}</div>
    </article>
  );
}

type MomentumPoint = { minute: number; intensity: number; actions: number; shots: number };

function MomentumStrip({ data }: { data: MomentumPoint[] }) {
  return (
    <div>
      <div aria-label="NCF attacking momentum by minute" className="h-40 min-w-0">
        <ResponsiveContainer height="100%" width="100%">
          <BarChart data={data} margin={{ bottom: 2, left: -28, right: 8, top: 8 }}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 5" vertical={false} />
            <XAxis
              dataKey="minute"
              interval={14}
              stroke="var(--muted)"
              tick={{ fontSize: 10 }}
              tickFormatter={(minute) => `${minute}'`}
            />
            <YAxis hide />
            <Tooltip content={<MomentumTooltip />} cursor={{ fill: "var(--elevated)", opacity: 0.5 }} />
            <Bar dataKey="intensity" fill="var(--accent)" isAnimationActive={false} maxBarSize={10} radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-[9px] font-semibold text-muted">
        <span><strong className="text-accent">NCF</strong> attacking actions</span>
        <span>Opponent momentum below axis — pending opponent events</span>
      </div>
    </div>
  );
}

function MatchShotMap({
  ncfShots,
  opponentShots = [],
}: {
  ncfShots: AnalyticsEvent[];
  opponentShots?: AnalyticsEvent[];
}) {
  const tooltip = useVizTooltip();
  const plotted = ncfShots.filter(hasStartCoordinates);

  return (
    <div>
      <div className="relative rounded border border-border bg-[var(--pitch-bg)] p-2">
        <Pitch className="block h-auto w-full">
          {plotted.map((shot) => (
            <g
              key={`ncf-${shot.id}`}
              {...tooltip.bind([
                `${shot.players?.shirt_number !== null ? `#${shot.players?.shirt_number} · ` : ""}${playerName(shot)}`,
                `${shot.minute ?? 0}:${String(shot.second ?? 0).padStart(2, "0")} · ${shot.outcome ?? "Shot"}`,
                `xG ${(Number(shot.xg) || 0).toFixed(2)}`,
              ])}
            >
              <ShotMarker
                color={shot.outcome === "Goal" ? "var(--accent)" : ON_TARGET.has(shot.outcome ?? "") ? "var(--assist)" : "var(--pass-fail)"}
                isGoal={shot.outcome === "Goal"}
                opacity={shot.outcome === "Goal" ? 1 : 0.78}
                x={Number(shot.start_x)}
                xg={shot.xg}
                y={Number(shot.start_y)}
              />
            </g>
          ))}
          {opponentShots.filter(hasStartCoordinates).map((shot) => (
            <ShotMarker
              color="var(--muted)"
              isGoal={shot.outcome === "Goal"}
              key={`opponent-${shot.id}`}
              opacity={0.65}
              x={100 - Number(shot.start_x)}
              xg={shot.xg}
              y={100 - Number(shot.start_y)}
            />
          ))}
        </Pitch>
        {!plotted.length ? (
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <span className="rounded border border-border bg-panel/90 px-3 py-2 text-xs font-bold text-muted">No NCF shots recorded</span>
          </div>
        ) : null}
      </div>
      {tooltip.overlay}
      <div className="mt-2 flex flex-wrap gap-4 text-[9px] font-bold text-muted">
        <span><i className="mr-1 inline-block size-2 rounded-full bg-accent" /> Goal</span>
        <span><i className="mr-1 inline-block size-2 rounded-full border border-assist" /> NCF shot</span>
        <span>Marker size = xG</span>
      </div>
    </div>
  );
}

type XgPoint = { minute: number; ncf: number };

function XgRace({ data }: { data: XgPoint[] }) {
  return (
    <div>
      <div className="h-64 min-w-0">
        <ResponsiveContainer height="100%" width="100%">
          <LineChart data={data} margin={{ bottom: 4, left: -22, right: 10, top: 8 }}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 4" vertical={false} />
            <XAxis dataKey="minute" domain={[0, "dataMax"]} stroke="var(--muted)" tick={{ fontSize: 9 }} type="number" unit="'" />
            <YAxis allowDecimals domain={[0, "auto"]} stroke="var(--muted)" tick={{ fontSize: 9 }} />
            <Tooltip
              contentStyle={{ background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 3, color: "var(--text)", fontSize: 11 }}
              formatter={(value) => [Number(value).toFixed(2), "NCF xG"]}
              labelFormatter={(minute) => `${minute}'`}
            />
            <Line dataKey="ncf" dot={{ fill: "var(--accent)", r: 2.5, strokeWidth: 0 }} isAnimationActive={false} name="NCF xG" stroke="var(--accent)" strokeWidth={2.5} type="stepAfter" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-1 flex flex-wrap gap-4 text-[9px] font-bold text-muted">
        <span><i className="mr-1 inline-block h-0.5 w-4 bg-accent align-middle" /> NCF</span>
        <span><i className="mr-1 inline-block h-0.5 w-4 border-t border-dashed border-muted align-middle" /> Opponent — pending data</span>
      </div>
    </div>
  );
}

function MomentumTooltip({ active, payload }: { active?: boolean; payload?: { payload?: MomentumPoint }[] }) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;
  return (
    <div className="rounded-md border border-border bg-panel px-3 py-2 text-xs shadow-xl">
      <p className="font-black text-accent">Minute {point.minute}&apos;</p>
      <p className="mt-1 text-foreground">Intensity {point.intensity.toFixed(1)}</p>
      <p className="text-muted">{point.actions} attacking actions · {point.shots} shots</p>
    </div>
  );
}

function StatsTable({
  stats,
  opponentGoals,
}: {
  stats: ReturnType<typeof calculateAnalyticsKpis>;
  opponentGoals: number | null;
}) {
  const rows: [string, string, string][] = [
    ["Goals", stats.goals.toString(), opponentGoals?.toString() ?? "—"],
    ["Possession proxy", stats.totalPasses ? "100%*" : "—", "—"],
    ["Shots", stats.totalShots.toString(), "—"],
    ["On target", stats.shotsOnTarget.toString(), "—"],
    ["xG", stats.xgTotal.toFixed(2), "—"],
    ["Passes", stats.totalPasses.toString(), "—"],
    ["Pass %", `${stats.passAccuracy.toFixed(1)}%`, "—"],
    ["Progressive passes", stats.progressivePasses.toString(), "—"],
    ["Recoveries", stats.totalRecoveries.toString(), "—"],
    ["Fouls", stats.foulsCommitted.toString(), "—"],
  ];

  return (
    <div>
      <div className="grid grid-cols-[1fr_64px_64px] border-b border-border pb-2 text-[8px] font-black uppercase tracking-wider text-muted">
        <span>Metric</span><span className="text-center text-accent">NCF</span><span className="text-center">Opp.</span>
      </div>
      {rows.map(([label, ncf, opponent]) => (
        <div className="grid grid-cols-[1fr_64px_64px] border-b border-border/70 py-2 text-[10px]" key={label}>
          <span className="font-semibold text-muted">{label}</span>
          <strong className="text-center tabular-nums text-foreground">{ncf}</strong>
          <span className="text-center tabular-nums text-muted">{opponent}</span>
        </div>
      ))}
      <p className="mt-2 text-[8px] leading-relaxed text-muted">* NCF-only pass share proxy; opponent event data is not available yet.</p>
    </div>
  );
}

function buildMomentum(events: AnalyticsEvent[]): MomentumPoint[] {
  const latestMinute = Math.max(90, ...events.map((event) => Number(event.minute) || 0));
  const points = Array.from({ length: latestMinute + 1 }, (_, minute) => ({ minute, intensity: 0, actions: 0, shots: 0 }));

  for (const event of events) {
    const minute = Math.max(0, Math.min(latestMinute, Number(event.minute) || 0));
    let weight = 0;
    if (event.event_type === "Shot") weight += 3 + (Number(event.xg) || 0) * 8;
    if (PASS_TYPES.has(event.event_type ?? "") && Number(event.end_x) >= 66.7) weight += 1;
    if (event.outcome === "Key Pass" || event.outcome === "Assist") weight += 2;
    if (event.progressive) weight += 0.7;
    points[minute].intensity += weight;
    if (weight > 0) points[minute].actions += 1;
    if (event.event_type === "Shot") points[minute].shots += 1;
  }

  return points;
}

function buildXgRace(shots: AnalyticsEvent[]): XgPoint[] {
  const ordered = [...shots].sort((a, b) => (a.minute ?? 0) - (b.minute ?? 0) || (a.second ?? 0) - (b.second ?? 0));
  let cumulative = 0;
  const points: XgPoint[] = [{ minute: 0, ncf: 0 }];
  for (const shot of ordered) {
    cumulative += Number(shot.xg) || 0;
    points.push({ minute: shot.minute ?? 0, ncf: Math.round(cumulative * 1000) / 1000 });
  }
  points.push({ minute: Math.max(90, ordered.at(-1)?.minute ?? 90), ncf: Math.round(cumulative * 1000) / 1000 });
  return points;
}

function hasStartCoordinates(event: AnalyticsEvent) {
  return event.start_x !== null && event.start_y !== null && Number.isFinite(Number(event.start_x)) && Number.isFinite(Number(event.start_y));
}

function playerName(event: AnalyticsEvent) {
  return [event.players?.first_name, event.players?.last_name].filter(Boolean).join(" ") || "Unknown player";
}

function matchResult(scoreFor: number | null, scoreAgainst: number | null) {
  if (scoreFor === null || scoreAgainst === null) return "Final";
  if (scoreFor > scoreAgainst) return "W";
  if (scoreFor < scoreAgainst) return "L";
  return "T";
}

function resultClass(result: string) {
  if (result === "W") return "border-pass-ok bg-pass-ok/10 text-pass-ok";
  if (result === "L") return "border-pass-fail bg-pass-fail/10 text-pass-fail";
  return "border-accent bg-accent/10 text-accent";
}

function formatLongDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" })
    .format(new Date(`${value}T12:00:00`));
}
