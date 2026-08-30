"use client";

import {
  createContext,
  type ReactNode,
  useContext,
} from "react";

export const PITCH_LENGTH = 105;
export const PITCH_WIDTH = 68;

export type PitchOrientation = "horizontal" | "vertical";

export type SvgPoint = {
  x: number;
  y: number;
};

export function mapHorizontalPitchCoordinates(x: number, y: number): SvgPoint {
  return {
    x: (x / 100) * PITCH_LENGTH,
    y: (y / 100) * PITCH_WIDTH,
  };
}

export function mapVerticalPitchCoordinates(x: number, y: number): SvgPoint {
  return {
    x: (y / 100) * PITCH_WIDTH,
    y: (x / 100) * PITCH_LENGTH,
  };
}

export function mapPitchCoordinates(
  x: number,
  y: number,
  orientation: PitchOrientation = "horizontal",
): SvgPoint {
  return orientation === "vertical"
    ? mapVerticalPitchCoordinates(x, y)
    : mapHorizontalPitchCoordinates(x, y);
}

const PitchOrientationContext = createContext<PitchOrientation>("horizontal");

export function usePitchOrientation(): PitchOrientation {
  return useContext(PitchOrientationContext);
}

type PitchProps = {
  orientation?: PitchOrientation;
  children?: ReactNode;
  className?: string;
};

export function Pitch({
  orientation = "horizontal",
  children,
  className = "block h-auto w-full",
}: PitchProps) {
  const isVertical = orientation === "vertical";
  const viewBox = isVertical ? "-1 -2.5 70 110" : "-2.5 -1 110 70";

  return (
    <PitchOrientationContext.Provider value={orientation}>
      <svg
        aria-label={`${orientation} football pitch`}
        className={className}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        viewBox={viewBox}
        xmlns="http://www.w3.org/2000/svg"
      >
        <g transform={isVertical ? "matrix(0 1 1 0 0 0)" : undefined}>
          <rect
            fill="var(--pitch-bg)"
            height={PITCH_WIDTH}
            width={PITCH_LENGTH}
            x={0}
            y={0}
          />
          <g
            fill="none"
            stroke="var(--pitch-line)"
            strokeWidth={0.45}
            vectorEffect="non-scaling-stroke"
          >
            <rect height={PITCH_WIDTH} width={PITCH_LENGTH} x={0} y={0} />
            <line x1={PITCH_LENGTH / 2} x2={PITCH_LENGTH / 2} y1={0} y2={PITCH_WIDTH} />
            <circle cx={PITCH_LENGTH / 2} cy={PITCH_WIDTH / 2} r={9.15} />

            <rect height={40.32} width={16.5} x={0} y={13.84} />
            <rect height={40.32} width={16.5} x={88.5} y={13.84} />
            <rect height={18.32} width={5.5} x={0} y={24.84} />
            <rect height={18.32} width={5.5} x={99.5} y={24.84} />

            <rect height={7.32} width={2.44} x={-2.44} y={30.34} />
            <rect height={7.32} width={2.44} x={PITCH_LENGTH} y={30.34} />
          </g>
          <g fill="var(--pitch-line)">
            <circle cx={PITCH_LENGTH / 2} cy={PITCH_WIDTH / 2} r={0.55} />
            <circle cx={11} cy={PITCH_WIDTH / 2} r={0.55} />
            <circle cx={94} cy={PITCH_WIDTH / 2} r={0.55} />
          </g>
        </g>
        {children}
      </svg>
    </PitchOrientationContext.Provider>
  );
}
