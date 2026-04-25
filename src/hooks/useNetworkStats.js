export function useNetworkStats(attendees, connections) {
  const sectorById = new Map(
    attendees.map((attendee) => [attendee.id, attendee.sector])
  );

  const crossSectorCount = connections.filter((connection) => {
    const scannerSector = sectorById.get(connection.scanner_id);
    const scannedSector = sectorById.get(connection.scanned_id);

    return scannerSector && scannedSector && scannerSector !== scannedSector;
  }).length;

  return {
    attendeeCount: attendees.length,
    connectionCount: connections.length,
    crossSectorCount,
    anbiPool: Math.min(connections.length, 250),
  };
}