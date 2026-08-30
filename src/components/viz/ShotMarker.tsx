"use client";

import { mapPitchCoordinates, usePitchOrientation } from "./Pitch";

type ShotMarkerProps = {
  x: number;
  y: number;
  xg?: number | null;
  isGoal?: boolean;
  color?: string;
  className?: string;
  opacity?: number;
};

export function ShotMarker({
  x,
  y,
  xg = 0,
  isGoal = false,
  color = "var(--accent)",
  className,
  opacity = 0.95,
}: ShotMarkerProps) {
  const orientation = usePitchOrientation();
  const point = mapPitchCoordinates(x, y, orientation);
  const normalizedXg = Math.min(1, Math.max(0, xg ?? 0));
  const radius = 1.25 + Math.sqrt(normalizedXg) * 3.25;

  return (
    <circle
      className={className}
      cx={point.x}
      cy={point.y}
      fill={isGoal ? color : "none"}
      opacity={opacity}
      r={radius}
      stroke={color}
      strokeWidth={isGoal ? 0.5 : 0.9}
      vectorEffect="non-scaling-stroke"
    />
  );
}
