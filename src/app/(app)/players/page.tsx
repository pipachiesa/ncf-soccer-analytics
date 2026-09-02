"use client";

import { useCallback, useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";

import {
  PlayerHub,
  type PlayerHubMatch,
  type PlayerHubPlayer,
} from "./player-hub";

export default function PlayersPage() {
  const [players, setPlayers] = useState<PlayerHubPlayer[]>([]);
  const [matches, setMatches] = useState<PlayerHubMatch[]>([]);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
      const supabase = createClient();
      const [{ data: playerData, error: playersError }, { data: matchData, error: matchesError }] = await Promise.all([
        supabase.from("players").select("player_id, first_name, last_name, shirt_number, position, image_url").order("shirt_number", { ascending: true, nullsFirst: false }),
        supabase.from("matches").select("match_id, date, opponent, home_away").eq("status", "played").order("date", { ascending: false }),
      ]);
      setPlayers((playerData ?? []) as PlayerHubPlayer[]);
      setMatches((matchData ?? []) as PlayerHubMatch[]);
      const error = playersError ?? matchesError;
      setSetupError(error ? `Player Hub could not load: ${error.message}` : null);
      setLoading(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  if (loading) return <div className="grid min-h-80 place-items-center text-sm font-semibold text-muted">Loading players…</div>;

  return (
    <div className="mx-auto w-full max-w-[1500px] px-3 py-4 sm:px-5 lg:px-6">
      <PlayerHub
        matches={matches}
        onPlayersChanged={load}
        players={players}
        setupError={setupError}
      />
    </div>
  );
}
