"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type CalendarFixture = {
  match_id: number;
  date: string;
  opponent: string;
  status: string;
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarWidget({
  fixtures,
  initialDate,
}: {
  fixtures: CalendarFixture[];
  initialDate: string;
}) {
  const [month, setMonth] = useState(() => {
    const [year, monthNumber] = initialDate.split("-").map(Number);
    return new Date(year, monthNumber - 1, 1, 12);
  });

  const fixturesByDate = useMemo(() => {
    const grouped = new Map<string, CalendarFixture[]>();
    fixtures.forEach((fixture) => {
      grouped.set(fixture.date, [...(grouped.get(fixture.date) ?? []), fixture]);
    });
    return grouped;
  }, [fixtures]);

  const year = month.getFullYear();
  const monthNumber = month.getMonth();
  const leadingDays = new Date(year, monthNumber, 1, 12).getDay();
  const daysInMonth = new Date(year, monthNumber + 1, 0, 12).getDate();
  const cells = Array.from({ length: 42 }, (_, index) => {
    const day = index - leadingDays + 1;
    return day > 0 && day <= daysInMonth ? day : null;
  });

  function shiftMonth(amount: number) {
    setMonth(new Date(year, monthNumber + amount, 1, 12));
  }

  return (
    <section className="overflow-hidden rounded-md border border-border bg-panel">
      <div className="flex items-center justify-between border-b border-border bg-elevated px-4 py-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent">
            Calendar
          </p>
          <h2 className="mt-0.5 text-sm font-semibold text-foreground">
            {new Intl.DateTimeFormat("en-US", {
              month: "long",
              year: "numeric",
            }).format(month)}
          </h2>
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            aria-label="Previous month"
            className="grid size-8 place-items-center rounded border border-border bg-panel text-muted transition-colors hover:border-accent hover:text-accent"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            aria-label="Next month"
            className="grid size-8 place-items-center rounded border border-border bg-panel text-muted transition-colors hover:border-accent hover:text-accent"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-border bg-elevated/60">
        {WEEKDAYS.map((weekday) => (
          <div
            key={weekday}
            className="px-1 py-2 text-center text-[10px] font-semibold uppercase tracking-wide text-muted"
          >
            {weekday}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {cells.map((day, index) => {
          if (!day) {
            return <div key={`empty-${index}`} className="min-h-20 border-r border-b border-border bg-background/35" />;
          }

          const dateKey = `${year}-${String(monthNumber + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const dayFixtures = fixturesByDate.get(dateKey) ?? [];

          return (
            <div
              key={dateKey}
              className="min-h-20 border-r border-b border-border bg-panel p-1.5"
            >
              <span className="text-[11px] font-semibold text-muted">{day}</span>
              <div className="mt-1 space-y-1">
                {dayFixtures.map((fixture) => (
                  <div
                    key={fixture.match_id}
                    title={fixture.opponent}
                    className="rounded-sm border-l-2 border-accent bg-elevated px-1.5 py-1"
                  >
                    <p className="truncate text-[9px] font-semibold leading-tight text-foreground">
                      {fixture.opponent}
                    </p>
                    <span
                      className={`mt-1 block size-1.5 rounded-full ${
                        fixture.status === "played" ? "bg-pass-ok" : "bg-accent"
                      }`}
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
