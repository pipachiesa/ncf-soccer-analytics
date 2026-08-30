"use client";

import { useId } from "react";

import { mapPitchCoordinates, usePitchOrientation } from "./Pitch";

type PassArrowProps = {
  start_x: number;
  start_y: number;
  end_x?: number | null;
  end_y?: number | null;
  color?: string;
  className?: string;
  strokeWidth?: number;
  opacity?: number;
  strokeDasharray?: string;
};

export function PassArrow({
  start_x,
  start_y,
  end_x,
  end_y,
  color = "var(--pass-ok)",
  className,
  strokeWidth = 0.8,
  opacity = 0.9,
  strokeDasharray,
}: PassArrowProps) {
  const orientation = usePitchOrientation();
  const reactId = useId();

  if (end_x == null || end_y == null) {
    return null;
  }

  const start = mapPitchCoordinates(start_x, start_y, orientation);
  const end = mapPitchCoordinates(end_x, end_y, orientation);
  const markerId = `pass-arrow-${reactId.replaceAll(":", "")}`;

  return (
    <g className={className} opacity={opacity}>
      <defs>
        <marker
          id={markerId}
          markerHeight="4"
          markerUnits="strokeWidth"
          markerWidth="4"
          orient="auto"
          refX="3.4"
          refY="2"
          viewBox="0 0 4 4"
        >
          <path d="M 0 0 L 4 2 L 0 4 z" fill={color} />
        </marker>
      </defs>
      <line
        pointerEvents="stroke"
        stroke="transparent"
        strokeLinecap="round"
        strokeWidth={Math.max(4, strokeWidth * 6)}
        vectorEffect="non-scaling-stroke"
        x1={start.x}
        x2={end.x}
        y1={start.y}
        y2={end.y}
      />
      <line
        markerEnd={`url(#${markerId})`}
        stroke={color}
        strokeDasharray={strokeDasharray}
        strokeLinecap="round"
        strokeWidth={strokeWidth}
        vectorEffect="non-scaling-stroke"
        x1={start.x}
        x2={end.x}
        y1={start.y}
        y2={end.y}
      />
    </g>
  );
}
