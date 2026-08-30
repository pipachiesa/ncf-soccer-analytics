"use client";

import { Flame } from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";

import { Pitch, PITCH_LENGTH, PITCH_WIDTH } from "@/components/viz";
import type { AnalyticsEvent } from "@/lib/analytics";

type HeatmapCardProps = {
  events: AnalyticsEvent[];
  loading: boolean;
};

type EventFilter = "touches" | "passes" | "defensive" | "recoveries" | "losses";
type ViewMode = "intensity" | "zones";

const GRID_COLUMNS = 12;
const GRID_ROWS = 8;

const PASS_TYPES = new Set(["Pass", "Long Pass", "Short Pass", "Through Pass", "Cross"]);
const DEFENSIVE_TYPES = new Set([
  "Defensive Duel",
  "Ground Duel",
  "Aerial Duel",
  "Tackle",
  "Interception",
  "Clearance",
  "Block",
]);
const RECOVERY_TYPES = new Set(["Recovery", "Interception"]);
const LOSS_TYPES = new Set(["Loss", "Ball Lost", "Loss/Ball Lost"]);
const ATTACKING_TYPES = new Set([
  ...PASS_TYPES,
  "Shot",
  "Carry",
  "Dribble",
  "Offensive Duel",
]);

const FILTER_OPTIONS: { value: EventFilter; label: string }[] = [
  { value: "touches", label: "All touches" },
  { value: "passes", label: "Passes" },
  { value: "defensive", label: "Defensive actions" },
  { value: "recoveries", label: "Recoveries" },
  { value: "losses", label: "Losses" },
];

type PointEvent = AnalyticsEvent & { start_x: number; start_y: number };

function hasValidCoordinates(event: AnalyticsEvent): event is PointEvent {
  const x = Number(event.start_x);
  const y = Number(event.start_y);
  return (
    event.start_x !== null &&
    event.start_y !== null &&
    Number.isFinite(x) &&
    Number.isFinite(y) &&
    x >= 0 &&
    x <= 100 &&
    y >= 0 &&
    y <= 100
  );
}

function matchesFilter(event: AnalyticsEvent, filter: EventFilter) {
  const eventType = event.event_type ?? "";
  const outcome = event.outcome ?? "";

  if (filter === "passes") return PASS_TYPES.has(eventType);
  if (filter === "defensive") return DEFENSIVE_TYPES.has(eventType);
  if (filter === "recoveries") return RECOVERY_TYPES.has(eventType);
  if (filter === "losses") {
    return LOSS_TYPES.has(eventType) || outcome === "Lost" || outcome === "Unsuccessful";
  }
  return true;
}

function gridCellOpacity(count: number, maximum: number) {
  if (!count || !maximum) return 0;
  return 0.12 + Math.pow(count / maximum, 0.7) * 0.65;
}

export function HeatmapCard({ events, loading }: HeatmapCardProps) {
  const [filter, setFilter] = useState<EventFilter>("touches");
  const [mode, setMode] = useState<ViewMode>("intensity");

  const filteredEvents = useMemo(
    () => events.filter(hasValidCoordinates).filter((event) => matchesFilter(event, filter)),
    [events, filter],
  );

  const cells = useMemo(() => {
    const counts = Array.from({ length: GRID_ROWS * GRID_COLUMNS }, () => 0);
    for (const event of filteredEvents) {
      const column = Math.min(GRID_COLUMNS - 1, Math.floor((event.start_x / 100) * GRID_COLUMNS));
      const row = Math.min(GRID_ROWS - 1, Math.floor((event.start_y / 100) * GRID_ROWS));
      counts[row * GRID_COLUMNS + column] += 1;
    }
    return counts;
  }, [filteredEvents]);

  const attackingEvents = useMemo(
    () =>
      events
        .filter(hasValidCoordinates)
        .filter((event) => ATTACKING_TYPES.has(event.event_type ?? "")),
    [events],
  );

  const zones = useMemo(() => {
    const counts = Array.from({ length: 3 }, () => 0);
    for (const event of attackingEvents) {
      const lane = Math.min(2, Math.floor((Number(event.start_y) / 100) * 3));
      counts[lane] += 1;
    }
    return counts;
  }, [attackingEvents]);

  const maximumCell = Math.max(0, ...cells);
  const shownCount = mode === "intensity" ? filteredEvents.length : attackingEvents.length;

  return (
    <article className="overflow-hidden rounded-md border border-border bg-panel">
      <header className="border-b border-border px-4 py-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-accent">Analysis</p>
            <h2 className="mt-0.5 text-sm font-bold text-foreground">Heatmap</h2>
          </div>
          <Flame aria-hidden="true" className="size-4 text-muted" />
        </div>

        <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
          <div className="inline-flex rounded-sm border border-border bg-elevated p-0.5">
            <ModeButton active={mode === "intensity"} onClick={() => setMode("intensity")}>
              Intensity
            </ModeButton>
            <ModeButton active={mode === "zones"} onClick={() => setMode("zones")}>
              Attack zones
            </ModeButton>
          </div>

          {mode === "intensity" ? (
            <div aria-label="Heatmap event type" className="flex flex-wrap gap-1">
              {FILTER_OPTIONS.map((option) => (
                <ModeButton active={filter === option.value} key={option.value} onClick={() => setFilter(option.value)}>
                  {option.label}
                </ModeButton>
              ))}
            </div>
          ) : (
            <div className="text-right text-[9px] font-bold uppercase tracking-wider text-muted">
              Left channel · Center · Right channel
            </div>
          )}
        </div>

        <p className="mt-3 text-[10px] font-bold uppercase tracking-wider text-muted">
          <strong className="text-foreground">{loading ? "—" : shownCount.toLocaleString("en-US")}</strong>{" "}
          {mode === "intensity" ? "plotted events" : "attacking actions"}
          {mode === "intensity" && !loading ? ` · peak ${maximumCell} per cell` : ""}
        </p>
      </header>

      <div className="bg-elevated/30 p-3 sm:p-4">
        <div className="relative rounded-md border border-border bg-[var(--pitch-bg)] p-2 sm:p-3">
          <Pitch className={`mx-auto block h-auto w-full max-w-2xl ${loading ? "animate-pulse opacity-50" : ""}`}>
            {mode === "intensity" ? (
              <HeatCells cells={cells} maximum={maximumCell} />
            ) : (
              <AttackZones cells={zones} total={attackingEvents.length} />
            )}
          </Pitch>

          {!loading && shownCount === 0 ? (
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <span className="rounded border border-border bg-panel/90 px-3 py-2 text-xs font-semibold text-muted">
                No events in this selection
              </span>
            </div>
          ) : null}
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-[10px] font-semibold text-muted">
          {mode === "intensity" ? (
            <IntensityLegend />
          ) : (
            <span>Share of attacking actions by channel · arrows show attacking direction</span>
          )}
          <span>{mode === "intensity" ? "Choose a map above" : "Three attacking channels"}</span>
        </div>
      </div>
    </article>
  );
}

function HeatCells({ cells, maximum }: { cells: number[]; maximum: number }) {
  const cellWidth = PITCH_LENGTH / GRID_COLUMNS;
  const cellHeight = PITCH_WIDTH / GRID_ROWS;

  return (
    <g aria-label="Event intensity grid">
      <defs>
        <filter height="150%" id="heat-blur" width="150%" x="-25%" y="-25%">
          <feGaussianBlur stdDeviation="1.35" />
        </filter>
      </defs>
      <g filter="url(#heat-blur)">
      {cells.map((count, index) => {
        const column = index % GRID_COLUMNS;
        const row = Math.floor(index / GRID_COLUMNS);
        return (
          <rect
            aria-label={`${count} event${count === 1 ? "" : "s"}`}
            fill={count / Math.max(1, maximum) > 0.7 ? "var(--pass-fail)" : count / Math.max(1, maximum) > 0.35 ? "var(--accent)" : "var(--pass-ok)"}
            fillOpacity={gridCellOpacity(count, maximum)}
            height={cellHeight}
            key={`${row}-${column}`}
            rx={2}
            width={cellWidth}
            x={column * cellWidth}
            y={row * cellHeight}
          />
        );
      })}
      </g>
    </g>
  );
}

function AttackZones({ cells, total }: { cells: number[]; total: number }) {
  const zoneHeight = PITCH_WIDTH / 3;

  return (
    <g aria-label="Attack zones">
      {cells.map((count, index) => {
        const percentage = total > 0 ? (count / total) * 100 : 0;
        const y = index * zoneHeight;
        const startX = 14;
        const endX = 91;
        const centerY = y + zoneHeight / 2;
        return (
          <g key={`channel-${index}`}>
            <path
              aria-label={`${["Left", "Center", "Right"][index]} channel: ${count} actions (${percentage.toFixed(1)}%)`}
              d={`M ${startX} ${centerY - 5.2} H ${endX - 7} L ${endX} ${centerY} L ${endX - 7} ${centerY + 5.2} H ${startX + 5} L ${startX} ${centerY} L ${startX + 5} ${centerY - 5.2} Z`}
              fill="var(--accent)"
              fillOpacity={0.2 + (percentage / 100) * 1.5}
              stroke="var(--accent)"
              strokeOpacity={0.7}
              strokeWidth={0.35}
            >
              <title>{`${["Left", "Center", "Right"][index]} channel · ${percentage.toFixed(1)}% · ${count} actions`}</title>
            </path>
            <text
              fill="var(--text)"
              fontSize={3.5}
              fontWeight={800}
              paintOrder="stroke"
              stroke="var(--pitch-bg)"
              strokeWidth={0.65}
              textAnchor="middle"
              x={endX - 13}
              y={centerY + 1.2}
            >
              {percentage.toFixed(0)}%
            </text>
            <text
              fill="var(--text)"
              fillOpacity={0.72}
              fontSize={1.8}
              fontWeight={700}
              textAnchor="middle"
              x={startX + 12}
              y={centerY + 1}
            >
              {["LEFT", "CENTER", "RIGHT"][index]}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function IntensityLegend() {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span>Low</span>
      {[0.14, 0.28, 0.42, 0.58, 0.76].map((opacity) => (
        <span
          className="inline-block h-2.5 w-4 rounded-[1px] bg-accent"
          key={opacity}
          style={{ opacity }}
        />
      ))}
      <span>High</span>
    </span>
  );
}

function ModeButton({
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
      className={`rounded-sm px-2.5 py-1.5 text-[10px] font-bold transition-colors ${
        active ? "bg-accent text-[var(--bg)]" : "text-muted hover:text-foreground"
      }`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}
