export function getRoleForNode(node, allNodes) {
  const sortedByConnections = [...allNodes].sort(
    (a, b) => b.connectionCount - a.connectionCount
  );

  const sortedByCrossSectorRatio = [...allNodes]
    .filter((item) => item.connectionCount >= 3)
    .sort((a, b) => b.crossSectorRatio - a.crossSectorRatio);

  const anchorLimit = Math.max(1, Math.ceil(allNodes.length * 0.15));
  const connectorLimit = Math.max(1, Math.ceil(allNodes.length * 0.3));
  const catalystLimit = Math.max(1, Math.ceil(allNodes.length * 0.3));

  const anchors = sortedByConnections.slice(0, anchorLimit);
  const connectors = sortedByCrossSectorRatio.slice(0, connectorLimit);
  const catalysts = sortedByConnections.slice(0, catalystLimit);

  if (anchors.some((item) => item.id === node.id)) {
    return "Anchor";
  }

  if (connectors.some((item) => item.id === node.id)) {
    return "Connector";
  }

  if (node.sectorsReached >= 3 && node.crossSectorRatio > 0.5) {
    return "Explorer";
  }

  if (catalysts.some((item) => item.id === node.id)) {
    return "Catalyst";
  }

  return "Builder";
}