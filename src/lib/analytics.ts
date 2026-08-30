export type AnalyticsEvent = {
  id: number;
  match_id: number | null;
  player_id: number | null;
  event_type: string | null;
  outcome: string | null;
  start_x: number | null;
  start_y: number | null;
  end_x: number | null;
  end_y: number | null;
  recipient_player_id: number | null;
  minute: number | null;
  second: number | null;
  xg: number | null;
  progressive: boolean | null;
  zone_3x3: string | null;
  pitch_zone: string | null;
  body_part: string | null;
  period?: string | null;
  phase?: string | null;
  set_piece?: string | null;
  distance_m?: number | null;
  goal_x?: number | null;
  goal_y?: number | null;
  players?: {
    first_name: string | null;
    last_name: string | null;
    shirt_number: number | null;
    position: string | null;
  } | null;
  matches?: {
    opponent: string | null;
    date: string | null;
  } | null;
};

export type AnalyticsKpis = {
  totalShots: number;
  goals: number;
  shotsOnTarget: number;
  xgTotal: number;
  chancesCreated: number;
  crosses: number;
  crossesSuccessful: number;
  shotAccuracy: number;
  conversionRate: number;
  totalPasses: number;
  passesSuccessful: number;
  passAccuracy: number;
  progressivePasses: number;
  longPasses: number;
  longPassesSuccessful: number;
  longPassAccuracy: number;
  keyPasses: number;
  assists: number;
  totalRecoveries: number;
  controlledRecoveries: number;
  losses: number;
  dangerousLosses: number;
  recoveryLossRatio: number;
  defensiveDuels: number;
  defensiveDuelsWon: number;
  defensiveDuelSuccess: number;
  aerialDuels: number;
  aerialDuelsWon: number;
  aerialWinRate: number;
  tackles: number;
  tacklesWon: number;
  tackleSuccess: number;
  clearances: number;
  blocks: number;
  foulsCommitted: number;
  interceptions: number;
  duelsTotal: number;
  duelsWon: number;
  duelSuccessRate: number;
  totalEvents: number;
};

export type GoalkeeperStats = {
  saves: number;
  claims: number;
  punches: number;
  distributionSuccess: number;
  distributionTotal: number;
  distributionRate: number;
  passesSuccessful: number;
  passesTotal: number;
  gkActions: AnalyticsEvent[];
};

const PASS_TYPES = new Set([
  "Pass",
  "Long Pass",
  "Short Pass",
  "Through Pass",
  "Cross",
]);
const SUCCESSFUL_PASS_OUTCOMES = new Set([
  "Successful",
  "Assist",
  "Key Pass",
  "Progressive Pass",
]);
const SHOT_ON_TARGET_OUTCOMES = new Set(["Goal", "Saved", "On Target"]);

function percentage(part: number, total: number) {
  return total > 0 ? Math.round((part / total) * 1000) / 10 : 0;
}

export function calculateAnalyticsKpis(events: AnalyticsEvent[]): AnalyticsKpis {
  const shots = events.filter((event) => event.event_type === "Shot");
  const goals = shots.filter((event) => event.outcome === "Goal").length;
  const shotsOnTarget = shots.filter((event) =>
    SHOT_ON_TARGET_OUTCOMES.has(event.outcome ?? ""),
  ).length;
  const xgTotal = shots.reduce((sum, event) => sum + (Number(event.xg) || 0), 0);

  const passes = events.filter((event) => PASS_TYPES.has(event.event_type ?? ""));
  const passesSuccessful = passes.filter((event) =>
    SUCCESSFUL_PASS_OUTCOMES.has(event.outcome ?? ""),
  ).length;
  const progressivePasses = passes.filter(
    (event) => event.outcome === "Progressive Pass" || event.progressive === true,
  ).length;
  const longPasses = events.filter((event) => event.event_type === "Long Pass");
  const longPassesSuccessful = longPasses.filter((event) =>
    SUCCESSFUL_PASS_OUTCOMES.has(event.outcome ?? ""),
  ).length;

  const recoveries = events.filter((event) =>
    ["Recovery", "Interception"].includes(event.event_type ?? ""),
  );
  const controlledRecoveries = recoveries.filter((event) =>
    ["Successful", "Controlled"].includes(event.outcome ?? ""),
  ).length;
  const losses = events.filter(
    (event) =>
      ["Loss", "Ball Lost", "Loss/Ball Lost"].includes(event.event_type ?? "") ||
      ["Lost", "Unsuccessful"].includes(event.outcome ?? ""),
  );

  const defensiveDuels = events.filter((event) =>
    ["Defensive Duel", "Ground Duel"].includes(event.event_type ?? ""),
  );
  const defensiveDuelsWon = defensiveDuels.filter(
    (event) => event.outcome === "Won",
  ).length;
  const aerialDuels = events.filter((event) =>
    ["Aerial Duel", "Header"].includes(event.event_type ?? ""),
  );
  const aerialDuelsWon = aerialDuels.filter((event) => event.outcome === "Won").length;
  const tackles = events.filter((event) => event.event_type === "Tackle");
  const tacklesWon = tackles.filter((event) =>
    ["Won", "Successful"].includes(event.outcome ?? ""),
  ).length;
  const duels = events.filter((event) => event.event_type?.includes("Duel"));
  const duelsWon = duels.filter((event) => event.outcome === "Won").length;

  const keyPasses = events.filter((event) => event.outcome === "Key Pass").length;
  const assists = events.filter((event) => event.outcome === "Assist").length;
  const crosses = events.filter((event) => event.event_type === "Cross");
  const crossesSuccessful = crosses.filter((event) =>
    ["Successful", "Assist"].includes(event.outcome ?? ""),
  ).length;
  const dangerousLosses = losses.filter(
    (event) =>
      event.zone_3x3?.startsWith("R1") || event.pitch_zone === "Defensive Third",
  ).length;

  return {
    totalShots: shots.length,
    goals,
    shotsOnTarget,
    xgTotal,
    chancesCreated: keyPasses + assists,
    crosses: crosses.length,
    crossesSuccessful,
    shotAccuracy: percentage(shotsOnTarget, shots.length),
    conversionRate: percentage(goals, shots.length),
    totalPasses: passes.length,
    passesSuccessful,
    passAccuracy: percentage(passesSuccessful, passes.length),
    progressivePasses,
    longPasses: longPasses.length,
    longPassesSuccessful,
    longPassAccuracy: percentage(longPassesSuccessful, longPasses.length),
    keyPasses,
    assists,
    totalRecoveries: recoveries.length,
    controlledRecoveries,
    losses: losses.length,
    dangerousLosses,
    recoveryLossRatio:
      losses.length > 0
        ? Math.round((recoveries.length / losses.length) * 10) / 10
        : recoveries.length,
    defensiveDuels: defensiveDuels.length,
    defensiveDuelsWon,
    defensiveDuelSuccess: percentage(defensiveDuelsWon, defensiveDuels.length),
    aerialDuels: aerialDuels.length,
    aerialDuelsWon,
    aerialWinRate: percentage(aerialDuelsWon, aerialDuels.length),
    tackles: tackles.length,
    tacklesWon,
    tackleSuccess: percentage(tacklesWon, tackles.length),
    clearances: events.filter((event) => event.event_type === "Clearance").length,
    blocks: events.filter((event) => event.event_type === "Block").length,
    foulsCommitted: events.filter((event) => event.event_type === "Foul Committed")
      .length,
    interceptions: events.filter((event) => event.event_type === "Interception").length,
    duelsTotal: duels.length,
    duelsWon,
    duelSuccessRate: percentage(duelsWon, duels.length),
    totalEvents: events.length,
  };
}

export function per90(value: number, minutesPlayed: number) {
  return minutesPlayed > 0 ? (value * 90) / minutesPlayed : 0;
}

// Ported from the previous app's useGoalkeeperStats implementation. GK-specific
// distributions are combined with regular Pass/Long Pass events, matching the
// historic dashboard definition.
export function calculateGoalkeeperStats(events: AnalyticsEvent[]): GoalkeeperStats {
  const gkActions = events.filter((event) =>
    ["GK Action", "Goalkeeper"].includes(event.event_type ?? ""),
  );
  let saves = 0;
  let claims = 0;
  let punches = 0;
  let distributionSuccess = 0;
  let distributionUnsuccessful = 0;

  for (const event of gkActions) {
    const outcome = (event.outcome ?? "").toLowerCase();
    if (outcome.includes("save") || outcome === "saved") saves += 1;
    else if (["claim", "catch", "caught", "collected"].some((term) => outcome.includes(term))) claims += 1;
    else if (outcome.includes("punch")) punches += 1;
    else if (["distribution", "throw", "kick"].some((term) => outcome.includes(term))) {
      if (outcome.includes("unsuccess") || outcome.includes("inaccurate")) distributionUnsuccessful += 1;
      else if (outcome.includes("success") || outcome.includes("accurate")) distributionSuccess += 1;
    }
  }

  const passes = events.filter((event) =>
    ["Pass", "Long Pass"].includes(event.event_type ?? ""),
  );
  const passesSuccessful = passes.filter((event) =>
    ["Successful", "Assist", "Key Pass", "Progressive Pass"].includes(event.outcome ?? ""),
  ).length;
  const distributionTotal = distributionSuccess + distributionUnsuccessful + passes.length;
  const successfulDistribution = distributionSuccess + passesSuccessful;

  return {
    saves,
    claims,
    punches,
    distributionSuccess: successfulDistribution,
    distributionTotal,
    distributionRate: distributionTotal > 0
      ? Math.round((successfulDistribution / distributionTotal) * 100)
      : 0,
    passesSuccessful,
    passesTotal: passes.length,
    gkActions,
  };
}
