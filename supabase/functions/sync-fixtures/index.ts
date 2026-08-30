import { createClient } from "npm:@supabase/supabase-js@2";

const CALENDAR_URL = "https://gomightybanyans.com/calendar.ashx/calendar.ics?sport_id=4&_=cmtf0pg0300013b9zygtwb0hn";
const TEAM_PREFIX = "New College of Florida Men's Soccer ";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type RawEvent = Record<string, string>;

function parseCalendar(source: string) {
  const unfolded = source.replace(/\r?\n[ \t]/g, "");
  return [...unfolded.matchAll(/BEGIN:VEVENT\r?\n([\s\S]*?)\r?\nEND:VEVENT/g)].map((match) => {
    const event: RawEvent = {};
    for (const line of match[1].split(/\r?\n/)) {
      const separator = line.indexOf(":");
      if (separator < 0) continue;
      const key = line.slice(0, separator).split(";")[0];
      event[key] = line.slice(separator + 1);
    }
    return event;
  });
}

function parseUtcDate(value: string) {
  const match = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);
  if (!match) return null;
  return new Date(`${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:${match[6]}Z`);
}

function newYorkDateTime(value: Date) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(value).map(({ type, value: part }) => [type, part]));
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    kickoff_time: `${parts.hour}:${parts.minute}:${parts.second}`,
  };
}

function fixtureFromEvent(event: RawEvent) {
  const originalSummary = (event.SUMMARY ?? "").trim();
  const result = originalSummary.match(/^\[([WLT])\]\s*/i)?.[1]?.toUpperCase() ?? null;
  const statusToken = originalSummary.match(/^(POSTPONED|CANCELLED|CANCELED|PPD)\s*/i)?.[1]?.toUpperCase() ?? null;
  const summary = originalSummary
    .replace(/^\[([WLT])\]\s*/i, "")
    .replace(/^(POSTPONED|CANCELLED|CANCELED|PPD)\s*/i, "")
    .trim();
  if (!summary.startsWith(TEAM_PREFIX)) return null;
  const matchup = summary.slice(TEAM_PREFIX.length).match(/^(at|vs)\s+(.+)$/i);
  const start = parseUtcDate(event.DTSTART ?? "");
  if (!matchup || !start || !event.UID) return null;

  const description = (event.DESCRIPTION ?? "").replace(/\\n/g, "\n");
  const score = description.match(/(?:^|\n)\s*[WLT]\s*,?\s*(\d+)\s*-\s*(\d+)/i);
  const local = newYorkDateTime(start);
  const status = statusToken === "POSTPONED" || statusToken === "PPD"
    ? "postponed"
    : statusToken === "CANCELLED" || statusToken === "CANCELED"
      ? "cancelled"
      : result || start.getTime() < Date.now()
        ? "played"
        : "upcoming";

  return {
    google_calendar_uid: event.UID,
    date: local.date,
    kickoff_time: local.kickoff_time,
    opponent: matchup[2].trim(),
    home_away: matchup[1].toLowerCase() === "at" ? "away" : "home",
    venue: (event.LOCATION ?? "").replace(/\\,/g, ",").trim() || null,
    status,
    score_for: score ? Number(score[1]) : null,
    score_against: score ? Number(score[2]) : null,
  };
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const authorization = request.headers.get("Authorization");
    if (!authorization) throw new Error("Authentication is required.");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authorization } } },
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Your session has expired.");
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (!profile || !["admin", "importer"].includes(profile.role)) throw new Error("Importer or admin access is required.");

    const response = await fetch(CALENDAR_URL, { headers: { "User-Agent": "NCF-Soccer-Analytics/1.0" } });
    if (!response.ok) throw new Error(`Calendar request returned ${response.status}.`);
    const fixtures = parseCalendar(await response.text()).map(fixtureFromEvent).filter(Boolean);
    if (!fixtures.length) throw new Error("No NCF fixtures were found in the calendar.");

    const uids = fixtures.map((fixture) => fixture!.google_calendar_uid);
    const { data: existing, error: lookupError } = await supabase.from("matches").select("google_calendar_uid").in("google_calendar_uid", uids);
    if (lookupError) throw lookupError;
    const existingUids = new Set((existing ?? []).map((row) => row.google_calendar_uid));
    const updated = fixtures.filter((fixture) => existingUids.has(fixture!.google_calendar_uid)).length;
    const { error: upsertError } = await supabase.from("matches").upsert(fixtures, { onConflict: "google_calendar_uid" });
    if (upsertError) throw upsertError;

    return Response.json({ inserted: fixtures.length - updated, updated, total: fixtures.length }, { headers: corsHeaders });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Fixture sync failed." }, { status: 400, headers: corsHeaders });
  }
});
