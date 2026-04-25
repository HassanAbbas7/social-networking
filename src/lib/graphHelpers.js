import { getRoleForNode } from "./roleHelpers";

export const sectorColors = {
  Nonprofit: "#f59e0b",
  Tech: "#38bdf8",
  Finance: "#a78bfa",
  Education: "#34d399",
  Government: "#f87171",
  Health: "#fb7185",
};

export const roleColors = {
  Anchor: "#facc15",
  Connector: "#22c55e",
  Explorer: "#38bdf8",
  Catalyst: "#f97316",
  Builder: "#94a3b8",
};

export function buildGraphData(attendees, connections) {
  const sectorById = new Map(
    attendees.map((attendee) => [attendee.id, attendee.sector])
  );

  const degreeMap = new Map(attendees.map((attendee) => [attendee.id, 0]));

  connections.forEach((connection) => {
    degreeMap.set(
      connection.scanner_id,
      (degreeMap.get(connection.scanner_id) || 0) + 1
    );

    degreeMap.set(
      connection.scanned_id,
      (degreeMap.get(connection.scanned_id) || 0) + 1
    );
  });

  const nodesWithoutRoles = attendees.map((attendee) => {
    const connectedSectors = new Set();
    let crossSectorCount = 0;

    connections.forEach((connection) => {
      const isScanner = connection.scanner_id === attendee.id;
      const isScanned = connection.scanned_id === attendee.id;

      if (!isScanner && !isScanned) return;

      const otherId = isScanner
        ? connection.scanned_id
        : connection.scanner_id;

      const otherSector = sectorById.get(otherId);

      if (otherSector) {
        connectedSectors.add(otherSector);
      }

      if (otherSector && otherSector !== attendee.sector) {
        crossSectorCount += 1;
      }
    });

    const connectionCount = degreeMap.get(attendee.id) || 0;

    return {
      ...attendee,
      connectionCount,
      crossSectorCount,
      sectorsReached: connectedSectors.size,
      crossSectorRatio:
        connectionCount > 0 ? crossSectorCount / connectionCount : 0,
    };
  });

  const nodes = nodesWithoutRoles.map((node) => ({
    ...node,
    role: getRoleForNode(node, nodesWithoutRoles),
  }));

  const links = connections.map((connection) => {
    const sourceSector = sectorById.get(connection.scanner_id);
    const targetSector = sectorById.get(connection.scanned_id);

    return {
      id: connection.id,
      source: connection.scanner_id,
      target: connection.scanned_id,
      isCrossSector: sourceSector !== targetSector,
    };
  });

  return {
    nodes,
    links,
  };
}