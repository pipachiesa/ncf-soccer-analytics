import { createClient } from "@/lib/supabase/server";

import {
  PlayerHub,
  type PlayerHubMatch,
  type PlayerHubPlayer,
} from "./player-hub";

export default async function PlayersPage() {
  const supabase = await createClient();
  const [{ data: players, error: playersError }, { data: matches, error: matchesError }] = await Promise.all([
    supabase
      .from("players")
      .select("player_id, first_name, last_name, shirt_number, position")
      .order("shirt_number", { ascending: true, nullsFirst: false }),
    supabase
      .from("matches")
      .select("match_id, date, opponent, home_away")
      .eq("status", "played")
      .order("date", { ascending: false }),
  ]);
  const error = playersError ?? matchesError;

  return (
    <div className="mx-auto w-full max-w-[1500px] px-3 py-4 sm:px-5 lg:px-6">
      <PlayerHub
        matches={(matches ?? []) as PlayerHubMatch[]}
        players={(players ?? []) as PlayerHubPlayer[]}
        setupError={error ? `Player Hub could not load: ${error.message}` : null}
      />
    </div>
  );
}
