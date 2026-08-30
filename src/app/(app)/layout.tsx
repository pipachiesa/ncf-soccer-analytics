import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { PortalShell, type UpcomingMatch } from "@/components/shell/portal-shell";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

function todayInNewYork() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return {
    iso: `${value.year}-${value.month}-${value.day}`,
    label: new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      weekday: "short",
      month: "short",
      day: "numeric",
    }).format(new Date()),
  };
}

export default async function AppLayout({ children }: { children: ReactNode }) {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  const today = todayInNewYork();
  const supabase = await createClient();
  const { data: nextMatch } = await supabase
    .from("matches")
    .select("opponent, home_away, date")
    .eq("status", "upcoming")
    .gte("date", today.iso)
    .order("date", { ascending: true })
    .order("kickoff_time", { ascending: true, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  return (
    <PortalShell
      profile={profile}
      todayLabel={today.label}
      upcomingMatch={(nextMatch as UpcomingMatch | null) ?? null}
    >
      {children}
    </PortalShell>
  );
}
