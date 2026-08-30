"use client";

import { useCallback, useState, type PointerEvent } from "react";

type TooltipState = { lines: string[]; x: number; y: number } | null;

export function useVizTooltip() {
  const [tooltip, setTooltip] = useState<TooltipState>(null);

  const bind = useCallback((lines: string[]) => ({
    "aria-label": lines.join(" · "),
    onPointerEnter: (event: PointerEvent<SVGGElement>) => {
      setTooltip({ lines, x: event.clientX + 14, y: event.clientY + 14 });
    },
    onPointerMove: (event: PointerEvent<SVGGElement>) => {
      setTooltip({ lines, x: event.clientX + 14, y: event.clientY + 14 });
    },
    onPointerLeave: () => setTooltip(null),
    role: "graphics-symbol" as const,
    style: { cursor: "help" },
  }), []);

  const overlay = tooltip ? (
    <div
      className="pointer-events-none fixed z-[100] max-w-64 rounded-md border border-border bg-panel px-3 py-2 text-left text-xs text-foreground shadow-2xl"
      style={{ left: Math.min(tooltip.x, window.innerWidth - 260), top: Math.min(tooltip.y, window.innerHeight - 110) }}
    >
      <p className="font-black text-accent">{tooltip.lines[0]}</p>
      {tooltip.lines.slice(1).map((line) => <p className="mt-0.5 text-muted" key={line}>{line}</p>)}
    </div>
  ) : null;

  return { bind, overlay };
}
