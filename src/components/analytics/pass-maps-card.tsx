"use client";

import { ChartNoAxesCombined, Maximize2, X } from "lucide-react";
import { useEffect, useState, type SVGProps } from "react";

import { PassArrow, Pitch, PitchGrid, useVizTooltip, type PitchGridItem } from "@/components/viz";
import { usePassEvents, type AnalyticsScope } from "@/hooks/use-analytics-data";
import type { AnalyticsEvent } from "@/lib/analytics";

const SUCCESSFUL_OUTCOMES = new Set([
  "Successful",
  "Assist",
  "Key Pass",
  "Progressive",
  "Progressive Pass",
]);
const FAILED_OUTCOMES = new Set(["Unsuccessful", "Lost"]);
const PROGRESSIVE_OUTCOMES = new Set(["Progressive", "Progressive Pass"]);

type PassMapsCardProps = AnalyticsScope & {
  scopeType: "team" | "player";
  selectedPlayerLabel?: string;
  selectedShirtNumber?: number | null;
};

type PlayerPassGroup = {
  playerId: number;
  name: string;
  shirtNumber: number | null;
  passes: AnalyticsEvent[];
  completed: number;
  progressive: number;
  keyPasses: number;
  assists: number;
  crosses: number;
  accuracy: number;
};

function isCompleted(pass: AnalyticsEvent) {
  return SUCCESSFUL_OUTCOMES.has(pass.outcome ?? "");
}

function isProgressive(pass: AnalyticsEvent) {
  return pass.progressive === true || PROGRESSIVE_OUTCOMES.has(pass.outcome ?? "");
}

function passColor(pass: AnalyticsEvent) {
  if (isProgressive(pass)) return "var(--progressive)";
  if (isCompleted(pass)) return "var(--pass-ok)";
  if (FAILED_OUTCOMES.has(pass.outcome ?? "")) return "var(--pass-fail)";
  return "var(--muted)";
}

function eventPlayerName(event: AnalyticsEvent) {
  return [event.players?.first_name, event.players?.last_name].filter(Boolean).join(" ") || "Unknown player";
}

function summarizePlayerPasses(passes: AnalyticsEvent[]): PlayerPassGroup[] {
  const groups = new Map<number, AnalyticsEvent[]>();

  passes.forEach((pass) => {
    if (pass.player_id === null) return;
    const playerPasses = groups.get(pass.player_id) ?? [];
    playerPasses.push(pass);
    groups.set(pass.player_id, playerPasses);
  });

  return Array.from(groups, ([playerId, playerPasses]) => {
    const sample = playerPasses[0];
    const completed = playerPasses.filter(isCompleted).length;

    return {
      playerId,
      name: sample ? eventPlayerName(sample) : "Unknown player",
      shirtNumber: sample?.players?.shirt_number ?? null,
      passes: playerPasses,
      completed,
      progressive: playerPasses.filter(isProgressive).length,
      keyPasses: playerPasses.filter((pass) => pass.outcome === "Key Pass").length,
      assists: playerPasses.filter((pass) => pass.outcome === "Assist").length,
      crosses: playerPasses.filter((pass) => pass.event_type === "Cross").length,
      accuracy: playerPasses.length ? Math.round((completed / playerPasses.length) * 1000) / 10 : 0,
    };
  }).sort((a, b) => b.passes.length - a.passes.length || a.name.localeCompare(b.name));
}

function Passes({
  passes,
  compact = false,
  bind,
}: {
  passes: AnalyticsEvent[];
  compact?: boolean;
  bind?: (lines: string[]) => SVGProps<SVGGElement>;
}) {
  return passes.map((pass) => (
    <g key={pass.id} {...bind?.([
      eventPlayerName(pass),
      `${pass.minute ?? 0}:${String(pass.second ?? 0).padStart(2, "0")} · ${pass.outcome ?? "Pass"}`,
      `${pass.event_type ?? "Pass"}${pass.progressive ? " · Progressive" : ""}`,
    ])}>
      <PassArrow
        color={passColor(pass)}
        end_x={pass.end_x}
        end_y={pass.end_y}
        opacity={compact ? 0.68 : 0.82}
        start_x={Number(pass.start_x)}
        start_y={Number(pass.start_y)}
        strokeWidth={compact ? 0.5 : 0.72}
      />
    </g>
  ));
}

function PlayerLabels({ group }: { group: PlayerPassGroup }) {
  return (
    <div className="mt-2 flex flex-wrap gap-1.5 text-[9px] font-bold uppercase tracking-wider">
      <Label token="PP" value={group.progressive} color="text-progressive" />
      <Label token="KP" value={group.keyPasses} color="text-assist" />
      <Label token="A" value={group.assists} color="text-accent" />
      <Label token="C" value={group.crosses} color="text-muted" />
    </div>
  );
}

export function PassMapsCard({
  matchId,
  playerId,
  scopeType,
  selectedPlayerLabel = "Selected player",
  selectedShirtNumber,
}: PassMapsCardProps) {
  const [expandedGroup, setExpandedGroup] = useState<PlayerPassGroup | null>(null);
  const tooltip = useVizTooltip();
  const { passes, loading, error } = usePassEvents({ matchId, playerId });
  const groups = summarizePlayerPasses(passes);
  const completed = passes.filter(isCompleted).length;
  const accuracy = passes.length ? Math.round((completed / passes.length) * 1000) / 10 : 0;
  const selectedGroup = groups[0];

  useEffect(() => {
    if (!expandedGroup) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setExpandedGroup(null);
    }
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [expandedGroup]);

  const gridItems: PitchGridItem[] = groups.map((group) => ({
    id: group.playerId,
    title: `${group.shirtNumber !== null ? `#${group.shirtNumber} · ` : ""}${group.name}`,
    subtitle: (
      <>
        <p className="text-xs font-semibold text-[var(--muted)]">
          {group.completed}/{group.passes.length} ({group.accuracy.toFixed(1)}%)
        </p>
        <PlayerLabels group={group} />
      </>
    ),
    children: <Passes bind={tooltip.bind} compact passes={group.passes} />,
    onClick: () => setExpandedGroup(group),
  }));

  return (
    <article className="overflow-hidden rounded-md border border-border bg-panel">
      <header className="border-b border-border px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-accent">Analysis</p>
            <h2 className="mt-0.5 text-sm font-bold text-foreground">Pass Maps</h2>
          </div>
          <ChartNoAxesCombined aria-hidden="true" className="size-4 text-muted" />
        </div>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-bold uppercase tracking-wider text-muted">
          <span><strong className="text-foreground">{loading ? "—" : passes.length}</strong> attempted</span>
          <span><strong className="text-foreground">{loading ? "—" : completed}</strong> completed</span>
          <span><strong className="text-foreground">{loading ? "—" : `${accuracy.toFixed(1)}%`}</strong> accuracy</span>
          {scopeType === "team" ? <span><strong className="text-foreground">{loading ? "—" : groups.length}</strong> players</span> : null}
        </div>
      </header>

      <div className="bg-elevated/30 p-3 sm:p-4">
        {error ? (
          <div className="mb-3 rounded border border-pass-fail bg-panel px-3 py-2 text-xs text-pass-fail">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="min-h-64 animate-pulse rounded-md border border-border bg-elevated" />
        ) : scopeType === "team" ? (
          gridItems.length ? (
            <PitchGrid
              className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-3"
              items={gridItems}
              pitchClassName="block h-auto w-full"
            />
          ) : (
            <EmptyPasses />
          )
        ) : (
          <div className="rounded-lg border border-border bg-panel p-4">
            <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-foreground">
                  {selectedShirtNumber !== null && selectedShirtNumber !== undefined ? `#${selectedShirtNumber} · ` : ""}
                  {selectedPlayerLabel}
                </h3>
                <p className="mt-0.5 text-xs text-muted">
                  {selectedGroup ? `${selectedGroup.completed}/${selectedGroup.passes.length} (${selectedGroup.accuracy.toFixed(1)}%)` : "0/0 (0.0%)"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {selectedGroup ? <PlayerLabels group={selectedGroup} /> : null}
                {selectedGroup ? (
                  <button aria-label="Expand pass map" className="grid size-8 place-items-center rounded border border-border text-muted hover:border-accent hover:text-accent" onClick={() => setExpandedGroup(selectedGroup)} type="button">
                    <Maximize2 className="size-3.5" />
                  </button>
                ) : null}
              </div>
            </div>
            <div
              className={`relative rounded-md border border-border bg-[var(--pitch-bg)] p-2 sm:p-3 ${selectedGroup ? "cursor-zoom-in transition hover:border-accent" : ""}`}
              onClick={() => selectedGroup && setExpandedGroup(selectedGroup)}
              onKeyDown={(event) => {
                if (selectedGroup && (event.key === "Enter" || event.key === " ")) setExpandedGroup(selectedGroup);
              }}
              role={selectedGroup ? "button" : undefined}
              tabIndex={selectedGroup ? 0 : undefined}
            >
              <Pitch className="mx-auto block h-auto w-full max-w-3xl">
                <Passes bind={tooltip.bind} passes={selectedGroup?.passes ?? []} />
              </Pitch>
              {!selectedGroup ? (
                <div className="pointer-events-none absolute inset-0 grid place-items-center">
                  <span className="rounded border border-border bg-panel/90 px-3 py-2 text-xs font-semibold text-muted">
                    No passes in this selection
                  </span>
                </div>
              ) : null}
            </div>
          </div>
        )}

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[10px] font-semibold text-muted">
          <Legend color="bg-pass-ok" label="Completed" />
          <Legend color="bg-pass-fail" label="Unsuccessful / lost" />
          <Legend color="bg-progressive" label="Progressive" />
          <span>PP progressive · KP key pass · A assist · C cross</span>
        </div>
        {tooltip.overlay}
      </div>
      {expandedGroup ? (
        <div aria-modal="true" className="fixed inset-0 z-[80] grid place-items-center bg-black/75 p-3 backdrop-blur-sm sm:p-8" onClick={() => setExpandedGroup(null)} role="dialog">
          <div className="max-h-[94vh] w-full max-w-6xl overflow-auto rounded-md border border-border bg-panel shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-panel px-4 py-3">
              <div>
                <p className="text-[9px] font-black uppercase tracking-wider text-accent">Expanded pass map</p>
                <h3 className="font-black text-foreground">{expandedGroup.shirtNumber !== null ? `#${expandedGroup.shirtNumber} · ` : ""}{expandedGroup.name}</h3>
              </div>
              <button aria-label="Close expanded pass map" className="grid size-9 place-items-center rounded border border-border text-muted hover:border-accent hover:text-accent" onClick={() => setExpandedGroup(null)} type="button"><X className="size-4" /></button>
            </header>
            <div className="p-4 sm:p-6">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
                <span>{expandedGroup.completed}/{expandedGroup.passes.length} completed · {expandedGroup.accuracy.toFixed(1)}%</span>
                <span className="inline-flex items-center gap-1 text-accent"><Maximize2 className="size-3.5" /> Hover any pass for details</span>
              </div>
              <div className="rounded-md border border-border bg-[var(--pitch-bg)] p-3">
                <Pitch className="mx-auto block h-auto w-full max-w-5xl">
                  <Passes bind={tooltip.bind} passes={expandedGroup.passes} />
                </Pitch>
              </div>
              {tooltip.overlay}
            </div>
          </div>
        </div>
      ) : null}
    </article>
  );
}

function Label({ token, value, color }: { token: string; value: number; color: string }) {
  return (
    <span className={`rounded-sm border border-border bg-elevated px-1.5 py-0.5 ${color}`}>
      {token} {value}
    </span>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`inline-block h-0.5 w-4 ${color}`} />
      {label}
    </span>
  );
}

function EmptyPasses() {
  return (
    <div className="grid min-h-64 place-items-center rounded-md border border-dashed border-border bg-panel text-xs font-semibold text-muted">
      No coordinate-complete passes in this selection
    </div>
  );
}
