import type { VEvent } from "node-ical";

export type FixtureStatus = "upcoming" | "played" | "postponed" | "cancelled";

export type SyncedFixture = {
  google_calendar_uid: string;
  date: string;
  kickoff_time: string;
  opponent: string;
  home_away: "home" | "away";
  venue: string | null;
  status: FixtureStatus;
  score_for: number | null;
  score_against: number | null;
};

const TEAM_PREFIX = "New College of Florida Men's Soccer ";
const RESULT_TOKEN = /^\[([WLT])\]\s*/i;
const STATUS_TOKEN = /^(POSTPONED|CANCELLED|CANCELED|PPD)\s*/i;

function parameterText(value: VEvent["summary"] | VEvent["description"] | VEvent["location"]) {
  if (!value) return "";
  return typeof value === "string" ? value : value.val;
}

function dateTimeInNewYork(value: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(value);
  const part = Object.fromEntries(parts.map(({ type, value: item }) => [type, item]));

  return {
    date: `${part.year}-${part.month}-${part.day}`,
    time: `${part.hour}:${part.minute}:${part.second}`,
  };
}

export function parseFixtureEvent(event: VEvent, now = new Date()): SyncedFixture | null {
  const originalSummary = parameterText(event.summary).trim();
  const resultToken = originalSummary.match(RESULT_TOKEN)?.[1]?.toUpperCase() ?? null;
  const statusToken = originalSummary.match(STATUS_TOKEN)?.[1]?.toUpperCase() ?? null;
  const summary = originalSummary
    .replace(RESULT_TOKEN, "")
    .replace(STATUS_TOKEN, "")
    .trim();

  if (!summary.startsWith(TEAM_PREFIX)) return null;

  const matchup = summary.slice(TEAM_PREFIX.length).match(/^(at|vs)\s+(.+)$/i);
  if (!matchup) return null;

  const start = new Date(event.start);
  if (Number.isNaN(start.getTime())) return null;

  const local = dateTimeInNewYork(start);
  const description = parameterText(event.description);
  const score = description.match(/(?:^|\n)\s*[WLT]\s*,?\s*(\d+)\s*-\s*(\d+)/i);

  let status: FixtureStatus;
  if (statusToken === "POSTPONED" || statusToken === "PPD") {
    status = "postponed";
  } else if (statusToken === "CANCELLED" || statusToken === "CANCELED") {
    status = "cancelled";
  } else if (resultToken || start.getTime() < now.getTime()) {
    status = "played";
  } else {
    status = "upcoming";
  }

  return {
    google_calendar_uid: event.uid,
    date: local.date,
    kickoff_time: local.time,
    opponent: matchup[2].trim(),
    home_away: matchup[1].toLowerCase() === "at" ? "away" : "home",
    venue: parameterText(event.location).replace(/\\,/g, ",").trim() || null,
    status,
    score_for: score ? Number(score[1]) : null,
    score_against: score ? Number(score[2]) : null,
  };
}
