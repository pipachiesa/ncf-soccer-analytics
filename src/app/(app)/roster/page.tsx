"use client";

import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { createClient } from "@/lib/supabase/client";

import { RosterManager, type RosterPlayer } from "./roster-manager";

export default function RosterPage() {
  const { profile } = useAuth();
  const canEdit = profile.role === "admin" || profile.role === "importer";
  const [roster, setRoster] = useState<RosterPlayer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadRoster = useCallback(async () => {
    const supabase = createClient();
    const [{ data: players, error: playersError }, { data: lineups, error: lineupsError }] = await Promise.all([
      supabase.from("players").select("player_id, first_name, last_name, position, shirt_number").order("shirt_number", { ascending: true, nullsFirst: false }),
      supabase.from("match_lineups").select("player_id, minutes_played"),
    ]);
    const minutesByPlayer = new Map<number, number>();
    for (const lineup of lineups ?? []) {
      if (lineup.player_id === null) continue;
      minutesByPlayer.set(lineup.player_id, (minutesByPlayer.get(lineup.player_id) ?? 0) + (Number(lineup.minutes_played) || 0));
    }
    setRoster((players ?? []).map((player) => ({ ...player, minutes_played: minutesByPlayer.get(player.player_id) ?? 0 })) as RosterPlayer[]);
    setError((playersError ?? lineupsError)?.message ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadRoster(), 0);
    return () => window.clearTimeout(timer);
  }, [loadRoster]);

  if (loading) return <div className="grid min-h-80 place-items-center text-sm font-semibold text-muted">Loading roster…</div>;

  return (
    <div className="mx-auto w-full max-w-[1500px] px-3 py-4 sm:px-5 lg:px-6">
      {error ? (
        <div className="mb-4 rounded-md border border-pass-fail bg-panel px-4 py-3 text-sm text-pass-fail">
          Unable to load the roster: {error}
        </div>
      ) : null}
      <RosterManager canEdit={canEdit} players={roster} onChanged={loadRoster} />
    </div>
  );
}
