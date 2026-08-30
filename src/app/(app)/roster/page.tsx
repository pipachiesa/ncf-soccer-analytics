import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

import { RosterManager, type RosterPlayer } from "./roster-manager";

export default async function RosterPage() {
  const profile = await getCurrentProfile();
  const canEdit = profile?.role === "admin" || profile?.role === "importer";
  const supabase = await createClient();
  const [{ data: players, error: playersError }, { data: lineups, error: lineupsError }] = await Promise.all([
    supabase
      .from("players")
      .select("player_id, first_name, last_name, position, shirt_number")
      .order("shirt_number", { ascending: true, nullsFirst: false }),
    supabase.from("match_lineups").select("player_id, minutes_played"),
  ]);

  const minutesByPlayer = new Map<number, number>();
  for (const lineup of lineups ?? []) {
    if (lineup.player_id === null) continue;
    minutesByPlayer.set(
      lineup.player_id,
      (minutesByPlayer.get(lineup.player_id) ?? 0) + (Number(lineup.minutes_played) || 0),
    );
  }

  const roster = (players ?? []).map((player) => ({
    ...player,
    minutes_played: minutesByPlayer.get(player.player_id) ?? 0,
  })) as RosterPlayer[];
  const error = playersError ?? lineupsError;

  return (
    <div className="mx-auto w-full max-w-[1500px] px-3 py-4 sm:px-5 lg:px-6">
      {error ? (
        <div className="mb-4 rounded-md border border-pass-fail bg-panel px-4 py-3 text-sm text-pass-fail">
          Unable to load the roster: {error.message}
        </div>
      ) : null}
      <RosterManager canEdit={canEdit} players={roster} />
    </div>
  );
}
