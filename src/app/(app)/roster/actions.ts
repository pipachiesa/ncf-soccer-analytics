"use client";

import { createClient } from "@/lib/supabase/client";

export type PlayerActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

const POSITIONS = new Set([
  "GK", "RB", "CB", "LB", "RWB", "LWB", "CDM", "CM", "CAM",
  "RM", "LM", "RW", "LW", "CF", "ST",
]);

function errorState(message: string): PlayerActionState {
  return { status: "error", message };
}

function textField(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export async function savePlayer(
  _previousState: PlayerActionState,
  formData: FormData,
): Promise<PlayerActionState> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return errorState("Your session has expired.");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || !["importer", "admin"].includes(profile.role)) return errorState("Importer or admin access is required.");

  const rawId = textField(formData, "player_id");
  const firstName = textField(formData, "first_name");
  const lastName = textField(formData, "last_name");
  const position = textField(formData, "position");
  const rawShirtNumber = textField(formData, "shirt_number");
  const shirtNumber = Number(rawShirtNumber);
  const playerId = rawId ? Number(rawId) : null;

  if (!firstName || !lastName) return errorState("First and last name are required.");
  if (!POSITIONS.has(position)) return errorState("Choose a valid position.");
  if (!Number.isInteger(shirtNumber) || shirtNumber < 0 || shirtNumber > 999) {
    return errorState("Shirt number must be a whole number between 0 and 999.");
  }
  if (rawId && (!Number.isInteger(playerId) || Number(playerId) <= 0)) {
    return errorState("Invalid player record.");
  }

  let duplicateQuery = supabase
    .from("players")
    .select("player_id")
    .eq("shirt_number", shirtNumber);
  if (playerId) duplicateQuery = duplicateQuery.neq("player_id", playerId);
  const { data: duplicate, error: duplicateError } = await duplicateQuery.limit(1).maybeSingle();

  if (duplicateError) return errorState(duplicateError.message);
  if (duplicate) return errorState(`Shirt number ${shirtNumber} is already assigned.`);

  const values = {
    first_name: firstName,
    last_name: lastName,
    position,
    shirt_number: shirtNumber,
  };

  const { error } = playerId
    ? await supabase.from("players").update(values).eq("player_id", playerId)
    : await supabase.from("players").insert(values);

  if (error) return errorState(error.message);

  return {
    status: "success",
    message: playerId ? "Player updated." : "Player added.",
  };
}

export async function deletePlayer(
  _previousState: PlayerActionState,
  formData: FormData,
): Promise<PlayerActionState> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return errorState("Your session has expired.");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || !["importer", "admin"].includes(profile.role)) return errorState("Importer or admin access is required.");

  const playerId = Number(textField(formData, "player_id"));
  if (!Number.isInteger(playerId) || playerId <= 0) return errorState("Invalid player record.");

  const { error } = await supabase.from("players").delete().eq("player_id", playerId);

  if (error) {
    return errorState(
      error.code === "23503"
        ? "This player has match or event data and cannot be deleted."
        : error.message,
    );
  }

  return { status: "success", message: "Player deleted." };
}
