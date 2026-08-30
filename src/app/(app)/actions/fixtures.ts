"use server";

import { revalidatePath } from "next/cache";
import ical, { type VEvent } from "node-ical";

import { requireRole } from "@/lib/auth";
import { parseFixtureEvent } from "@/lib/fixtures";
import { createClient } from "@/lib/supabase/server";

export type SyncFixturesResult = {
  inserted: number;
  updated: number;
  total: number;
};

export async function syncFixtures(): Promise<SyncFixturesResult> {
  await requireRole(["importer", "admin"]);

  const calendarUrl = process.env.NCF_CALENDAR_ICS_URL;
  if (!calendarUrl) {
    throw new Error("NCF_CALENDAR_ICS_URL is not configured.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  let calendar;
  try {
    const response = await fetch(calendarUrl, {
      headers: { "User-Agent": "NCF-Soccer-Analytics/1.0" },
      signal: controller.signal,
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error(`Calendar request returned ${response.status}.`);
    }
    calendar = await ical.async.parseICS(await response.text());
  } catch (error) {
    throw new Error(
      `Unable to load the fixture calendar: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  } finally {
    clearTimeout(timeout);
  }

  const fixtures = Object.values(calendar)
    .filter((item): item is VEvent => item?.type === "VEVENT")
    .map((event) => parseFixtureEvent(event))
    .filter((fixture) => fixture !== null);

  if (!fixtures.length) {
    throw new Error("No NCF men's soccer fixtures were found in the calendar.");
  }

  const supabase = await createClient();
  const fixtureUids = fixtures.map((fixture) => fixture.google_calendar_uid);
  const { data: existingFixtures, error: lookupError } = await supabase
    .from("matches")
    .select("google_calendar_uid")
    .in("google_calendar_uid", fixtureUids);

  if (lookupError) {
    throw new Error(`Unable to check existing fixtures: ${lookupError.message}`);
  }

  const existingUids = new Set(
    (existingFixtures ?? []).map((fixture) => fixture.google_calendar_uid),
  );
  const updated = fixtures.filter((fixture) => existingUids.has(fixture.google_calendar_uid)).length;
  const inserted = fixtures.length - updated;

  const { error: upsertError } = await supabase.from("matches").upsert(fixtures, {
    onConflict: "google_calendar_uid",
  });

  if (upsertError) {
    throw new Error(`Unable to sync fixtures: ${upsertError.message}`);
  }

  revalidatePath("/");

  return { inserted, updated, total: fixtures.length };
}
