"use client";

import { useEffect, useState } from "react";

import {
  AnalyticsHub,
  type AnalyticsMatch,
  type AnalyticsPlayer,
} from "@/components/analytics/analytics-hub";
import { createClient } from "@/lib/supabase/client";

export default function AnalyticsPage() {
  const [matches, setMatches] = useState<AnalyticsMatch[]>([]);
  const [players, setPlayers] = useState<AnalyticsPlayer[]>([]);
  const [initialMatchId, setInitialMatchId] = useState<number | "all">("all");
  const [setupError, setSetupError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const [{ data: matchData, error: matchError }, { data: playerData, error: playerError }] = await Promise.all([
        supabase.from("matches").select("match_id, date, opponent, home_away, competition, score_for, score_against").eq("status", "played").order("date", { ascending: false }),
        supabase.from("players").select("player_id, first_name, last_name, shirt_number, position").order("shirt_number", { ascending: true, nullsFirst: false }).order("last_name", { ascending: true }),
      ]);
      const loadedMatches = (matchData ?? []) as AnalyticsMatch[];
      const requestedMatchId = Number(new URLSearchParams(window.location.search).get("match"));
      setMatches(loadedMatches);
      setPlayers((playerData ?? []) as AnalyticsPlayer[]);
      setInitialMatchId(loadedMatches.some((match) => match.match_id === requestedMatchId) ? requestedMatchId : "all");
      setSetupError(matchError?.message || playerError?.message || null);
      setLoading(false);
    }
    void load();
  }, []);

  if (loading) return <PageLoader label="Loading analytics" />;

  return (
    <AnalyticsHub
      initialMatchId={initialMatchId}
      matches={matches}
      players={players}
      setupError={setupError}
    />
  );
}

function PageLoader({ label }: { label: string }) {
  return <div className="grid min-h-80 place-items-center text-sm font-semibold text-muted">{label}…</div>;
}
