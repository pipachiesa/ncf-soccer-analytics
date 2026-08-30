"use client";

import { Target } from "lucide-react";

import { Pitch, ShotMarker, useVizTooltip } from "@/components/viz";
import { useShotEvents, type AnalyticsScope } from "@/hooks/use-analytics-data";
import { calculateAnalyticsKpis, type AnalyticsEvent } from "@/lib/analytics";

const ON_TARGET_OUTCOMES = new Set(["Goal", "Saved", "On Target"]);

function shotPlayerName(shot: AnalyticsEvent) {
  return [shot.players?.first_name, shot.players?.last_name].filter(Boolean).join(" ") || "Unknown player";
}

function shotTime(shot: AnalyticsEvent) {
  const minute = shot.minute ?? 0;
  const second = shot.second ?? 0;
  return `${minute}:${second.toString().padStart(2, "0")}`;
}

function markerColor(shot: AnalyticsEvent) {
  if (shot.outcome === "Goal") return "var(--accent)";
  if (ON_TARGET_OUTCOMES.has(shot.outcome ?? "")) return "var(--assist)";
  return "var(--pass-fail)";
}

export function ShotMapCard({ matchId, playerId }: AnalyticsScope) {
  const tooltip = useVizTooltip();
  const { shots, loading, error } = useShotEvents({ matchId, playerId });
  const stats = calculateAnalyticsKpis(shots);
  const plottedShots = shots.filter(
    (shot) =>
      shot.start_x !== null &&
      shot.start_y !== null &&
      Number.isFinite(Number(shot.start_x)) &&
      Number.isFinite(Number(shot.start_y)),
  );

  return (
    <article className="overflow-hidden rounded-md border border-border bg-panel">
      <header className="border-b border-border px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-accent">Analysis</p>
            <h2 className="mt-0.5 text-sm font-bold text-foreground">Shot Map</h2>
          </div>
          <Target aria-hidden="true" className="size-4 text-muted" />
        </div>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-bold uppercase tracking-wider text-muted">
          <span><strong className="text-foreground">{loading ? "—" : stats.totalShots}</strong> shots</span>
          <span><strong className="text-foreground">{loading ? "—" : stats.goals}</strong> goals</span>
          <span><strong className="text-foreground">{loading ? "—" : stats.xgTotal.toFixed(2)}</strong> xG</span>
          <span><strong className="text-foreground">{loading ? "—" : `${stats.shotAccuracy.toFixed(1)}%`}</strong> accuracy</span>
        </div>
      </header>

      <div className="bg-elevated/30 p-3 sm:p-4">
        {error ? (
          <div className="mb-3 rounded border border-pass-fail bg-panel px-3 py-2 text-xs text-pass-fail">
            {error}
          </div>
        ) : null}

        <div className="relative rounded-md border border-border bg-[var(--pitch-bg)] p-2 sm:p-3">
          <Pitch className={`mx-auto block h-auto w-full max-w-2xl ${loading ? "animate-pulse opacity-50" : ""}`}>
            {plottedShots.map((shot) => {
              const isGoal = shot.outcome === "Goal";
              const onTarget = ON_TARGET_OUTCOMES.has(shot.outcome ?? "");

              return (
                <g
                  key={shot.id}
                  {...tooltip.bind([
                    shotPlayerName(shot),
                    `${shotTime(shot)} · ${shot.outcome ?? "Unknown outcome"}`,
                    `xG ${(Number(shot.xg) || 0).toFixed(2)}`,
                  ])}
                >
                  <ShotMarker
                    color={markerColor(shot)}
                    isGoal={isGoal}
                    opacity={isGoal ? 0.98 : onTarget ? 0.88 : 0.6}
                    x={Number(shot.start_x)}
                    xg={shot.xg}
                    y={Number(shot.start_y)}
                  />
                </g>
              );
            })}
          </Pitch>

          {!loading && !plottedShots.length ? (
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <span className="rounded border border-border bg-panel/90 px-3 py-2 text-xs font-semibold text-muted">
                No shots in this selection
              </span>
            </div>
          ) : null}
        </div>
        {tooltip.overlay}

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] font-semibold text-muted">
          <LegendItem marker="goal" label="Goal" />
          <LegendItem marker="shot" label="Shot" />
          <LegendItem marker="target" label="On target" />
          <LegendItem marker="miss" label="Off target / blocked" />
          <div className="flex items-center gap-2">
            <span>xG</span>
            <span className="inline-block size-1.5 rounded-full border border-accent" />
            <span className="inline-block size-2.5 rounded-full border border-accent" />
            <span className="inline-block size-4 rounded-full border border-accent" />
            <span className="text-[9px] uppercase tracking-wider">low → high</span>
          </div>
        </div>
      </div>
    </article>
  );
}

function LegendItem({ marker, label }: { marker: "goal" | "shot" | "target" | "miss"; label: string }) {
  const styles = {
    goal: "border-accent bg-accent",
    shot: "border-accent bg-transparent",
    target: "border-assist bg-transparent",
    miss: "border-pass-fail bg-transparent opacity-60",
  }[marker];

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`inline-block size-2.5 rounded-full border ${styles}`} />
      {label}
    </span>
  );
}
