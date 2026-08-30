export const EVENT_CSV_COLUMNS = [
  "match_date",
  "opponent",
  "home_away",
  "competition",
  "player_first_name",
  "player_last_name",
  "shirt_number",
  "position",
  "event_type",
  "outcome",
  "minute",
  "second",
  "start_x",
  "start_y",
  "end_x",
  "end_y",
  "recipient_shirt_number",
  "xg",
  "progressive",
  "body_part",
  "zone_3x3",
  "pitch_zone",
] as const;

export const VALID_EVENT_TYPES = [
  "Pass",
  "Long Pass",
  "Short Pass",
  "Through Pass",
  "Cross",
  "Shot",
  "Tackle",
  "Interception",
  "Recovery",
  "Aerial Duel",
  "Defensive Duel",
  "Offensive Duel",
  "Ground Duel",
  "Clearance",
  "Block",
  "Foul Committed",
  "Loss/Ball Lost",
  "GK Action",
  "Carry",
  "Dribble",
] as const;

export type EventCsvColumn = (typeof EVENT_CSV_COLUMNS)[number];
export type EventCsvRow = Record<EventCsvColumn, string>;

export type RowWarning = {
  row: number;
  messages: string[];
};

export type CsvValidation = {
  missingColumns: string[];
  unexpectedColumns: string[];
  rowWarnings: RowWarning[];
};

const VALID_EVENT_TYPE_SET = new Set<string>(VALID_EVENT_TYPES);
const PASS_EVENT_TYPES = new Set([
  "Pass",
  "Long Pass",
  "Short Pass",
  "Through Pass",
  "Cross",
]);
const START_COORDINATE_COLUMNS: EventCsvColumn[] = ["start_x", "start_y"];
const END_COORDINATE_COLUMNS: EventCsvColumn[] = ["end_x", "end_y"];
const DIRECTIONAL_EVENT_TYPES = new Set([
  ...PASS_EVENT_TYPES,
  "Carry",
  "Dribble",
  "Clearance",
]);

function isFiniteNumber(value: string) {
  return value.trim() !== "" && Number.isFinite(Number(value));
}

function isInteger(value: string) {
  return /^\d+$/.test(value.trim());
}

export function validateEventCsv(
  headers: string[],
  rows: EventCsvRow[],
): CsvValidation {
  const expectedHeaders = new Set<string>(EVENT_CSV_COLUMNS);
  const actualHeaders = new Set(headers);
  const missingColumns = EVENT_CSV_COLUMNS.filter(
    (column) => !actualHeaders.has(column),
  );
  const unexpectedColumns = headers.filter(
    (column) => !expectedHeaders.has(column),
  );

  const firstRow = rows[0];
  const playerShirtNumbers = new Set(
    rows.map((row) => row.shirt_number?.trim()).filter(Boolean),
  );

  const rowWarnings = rows.flatMap<RowWarning>((row, index) => {
    const messages: string[] = [];

    if (!/^\d{4}-\d{2}-\d{2}$/.test(row.match_date?.trim() ?? "")) {
      messages.push("match_date must use YYYY-MM-DD");
    }

    if (!row.opponent?.trim()) messages.push("opponent is required");
    if (!row.player_first_name?.trim()) {
      messages.push("player_first_name is required");
    }
    if (!row.player_last_name?.trim()) {
      messages.push("player_last_name is required");
    }

    if (!['home', 'away'].includes(row.home_away?.trim())) {
      messages.push("home_away must be home or away");
    }

    if (!VALID_EVENT_TYPE_SET.has(row.event_type?.trim())) {
      messages.push(`invalid event_type: ${row.event_type || "blank"}`);
    }

    if (!isInteger(row.shirt_number ?? "")) {
      messages.push("shirt_number must be a non-negative integer");
    }
    if (!isInteger(row.minute ?? "")) {
      messages.push("minute must be a non-negative integer");
    }
    if (!isInteger(row.second ?? "")) {
      messages.push("second must be a non-negative integer");
    }

    START_COORDINATE_COLUMNS.forEach((column) => {
      const value = row[column] ?? "";
      if (!isFiniteNumber(value) || Number(value) < 0 || Number(value) > 100) {
        messages.push(`${column} must be numeric and between 0 and 100`);
      }
    });

    END_COORDINATE_COLUMNS.forEach((column) => {
      const value = row[column]?.trim() ?? "";
      const requiresDestination = DIRECTIONAL_EVENT_TYPES.has(
        row.event_type?.trim(),
      );

      if (!value && !requiresDestination) return;

      if (!isFiniteNumber(value) || Number(value) < 0 || Number(value) > 100) {
        messages.push(`${column} must be numeric and between 0 and 100`);
      }
    });

    const xg = row.xg?.trim() ?? "";
    if (xg && !isFiniteNumber(xg)) {
      messages.push("xg must be numeric when provided");
    }

    if (!["true", "false"].includes(row.progressive?.trim())) {
      messages.push("progressive must be true or false");
    }

    const recipient = row.recipient_shirt_number?.trim() ?? "";
    if (recipient && !isInteger(recipient)) {
      messages.push("recipient_shirt_number must be an integer when provided");
    } else if (recipient && !playerShirtNumbers.has(recipient)) {
      messages.push(
        "recipient_shirt_number must match a player represented in this CSV",
      );
    } else if (recipient && !PASS_EVENT_TYPES.has(row.event_type?.trim())) {
      messages.push("recipient_shirt_number is only valid for pass events");
    }

    if (
      firstRow &&
      (row.match_date?.trim() !== firstRow.match_date?.trim() ||
        row.opponent?.trim() !== firstRow.opponent?.trim() ||
        row.home_away?.trim() !== firstRow.home_away?.trim() ||
        row.competition?.trim() !== firstRow.competition?.trim())
    ) {
      messages.push("all rows must belong to the same match");
    }

    return messages.length ? [{ row: index + 2, messages }] : [];
  });

  return { missingColumns, unexpectedColumns, rowWarnings };
}
