/**
 * roleUtils.js — single source of truth for role assignment.
 *
 * Both ScreenPage and Leaderboard import from here so they always
 * produce identical role assignments for the same data.
 */

function getConnectionTime(connection) {
  const raw =
    connection.created_at || connection.inserted_at || connection.timestamp;
  const time = raw ? new Date(raw).getTime() : NaN;
  return Number.isFinite(time) ? time : null;
}

function addUndirectedEdge(adjacency, a, b) {
  if (!adjacency.has(a)) adjacency.set(a, new Set());
  if (!adjacency.has(b)) adjacency.set(b, new Set());
  adjacency.get(a).add(b);
  adjacency.get(b).add(a);
}

/**
 * computeAttendeeStats
 * Derives per-attendee metrics from raw DB rows.
 * Returns an array of stat objects keyed by attendee id.
 */
export function computeAttendeeStats(attendees, connections) {
  const attendeeById = new Map(attendees.map((a) => [a.id, a]));
  const stats = new Map();
  const adjacency = new Map();

  attendees.forEach((attendee) => {
    stats.set(attendee.id, {
      id: attendee.id,
      attendee,
      connectionCount: 0,
      crossSectorCount: 0,
      sectorsReached: new Set(),
      sectorsReachedCount: 0,
      mutualConnectionCount: 0,
      firstConnectionAt: null,
      lastConnectionAt: null,
      connectionsPerHour: 0,
    });
    adjacency.set(attendee.id, new Set());
  });

  connections.forEach((connection) => {
    const scannerId = connection.scanner_id;
    const scannedId = connection.scanned_id;
    const scanner = attendeeById.get(scannerId);
    const scanned = attendeeById.get(scannedId);

    if (!scanner || !scanned || scannerId === scannedId) return;

    const scannerStats = stats.get(scannerId);
    const scannedStats = stats.get(scannedId);
    if (!scannerStats || !scannedStats) return;

    scannerStats.connectionCount += 1;
    scannedStats.connectionCount += 1;

    if (scanned.sector) scannerStats.sectorsReached.add(scanned.sector);
    if (scanner.sector) scannedStats.sectorsReached.add(scanner.sector);

    if (
      scanner.sector &&
      scanned.sector &&
      scanner.sector !== scanned.sector
    ) {
      scannerStats.crossSectorCount += 1;
      scannedStats.crossSectorCount += 1;
    }

    const time = getConnectionTime(connection);
    if (time !== null) {
      [scannerStats, scannedStats].forEach((stat) => {
        stat.firstConnectionAt =
          stat.firstConnectionAt === null
            ? time
            : Math.min(stat.firstConnectionAt, time);
        stat.lastConnectionAt =
          stat.lastConnectionAt === null
            ? time
            : Math.max(stat.lastConnectionAt, time);
      });
    }

    addUndirectedEdge(adjacency, scannerId, scannedId);
  });

  stats.forEach((stat, attendeeId) => {
    stat.sectorsReachedCount = stat.sectorsReached.size;

    // Mutual connections = neighbours-of-neighbours not already direct neighbours
    const neighbours = adjacency.get(attendeeId) || new Set();
    const mutualConnections = new Set();

    neighbours.forEach((neighbourId) => {
      const neighboursOfNeighbour = adjacency.get(neighbourId) || new Set();
      neighboursOfNeighbour.forEach((candidateId) => {
        if (candidateId !== attendeeId && !neighbours.has(candidateId)) {
          mutualConnections.add(candidateId);
        }
      });
    });

    stat.mutualConnectionCount = mutualConnections.size;

    if (
      stat.connectionCount > 0 &&
      stat.firstConnectionAt !== null &&
      stat.lastConnectionAt !== null
    ) {
      const hours = Math.max(
        1,
        (stat.lastConnectionAt - stat.firstConnectionAt) / (1000 * 60 * 60)
      );
      stat.connectionsPerHour = stat.connectionCount / hours;
    }
  });

  return [...stats.values()];
}

/**
 * assignRoles
 * Takes the output of computeAttendeeStats and stamps a role onto each entry.
 *
 * Priority order (first match wins):
 *   1. Anchor    — top 15% by total connection count
 *   2. Connector — top 30% of remaining candidates with ≥3 connections,
 *                  sorted by cross-sector ratio (descending)
 *   3. Explorer  — ≥3 sectors reached AND cross-sector ratio > 0.5
 *   4. Catalyst  — top 30% by total connection count, not yet assigned
 *   5. Builder   — everyone else
 *
 * Returns an array of stat objects with a `role` field added.
 */
export function assignRoles(stats) {
  const total = stats.length;

  const sorted = [...stats].sort(
    (a, b) => b.connectionCount - a.connectionCount
  );

  const assigned = new Set();
  const roleById = new Map();

  const assign = (id, role) => {
    assigned.add(id);
    roleById.set(id, role);
  };

  // 1. Anchor — top 15%
  const anchorCutoff = Math.max(1, Math.ceil(total * 0.15));
  sorted.slice(0, anchorCutoff).forEach((s) => assign(s.id, "Anchor"));

  // 2. Connector — top 30% of remaining candidates with ≥3 connections,
  //               ranked by cross-sector ratio
  const connectorCandidates = stats
    .filter((s) => !assigned.has(s.id) && s.connectionCount >= 3)
    .sort((a, b) => {
      const aRatio =
        a.connectionCount === 0 ? 0 : a.crossSectorCount / a.connectionCount;
      const bRatio =
        b.connectionCount === 0 ? 0 : b.crossSectorCount / b.connectionCount;
      return bRatio - aRatio;
    });

  const connectorCutoff = Math.max(
    1,
    Math.ceil(connectorCandidates.length * 0.3)
  );
  connectorCandidates
    .slice(0, connectorCutoff)
    .forEach((s) => assign(s.id, "Connector"));

  // 3. Explorer — ≥3 sectors AND cross-sector ratio > 0.5
  stats
    .filter((s) => !assigned.has(s.id))
    .forEach((s) => {
      const ratio =
        s.connectionCount === 0 ? 0 : s.crossSectorCount / s.connectionCount;
      if (s.sectorsReachedCount >= 3 && ratio > 0.5) {
        assign(s.id, "Explorer");
      }
    });

  // 4. Catalyst — top 30% by connection count, not yet assigned
  const catalystCutoff = Math.max(1, Math.ceil(total * 0.3));
  sorted
    .slice(0, catalystCutoff)
    .filter((s) => !assigned.has(s.id))
    .forEach((s) => assign(s.id, "Catalyst"));

  // 5. Builder — everyone else
  stats
    .filter((s) => !assigned.has(s.id))
    .forEach((s) => assign(s.id, "Builder"));

  return stats.map((stat) => ({
    ...stat,
    role: roleById.get(stat.id) || "Builder",
  }));
}

/**
 * computeRoles
 * Convenience wrapper — takes raw DB rows and returns a Map<attendeeId, role>.
 * Used by ScreenPage on reveal-button press.
 */
export function computeRoles(attendees, connections) {
  const stats = assignRoles(computeAttendeeStats(attendees, connections));
  return new Map(stats.map((s) => [s.id, s.role]));
}