"use client";

import { useEffect, useMemo, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { AnalyticsEvent } from "@/lib/analytics";
import { createClient } from "@/lib/supabase/client";

export type AnalyticsScope = {
  matchId: "all" | number;
  playerId?: number;
};

type EventQueryOptions = {
  eventType?: string;
  eventTypes?: string[];
  outcomes?: string[];
  requireCoordinates?: boolean;
  requireRecipient?: boolean;
};

const PAGE_SIZE = 1000;

export async function fetchEventsForScope(
  supabase: SupabaseClient,
  { matchId, playerId }: AnalyticsScope,
  {
    eventType,
    eventTypes,
    outcomes,
    requireCoordinates = false,
    requireRecipient = false,
  }: EventQueryOptions = {},
) {
  const events: AnalyticsEvent[] = [];
  let from = 0;

  while (true) {
    let query = supabase
      .from("events")
      .select(
        "*, players:players!events_player_id_fkey(first_name, last_name, shirt_number, position), matches:matches!events_match_id_fkey(opponent, date)",
      )
      .order("id", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (matchId !== "all") query = query.eq("match_id", matchId);
    if (playerId !== undefined) query = query.eq("player_id", playerId);
    if (eventType) query = query.eq("event_type", eventType);
    if (eventTypes?.length) query = query.in("event_type", eventTypes);
    if (outcomes?.length) query = query.in("outcome", outcomes);
    if (requireRecipient) query = query.not("recipient_player_id", "is", null);
    if (requireCoordinates) {
      query = query
        .not("start_x", "is", null)
        .not("start_y", "is", null)
        .not("end_x", "is", null)
        .not("end_y", "is", null);
    }

    const { data, error } = await query;
    if (error) throw error;

    const page = (data ?? []) as unknown as AnalyticsEvent[];
    events.push(...page);

    if (page.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return events;
}

export async function fetchMinutesForScope(
  supabase: SupabaseClient,
  { matchId, playerId }: AnalyticsScope,
) {
  let minutes = 0;
  let from = 0;

  while (true) {
    let query = supabase
      .from("match_lineups")
      .select("minutes_played")
      .range(from, from + PAGE_SIZE - 1);

    if (matchId !== "all") query = query.eq("match_id", matchId);
    if (playerId !== undefined) query = query.eq("player_id", playerId);

    const { data, error } = await query;
    if (error) throw error;

    const page = data ?? [];
    minutes += page.reduce(
      (sum, lineup) => sum + (Number(lineup.minutes_played) || 0),
      0,
    );

    if (page.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return minutes;
}

export function useAnalyticsData(scope: AnalyticsScope) {
  const supabase = useMemo(() => createClient(), []);
  const { matchId, playerId } = scope;
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [minutesPlayed, setMinutesPlayed] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const [nextEvents, nextMinutes] = await Promise.all([
          fetchEventsForScope(supabase, { matchId, playerId }),
          fetchMinutesForScope(supabase, { matchId, playerId }),
        ]);

        if (!active) return;
        setEvents(nextEvents);
        setMinutesPlayed(nextMinutes);
      } catch (loadError) {
        if (!active) return;
        setEvents([]);
        setMinutesPlayed(0);
        setError(loadError instanceof Error ? loadError.message : "Analytics data could not be loaded.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [matchId, playerId, supabase]);

  return { events, minutesPlayed, loading, error };
}

export function useShotEvents(scope: AnalyticsScope) {
  const supabase = useMemo(() => createClient(), []);
  const { matchId, playerId } = scope;
  const [shots, setShots] = useState<AnalyticsEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const nextShots = await fetchEventsForScope(
          supabase,
          { matchId, playerId },
          { eventType: "Shot" },
        );

        if (active) setShots(nextShots);
      } catch (loadError) {
        if (!active) return;
        setShots([]);
        setError(loadError instanceof Error ? loadError.message : "Shots could not be loaded.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [matchId, playerId, supabase]);

  return { shots, loading, error };
}

const PASS_EVENT_TYPES = [
  "Pass",
  "Long Pass",
  "Short Pass",
  "Through Pass",
  "Cross",
];

export function usePassEvents(scope: AnalyticsScope) {
  const supabase = useMemo(() => createClient(), []);
  const { matchId, playerId } = scope;
  const [passes, setPasses] = useState<AnalyticsEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const nextPasses = await fetchEventsForScope(
          supabase,
          { matchId, playerId },
          { eventTypes: PASS_EVENT_TYPES, requireCoordinates: true },
        );

        if (active) setPasses(nextPasses);
      } catch (loadError) {
        if (!active) return;
        setPasses([]);
        setError(loadError instanceof Error ? loadError.message : "Passes could not be loaded.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [matchId, playerId, supabase]);

  return { passes, loading, error };
}

export type MatchLineupEntry = {
  player_id: number | null;
  is_starter: boolean | null;
};

const COMPLETED_PASS_OUTCOMES = [
  "Successful",
  "Assist",
  "Key Pass",
  "Progressive",
  "Progressive Pass",
];

async function fetchLineupsForMatch(supabase: SupabaseClient, matchId: number) {
  const lineups: MatchLineupEntry[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("match_lineups")
      .select("player_id, is_starter")
      .eq("match_id", matchId)
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw error;
    const page = (data ?? []) as MatchLineupEntry[];
    lineups.push(...page);

    if (page.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return lineups;
}

export function usePassingNetworkData(matchId: "all" | number) {
  const supabase = useMemo(() => createClient(), []);
  const [passes, setPasses] = useState<AnalyticsEvent[]>([]);
  const [lineups, setLineups] = useState<MatchLineupEntry[]>([]);
  const [loading, setLoading] = useState(matchId !== "all");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const selectedMatchId = matchId;

    if (selectedMatchId === "all") {
      return () => {
        active = false;
      };
    }
    const matchIdForQuery: number = selectedMatchId;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const [nextPasses, nextLineups] = await Promise.all([
          fetchEventsForScope(
            supabase,
            { matchId: matchIdForQuery },
            {
              eventTypes: PASS_EVENT_TYPES,
              outcomes: COMPLETED_PASS_OUTCOMES,
              requireCoordinates: true,
              requireRecipient: true,
            },
          ),
          fetchLineupsForMatch(supabase, matchIdForQuery),
        ]);

        if (!active) return;
        setPasses(nextPasses);
        setLineups(nextLineups);
      } catch (loadError) {
        if (!active) return;
        setPasses([]);
        setLineups([]);
        setError(loadError instanceof Error ? loadError.message : "Passing network could not be loaded.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [matchId, supabase]);

  return matchId === "all"
    ? { passes: [], lineups: [], loading: false, error: null }
    : { passes, lineups, loading, error };
}
