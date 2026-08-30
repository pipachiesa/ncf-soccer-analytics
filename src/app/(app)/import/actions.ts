"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth";
import {
  EVENT_CSV_COLUMNS,
  type EventCsvRow,
  validateEventCsv,
} from "@/lib/event-import";
import { createClient } from "@/lib/supabase/server";

export type ImportResult =
  | {
      status: "success";
      match: "created" | "updated";
      playersUpserted: number;
      eventsInserted: number;
    }
  | { status: "error"; message: string };

type PlayerInput = {
  first_name: string;
  last_name: string;
  shirt_number: number;
  position: string | null;
};

function nullable(value: string) {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function importError(context: string, message: string): ImportResult {
  return { status: "error", message: `${context}: ${message}` };
}

export async function importEventRows(
  rows: EventCsvRow[],
): Promise<ImportResult> {
  await requireRole(["importer", "admin"]);

  if (!Array.isArray(rows) || rows.length === 0) {
    return { status: "error", message: "The CSV contains no data rows." };
  }

  const headers = Object.keys(rows[0]);
  const validation = validateEventCsv(headers, rows);

  if (
    validation.missingColumns.length ||
    validation.unexpectedColumns.length ||
    validation.rowWarnings.length
  ) {
    return {
      status: "error",
      message: "The CSV failed server-side validation. Fix the reported issues and try again.",
    };
  }

  if (headers.length !== EVENT_CSV_COLUMNS.length) {
    return { status: "error", message: "The CSV headers do not match the template." };
  }

  const supabase = await createClient();
  const fixture = rows[0];

  const { data: existingMatch, error: matchLookupError } = await supabase
    .from("matches")
    .select("match_id")
    .eq("date", fixture.match_date.trim())
    .eq("opponent", fixture.opponent.trim())
    .order("match_id", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (matchLookupError) {
    return importError("Unable to find the match", matchLookupError.message);
  }

  let matchId: number;
  let matchResult: "created" | "updated";
  const matchValues = {
    date: fixture.match_date.trim(),
    opponent: fixture.opponent.trim(),
    home_away: fixture.home_away.trim(),
    competition: nullable(fixture.competition),
    status: "played",
  };

  if (existingMatch) {
    const { data, error } = await supabase
      .from("matches")
      .update(matchValues)
      .eq("match_id", existingMatch.match_id)
      .select("match_id")
      .single();

    if (error) return importError("Unable to update the match", error.message);
    matchId = data.match_id;
    matchResult = "updated";
  } else {
    const { data, error } = await supabase
      .from("matches")
      .insert(matchValues)
      .select("match_id")
      .single();

    if (error) return importError("Unable to create the match", error.message);
    matchId = data.match_id;
    matchResult = "created";
  }

  const playersByShirt = new Map<number, PlayerInput>();
  rows.forEach((row) => {
    const shirtNumber = Number(row.shirt_number);
    if (!playersByShirt.has(shirtNumber)) {
      playersByShirt.set(shirtNumber, {
        first_name: row.player_first_name.trim(),
        last_name: row.player_last_name.trim(),
        shirt_number: shirtNumber,
        position: nullable(row.position),
      });
    }
  });

  const shirtNumbers = [...playersByShirt.keys()];
  const { data: existingPlayers, error: playerLookupError } = await supabase
    .from("players")
    .select("player_id, shirt_number")
    .in("shirt_number", shirtNumbers);

  if (playerLookupError) {
    return importError("Unable to find players", playerLookupError.message);
  }

  const existingByShirt = new Map(
    (existingPlayers ?? []).map((player) => [player.shirt_number, player.player_id]),
  );
  const playerIdsByShirt = new Map<number, number>();

  for (const [shirtNumber, player] of playersByShirt) {
    const existingPlayerId = existingByShirt.get(shirtNumber);

    if (existingPlayerId) {
      const { data, error } = await supabase
        .from("players")
        .update(player)
        .eq("player_id", existingPlayerId)
        .select("player_id")
        .single();

      if (error) {
        return importError(`Unable to update player #${shirtNumber}`, error.message);
      }
      playerIdsByShirt.set(shirtNumber, data.player_id);
    } else {
      const { data, error } = await supabase
        .from("players")
        .insert(player)
        .select("player_id")
        .single();

      if (error) {
        return importError(`Unable to create player #${shirtNumber}`, error.message);
      }
      playerIdsByShirt.set(shirtNumber, data.player_id);
    }
  }

  const eventValues = rows.map((row) => {
    const recipientShirtNumber = nullable(row.recipient_shirt_number);

    return {
      match_id: matchId,
      player_id: playerIdsByShirt.get(Number(row.shirt_number))!,
      event_type: row.event_type.trim(),
      outcome: nullable(row.outcome),
      start_x: Number(row.start_x),
      start_y: Number(row.start_y),
      end_x: nullable(row.end_x) === null ? null : Number(row.end_x),
      end_y: nullable(row.end_y) === null ? null : Number(row.end_y),
      recipient_player_id: recipientShirtNumber
        ? playerIdsByShirt.get(Number(recipientShirtNumber))!
        : null,
      minute: Number(row.minute),
      second: Number(row.second),
      xg: nullable(row.xg) === null ? null : Number(row.xg),
      progressive: row.progressive.trim() === "true",
      zone_3x3: nullable(row.zone_3x3),
      pitch_zone: nullable(row.pitch_zone),
      body_part: nullable(row.body_part),
    };
  });

  const { data: insertedEvents, error: eventInsertError } = await supabase
    .from("events")
    .insert(eventValues)
    .select("id");

  if (eventInsertError) {
    return importError("Unable to insert events", eventInsertError.message);
  }

  revalidatePath("/");

  return {
    status: "success",
    match: matchResult,
    playersUpserted: playersByShirt.size,
    eventsInserted: insertedEvents.length,
  };
}
