import type { ReactNode } from "react";

import { Pitch, type PitchOrientation } from "./Pitch";

export type PitchGridItem = {
  id: string | number;
  title: ReactNode;
  subtitle?: ReactNode;
  children?: ReactNode;
  orientation?: PitchOrientation;
  onClick?: () => void;
};

type PitchGridProps = {
  items: PitchGridItem[];
  className?: string;
  pitchClassName?: string;
};

export function PitchGrid({
  items,
  className = "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3",
  pitchClassName = "block h-auto w-full",
}: PitchGridProps) {
  return (
    <div className={className}>
      {items.map((item) => (
        <article
          className={`overflow-hidden rounded-lg border bg-[var(--panel)] p-4 ${item.onClick ? "cursor-zoom-in transition hover:border-[var(--accent)] hover:shadow-lg" : ""}`}
          key={item.id}
          onClick={item.onClick}
          onKeyDown={(event) => {
            if (!item.onClick || (event.key !== "Enter" && event.key !== " ")) return;
            event.preventDefault();
            item.onClick();
          }}
          role={item.onClick ? "button" : undefined}
          tabIndex={item.onClick ? 0 : undefined}
          style={{ borderColor: "var(--border)" }}
        >
          <header className="mb-3 min-h-11">
            <h3 className="font-semibold text-[var(--text)]">{item.title}</h3>
            {item.subtitle ? (
              <div className="mt-0.5 text-sm text-[var(--muted)]">{item.subtitle}</div>
            ) : null}
          </header>
          <div className="rounded-md border bg-[var(--pitch-bg)] p-2 [border-color:var(--border)]">
            <Pitch className={pitchClassName} orientation={item.orientation}>
              {item.children}
            </Pitch>
          </div>
        </article>
      ))}
    </div>
  );
}
