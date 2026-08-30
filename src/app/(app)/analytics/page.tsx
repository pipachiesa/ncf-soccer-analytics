import {
  AnalyticsHub,
  type AnalyticsMatch,
  type AnalyticsPlayer,
} from "@/components/analytics/analytics-hub";
import { createClient } from "@/lib/supabase/server";

type AnalyticsPageProps = {
  searchParams: Promise<{ match?: string }>;
};

export default async function AnalyticsPage({ searchParams }: AnalyticsPageProps) {
  const supabase = await createClient();
  const [{ data: matchData, error: matchError }, { data: playerData, error: playerError }] =
    await Promise.all([
      supabase
        .from("matches")
        .select("match_id, date, opponent, home_away, competition, score_for, score_against")
        .eq("status", "played")
        .order("date", { ascending: false }),
      supabase
        .from("players")
        .select("player_id, first_name, last_name, shirt_number, position")
        .order("shirt_number", { ascending: true, nullsFirst: false })
        .order("last_name", { ascending: true }),
    ]);

  const matches = (matchData ?? []) as AnalyticsMatch[];
  const players = (playerData ?? []) as AnalyticsPlayer[];
  const requestedMatchId = Number((await searchParams).match);
  const initialMatchId = matches.some((match) => match.match_id === requestedMatchId)
    ? requestedMatchId
    : "all";
  const setupError = matchError?.message || playerError?.message || null;

  return (
    <AnalyticsHub
      initialMatchId={initialMatchId}
      matches={matches}
      players={players}
      setupError={setupError}
    />
  );
}
