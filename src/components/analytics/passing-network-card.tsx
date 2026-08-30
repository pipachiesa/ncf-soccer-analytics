"use client";

import { Network } from "lucide-react";

import { Pitch, mapPitchCoordinates } from "@/components/viz";
import {
  usePassingNetworkData,
  type MatchLineupEntry,
} from "@/hooks/use-analytics-data";
import type { AnalyticsEvent } from "@/lib/analytics";

export type NetworkRosterPlayer = {
  player_id: number;
  first_name: string | null;
  last_name: string | null;
  shirt_number: number | null;
};

type PassingNetworkCardProps = {
  matchId: "all" | number;
  scopeType: "team" | "player";
  players: NetworkRosterPlayer[];
};

type NetworkNode = {
  playerId: number;
  name: string;
  shirtNumber: number | null;
  x: number;
  y: number;
  made: number;
  received: number;
  involvement: number;
  isStarter: boolean | null;
};

type NetworkEdge = {
  source: number;
  target: number;
  count: number;
};

function average(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 50;
}

function fullName(player?: NetworkRosterPlayer) {
  if (!player) return "Unknown player";
  return [player.first_name, player.last_name].filter(Boolean).join(" ") || "Unknown player";
}

export function buildPassingNetwork(
  passes: AnalyticsEvent[],
  lineups: MatchLineupEntry[],
  roster: NetworkRosterPlayer[],
) {
  const rosterById = new Map(roster.map((player) => [player.player_id, player]));
  const starterById = new Map(
    lineups.flatMap((lineup) =>
      lineup.player_id === null ? [] : [[lineup.player_id, lineup.is_starter] as const],
    ),
  );
  const madeLocations = new Map<number, { x: number[]; y: number[] }>();
  const receivedLocations = new Map<number, { x: number[]; y: number[] }>();
  const madeCount = new Map<number, number>();
  const receivedCount = new Map<number, number>();
  const edgeCounts = new Map<string, NetworkEdge>();

  passes.forEach((pass) => {
    if (pass.player_id === null || pass.recipient_player_id === null) return;
    const passer = pass.player_id;
    const recipient = pass.recipient_player_id;
    if (passer === recipient) return;
    const start = madeLocations.get(passer) ?? { x: [], y: [] };
    start.x.push(Number(pass.start_x));
    start.y.push(Number(pass.start_y));
    madeLocations.set(passer, start);

    const end = receivedLocations.get(recipient) ?? { x: [], y: [] };
    end.x.push(Number(pass.end_x));
    end.y.push(Number(pass.end_y));
    receivedLocations.set(recipient, end);

    madeCount.set(passer, (madeCount.get(passer) ?? 0) + 1);
    receivedCount.set(recipient, (receivedCount.get(recipient) ?? 0) + 1);

    const [source, target] = passer < recipient ? [passer, recipient] : [recipient, passer];
    const key = `${source}:${target}`;
    const edge = edgeCounts.get(key) ?? { source, target, count: 0 };
    edge.count += 1;
    edgeCounts.set(key, edge);
  });

  const playerIds = new Set([...madeCount.keys(), ...receivedCount.keys()]);
  const nodes: NetworkNode[] = Array.from(playerIds).map((playerId) => {
    const made = madeLocations.get(playerId);
    const received = receivedLocations.get(playerId);
    const location = made && made.x.length ? made : received;
    const player = rosterById.get(playerId);
    const madeTotal = madeCount.get(playerId) ?? 0;
    const receivedTotal = receivedCount.get(playerId) ?? 0;

    return {
      playerId,
      name: fullName(player),
      shirtNumber: player?.shirt_number ?? null,
      x: average(location?.x ?? []),
      y: average(location?.y ?? []),
      made: madeTotal,
      received: receivedTotal,
      involvement: madeTotal + receivedTotal,
      isStarter: starterById.get(playerId) ?? null,
    };
  });
  const nodeIds = new Set(nodes.map((node) => node.playerId));
  const edges = Array.from(edgeCounts.values())
    .filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target))
    .sort((a, b) => a.count - b.count);

  return { nodes, edges };
}

export function PassingNetworkCard({
  matchId,
  scopeType,
  players,
}: PassingNetworkCardProps) {
  const { passes, lineups, loading, error } = usePassingNetworkData(matchId);
  const { nodes, edges } = buildPassingNetwork(passes, lineups, players);

  return (
    <article className="overflow-hidden rounded-md border border-border bg-panel">
      <header className="border-b border-border px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-accent">Analysis</p>
            <h2 className="mt-0.5 text-sm font-bold text-foreground">Passing Network</h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-sm border border-border bg-elevated p-0.5 text-[9px] font-bold uppercase tracking-wider">
              <span className="rounded-sm bg-accent px-2 py-1.5 text-[var(--bg)]">Whole match</span>
              {/* TODO: split by substitution timestamps once lineup phase data is available. */}
              <button className="cursor-not-allowed px-2 py-1.5 text-muted opacity-60" disabled type="button">
                Phases · soon
              </button>
            </div>
            <Network aria-hidden="true" className="size-4 text-muted" />
          </div>
        </div>
        {matchId !== "all" && scopeType === "team" ? (
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-bold uppercase tracking-wider text-muted">
            <span><strong className="text-foreground">{loading ? "—" : passes.length}</strong> completed passes</span>
            <span><strong className="text-foreground">{loading ? "—" : nodes.length}</strong> players</span>
            <span><strong className="text-foreground">{loading ? "—" : edges.length}</strong> links</span>
          </div>
        ) : null}
      </header>

      <div className="bg-elevated/30 p-3 sm:p-4">
        {error ? (
          <div className="mb-3 rounded border border-pass-fail bg-panel px-3 py-2 text-xs text-pass-fail">
            {error}
          </div>
        ) : null}

        {matchId === "all" ? (
          <NetworkPlaceholder>Select a played match to build its passing network.</NetworkPlaceholder>
        ) : scopeType !== "team" ? (
          <NetworkPlaceholder>Switch to Team scope to view the passing network.</NetworkPlaceholder>
        ) : loading ? (
          <div className="min-h-64 animate-pulse rounded-md border border-border bg-elevated" />
        ) : nodes.length ? (
          <PassingNetworkGraphic edges={edges} nodes={nodes} />
        ) : (
          <NetworkPlaceholder>
            No completed passes with recipient data are available. Import
            recipient_shirt_number to render this network.
          </NetworkPlaceholder>
        )}

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[10px] font-semibold text-muted">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-3 rounded-full border border-accent bg-elevated" /> Starter
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-3 border border-accent bg-elevated" /> Substitute
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-px w-4 bg-assist opacity-60" /> Link volume
          </span>
          <span>Node size = passes made + received</span>
        </div>
      </div>
    </article>
  );
}

function PassingNetworkGraphic({ nodes, edges }: { nodes: NetworkNode[]; edges: NetworkEdge[] }) {
  const nodeById = new Map(nodes.map((node) => [node.playerId, node]));
  const maxInvolvement = Math.max(...nodes.map((node) => node.involvement), 1);
  const maxEdge = Math.max(...edges.map((edge) => edge.count), 1);

  return (
    <div className="rounded-md border border-border bg-[var(--pitch-bg)] p-2 sm:p-3">
      <Pitch className="mx-auto block h-auto w-full max-w-3xl">
        <g>
          {edges.map((edge) => {
            const source = nodeById.get(edge.source);
            const target = nodeById.get(edge.target);
            if (!source || !target) return null;
            const from = mapPitchCoordinates(source.x, source.y);
            const to = mapPitchCoordinates(target.x, target.y);
            const width = 0.45 + (edge.count / maxEdge) * 2.6;

            return (
              <line
                key={`${edge.source}:${edge.target}`}
                opacity={0.28 + (edge.count / maxEdge) * 0.42}
                stroke="var(--assist)"
                strokeLinecap="round"
                strokeWidth={width}
                vectorEffect="non-scaling-stroke"
                x1={from.x}
                x2={to.x}
                y1={from.y}
                y2={to.y}
              >
                <title>{`${source.name} ↔ ${target.name}: ${edge.count} completed passes`}</title>
              </line>
            );
          })}
        </g>
        <g>
          {nodes.map((node) => {
            const point = mapPitchCoordinates(node.x, node.y);
            const radius = 2.4 + Math.sqrt(node.involvement / maxInvolvement) * 3.8;
            const isSubstitute = node.isStarter === false;

            return (
              <g key={node.playerId}>
                <title>{`${node.name}: ${node.made} made, ${node.received} received`}</title>
                {isSubstitute ? (
                  <rect
                    fill="var(--elevated)"
                    height={radius * 1.8}
                    stroke="var(--accent)"
                    strokeWidth={0.75}
                    vectorEffect="non-scaling-stroke"
                    width={radius * 1.8}
                    x={point.x - radius * 0.9}
                    y={point.y - radius * 0.9}
                  />
                ) : (
                  <circle
                    cx={point.x}
                    cy={point.y}
                    fill="var(--elevated)"
                    r={radius}
                    stroke="var(--accent)"
                    strokeWidth={0.75}
                    vectorEffect="non-scaling-stroke"
                  />
                )}
                <text
                  dominantBaseline="central"
                  fill="var(--text)"
                  fontSize={Math.max(2.4, radius * 0.58)}
                  fontWeight={800}
                  pointerEvents="none"
                  textAnchor="middle"
                  x={point.x}
                  y={point.y}
                >
                  {node.shirtNumber ?? "?"}
                </text>
              </g>
            );
          })}
        </g>
      </Pitch>
    </div>
  );
}

function NetworkPlaceholder({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-64 place-items-center rounded-md border border-dashed border-border bg-panel px-5 text-center text-xs font-semibold text-muted">
      {children}
    </div>
  );
}
