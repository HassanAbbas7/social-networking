/**
 * roleUtils.js — single source of truth for role assignment.
 *
 * This version uses ONLY rows from public.attendee_stats.
 *
 * Expected attendee_stats columns:
 *   user_id
 *   total_connections
 *   sectors_reached
 *   cross_sector_count
 *   cross_sector_ratio
 *
 * Optional display columns, recommended if Leaderboard should show names:
 *   name
 *   full_name
 *   first_name
 *   last_name
 *   email
 *   company
 *   organization
 *   organisation
 *   company_name
 *   sector
 */

const MAX_PER_COMPETITIVE_ROLE = 3;

/**
 * normalizeAttendeeStat
 *
 * Converts one attendee_stats row into the stat shape used by assignRoles
 * and Leaderboard.
 */
export function normalizeAttendeeStat(row = {}) {
  const id = row.user_id || row.id;

  return {
    id,
    user_id: id,

    /**
     * Keep the raw row available so UI helpers can read optional display
     * fields such as name, company, email, sector, etc.
     */
    attendee: row,
    raw: row,

    connectionsFirstHour: Number(row.connections_first_hour ?? 0),
    connectionCount: Number(row.total_connections ?? 0),
    crossSectorCount: Number(row.cross_sector_count ?? 0),
    sectorsReachedCount: Number(row.sectors_reached ?? 0),
    crossSectorRatio: Number(row.cross_sector_ratio ?? 0),

    /**
     * These are not available in your current attendee_stats view.
     * They are kept as safe defaults so existing UI code does not break.
     */
    mutualConnectionCount: Number(row.mutual_connection_count ?? 0),
    firstConnectionAt: row.first_connection_at ?? null,
    lastConnectionAt: row.last_connection_at ?? null,
    connectionsPerHour: Number(row.connections_per_hour ?? 0),
  };
}

/**
 * computeAttendeeStats
 *
 * Takes rows from attendee_stats and normalizes them.
 *
 * @param {Array} attendeeStatsRows - Rows from public.attendee_stats.
 * @returns {Array} Normalized stat objects.
 */
export function computeAttendeeStats(attendeeStatsRows = []) {
  return attendeeStatsRows.map(normalizeAttendeeStat);
}

/**
 * assignRoles
 *
 * Priority order, first match wins unless that role is already full:
 *   1. Anchor    — top 15% by total connection count, max 3
 *   2. Connector — top 30% of remaining candidates with ≥3 connections,
 *                  sorted by cross-sector ratio, descending, max 3
 *   3. Explorer  — ≥3 sectors reached AND cross-sector ratio > 0.5, max 3
 *   4. Catalyst  — top 30% by total connection count, not yet assigned, max 3
 *   5. Builder   — everyone else, uncapped
 *
 * Important behavior:
 *   If an attendee qualifies for a role but that role already has 3 people,
 *   they remain unassigned and continue to the next lower-precedence role check.
 */


export function assignRoles(stats = []) {
  const total = stats.length;

  if (total === 0) {
    return [];
  }

  const sorted = [...stats].sort((a, b) => {
    const connectionDiff =
      Number(b.connectionCount || 0) - Number(a.connectionCount || 0);

    if (connectionDiff !== 0) return connectionDiff;

    return String(a.id || "").localeCompare(String(b.id || ""));
  });

  const assigned = new Set();
  const roleById = new Map();
  const roleCounts = new Map();

  // NEW: Catalyst is tracked independently.
  const catalystIds = new Set();

  const canAssignRole = (role) => {
    if (role === "Builder") return true;

    return Number(roleCounts.get(role) || 0) < MAX_PER_COMPETITIVE_ROLE;
  };

  const assign = (id, role) => {
    if (!canAssignRole(role)) return false;

    assigned.add(id);
    roleById.set(id, role);
    roleCounts.set(role, Number(roleCounts.get(role) || 0) + 1);

    return true;
  };

  const assignFromCandidates = (candidates, role, predicate = () => true) => {
    for (const stat of candidates) {
      if (assigned.has(stat.id)) continue;
      if (!predicate(stat)) continue;

      if (!canAssignRole(role)) break;

      assign(stat.id, role);
    }
  };

  // 1. Anchor — top 15% by total connection count, max 3.
  const anchorCutoff = Math.max(1, Math.ceil(total * 0.15));
  assignFromCandidates(sorted.slice(0, anchorCutoff), "Anchor");

  // 2. Connector — top 30% of candidates with ≥3 connections,
  // ranked by cross-sector ratio, max 3.
  const connectorCandidates = stats
    .filter((stat) => stat.connectionCount >= 3)
    .sort((a, b) => {
      const ratioDiff =
        Number(b.crossSectorRatio || 0) - Number(a.crossSectorRatio || 0);

      if (ratioDiff !== 0) return ratioDiff;

      const crossSectorDiff =
        Number(b.crossSectorCount || 0) - Number(a.crossSectorCount || 0);

      if (crossSectorDiff !== 0) return crossSectorDiff;

      const connectionDiff =
        Number(b.connectionCount || 0) - Number(a.connectionCount || 0);

      if (connectionDiff !== 0) return connectionDiff;

      return String(a.id || "").localeCompare(String(b.id || ""));
    });

  const connectorCutoff =
    connectorCandidates.length === 0
      ? 0
      : Math.max(1, Math.ceil(connectorCandidates.length * 0.3));

  assignFromCandidates(
    connectorCandidates.slice(0, connectorCutoff),
    "Connector"
  );

  // 3. Explorer — ≥3 sectors reached AND cross-sector ratio > 0.5, max 3.
  assignFromCandidates(stats, "Explorer", (stat) => {
    const ratio = Number(stat.crossSectorRatio || 0);

    return stat.sectorsReachedCount >= 3 && ratio > 0.5;
  });

  // 4. Catalyst — top 30% by first-hour connections, max 3.
  //
  // Catalyst is independent of the normal role system.
  // It does NOT use `assigned`, and it does NOT overwrite `roleById`.
  const catalystCandidates = [...stats].sort((a, b) => {
    const firstHourDiff =
      Number(b.connectionsFirstHour || 0) -
      Number(a.connectionsFirstHour || 0);

    if (firstHourDiff !== 0) return firstHourDiff;

    const connectionDiff =
      Number(b.connectionCount || 0) - Number(a.connectionCount || 0);

    if (connectionDiff !== 0) return connectionDiff;

    return String(a.id || "").localeCompare(String(b.id || ""));
  });

  const catalystCutoff = Math.max(1, Math.ceil(total * 0.3));

  let catalystCount = 0;

  for (const stat of catalystCandidates.slice(0, catalystCutoff)) {
    if (Number(stat.connectionsFirstHour || 0) <= 0) continue;
    if (catalystCount >= MAX_PER_COMPETITIVE_ROLE) break;

    catalystIds.add(stat.id);
    catalystCount += 1;
  }

  // 5. Builder — everyone else, uncapped.
  stats
    .filter((stat) => !assigned.has(stat.id))
    .forEach((stat) => {
      assign(stat.id, "Builder");
    });

  return stats.map((stat) => {
    const primaryRole = roleById.get(stat.id) || "Builder";
    const roles = catalystIds.has(stat.id)
      ? [primaryRole, "Catalyst"]
      : [primaryRole];

    return {
      ...stat,

      // Keeps existing UI code working.
      role: primaryRole,

      // New multi-role output.
      roles,

      // Easy UI flag.
      isCatalyst: catalystIds.has(stat.id),
    };
  });
}

/**
 * computeRoles
 *
 * Takes attendee_stats rows and returns:
 *   Map<attendeeId, role>
 */
export function computeRoles(attendeeStatsRows = []) {
  const stats = assignRoles(computeAttendeeStats(attendeeStatsRows));

  return new Map(stats.map((stat) => [stat.id, stat.roles]));
}

export function computeRoleList(attendeeStatsRows = []) {
  const stats = assignRoles(computeAttendeeStats(attendeeStatsRows));

  return new Map(stats.map((stat) => [stat.id, stat.roles]));
}
/**
 * computeRoleStats
 *
 * Convenience helper for screens that need the full stat objects
 * with roles already attached.
 */
export function computeRoleStats(attendeeStatsRows = []) {
  const x = assignRoles(computeAttendeeStats(attendeeStatsRows));
  console.log("computeRoleStats", { x });
  return x;
}

export function mergeStatsWithAttendees(attendeeStatsRows = [], attendees = []) {
  const attendeeById = new Map(
    attendees.map((attendee) => [attendee.id, attendee])
  );

  return attendeeStatsRows.map((statRow) => {
    const attendee = attendeeById.get(statRow.user_id);

    return {
      ...statRow,
      ...(attendee || {}),
    };
  });
}