import React, { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";

const attendees = [
  { id: "1", name: "Maya", sector: "Nonprofit", company: "GreenAid" },
  { id: "2", name: "Jonas", sector: "Tech", company: "DataNest" },
  { id: "3", name: "Sara", sector: "Finance", company: "Impact Fund" },
  { id: "4", name: "Omar", sector: "Education", company: "LearnLab" },
  { id: "5", name: "Nina", sector: "Nonprofit", company: "FoodBridge" },
  { id: "6", name: "Leo", sector: "Tech", company: "CivicOS" },
  { id: "7", name: "Amara", sector: "Government", company: "City Office" },
  { id: "8", name: "Ravi", sector: "Health", company: "CareNet" }
];

const connections = [
  { source: "1", target: "2" },
  { source: "1", target: "3" },
  { source: "2", target: "4" },
  { source: "3", target: "5" },
  { source: "4", target: "6" },
  { source: "6", target: "7" },
  { source: "2", target: "6" },
  { source: "5", target: "8" },
  { source: "7", target: "8" }
];

const sectorColors = {
  Nonprofit: "#f59e0b",
  Tech: "#38bdf8",
  Finance: "#a78bfa",
  Education: "#34d399",
  Government: "#f87171",
  Health: "#fb7185"
};

function getStats(nodes, links) {
  const degree = new Map(nodes.map((node) => [node.id, 0]));

  links.forEach((link) => {
    degree.set(link.source, (degree.get(link.source) || 0) + 1);
    degree.set(link.target, (degree.get(link.target) || 0) + 1);
  });

  return nodes.map((node) => ({
    ...node,
    connections: degree.get(node.id) || 0
  }));
}

function getRole(node, nodes) {
  const sortedByCount = [...nodes].sort((a, b) => b.connections - a.connections);
  const anchorCutoff = Math.max(1, Math.ceil(nodes.length * 0.15));
  const catalystCutoff = Math.max(1, Math.ceil(nodes.length * 0.3));

  if (sortedByCount.slice(0, anchorCutoff).some((item) => item.id === node.id)) return "Anchor";
  if (node.connections >= 3 && node.crossSectorRatio >= 0.7) return "Connector";
  if (node.sectorsReached >= 3 && node.crossSectorRatio > 0.5) return "Explorer";
  if (sortedByCount.slice(0, catalystCutoff).some((item) => item.id === node.id)) return "Catalyst";
  return "Builder";
}

export default function EcosystemNetworkGraph() {
  const svgRef = useRef(null);
  const wrapperRef = useRef(null);
  const simulationRef = useRef(null);
  const [showNames, setShowNames] = useState(true);
  const [rolesRevealed, setRolesRevealed] = useState(false);

  const graphData = useMemo(() => {
    const baseNodes = getStats(attendees, connections);
    const sectorById = new Map(baseNodes.map((node) => [node.id, node.sector]));

    const enrichedNodes = baseNodes.map((node) => {
      const linkedSectors = new Set();
      let crossSectorCount = 0;

      connections.forEach((link) => {
        const isSource = link.source === node.id;
        const isTarget = link.target === node.id;
        if (!isSource && !isTarget) return;

        const otherId = isSource ? link.target : link.source;
        const otherSector = sectorById.get(otherId);
        if (otherSector) linkedSectors.add(otherSector);
        if (otherSector && otherSector !== node.sector) crossSectorCount += 1;
      });

      return {
        ...node,
        sectorsReached: linkedSectors.size,
        crossSectorRatio: node.connections ? crossSectorCount / node.connections : 0
      };
    });

    return {
      nodes: enrichedNodes.map((node) => ({
        ...node,
        role: getRole(node, enrichedNodes)
      })),
      links: connections.map((link) => ({ ...link }))
    };
  }, []);

  useEffect(() => {
    if (!svgRef.current || !wrapperRef.current) return;

    const width = wrapperRef.current.clientWidth;
    const height = 620;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("viewBox", `0 0 ${width} ${height}`);

    const sectorById = new Map(graphData.nodes.map((node) => [node.id, node.sector]));

    const link = svg
      .append("g")
      .selectAll("line")
      .data(graphData.links)
      .join("line")
      .attr("stroke", (d) =>
        sectorById.get(d.source) !== sectorById.get(d.target) ? "#22c55e" : "#4b5563"
      )
      .attr("stroke-width", (d) =>
        sectorById.get(d.source) !== sectorById.get(d.target) ? 3 : 1.5
      )
      .attr("stroke-opacity", 0.85);

    const node = svg
      .append("g")
      .selectAll("circle")
      .data(graphData.nodes)
      .join("circle")
      .attr("r", (d) => 12 + d.connections * 3)
      .attr("fill", (d) => sectorColors[d.sector] || "#e5e7eb")
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 2)
      .call(
        d3
          .drag()
          .on("start", (event, d) => {
            if (!event.active) simulationRef.current.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) simulationRef.current.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      );

    const label = svg
      .append("g")
      .selectAll("text")
      .data(graphData.nodes)
      .join("text")
      .text((d) => d.name)
      .attr("font-size", 14)
      .attr("font-weight", 700)
      .attr("fill", "#f8fafc")
      .attr("paint-order", "stroke")
      .attr("stroke", "#0e0e0c")
      .attr("stroke-width", 4)
      .attr("opacity", showNames ? 1 : 0);

    node.append("title").text((d) => `${d.name} · ${d.company} · ${d.sector}`);

    const simulation = d3
      .forceSimulation(graphData.nodes)
      .force(
        "link",
        d3.forceLink(graphData.links).id((d) => d.id).distance(135)
      )
      .force("charge", d3.forceManyBody().strength(-480))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius((d) => 34 + d.connections * 2));

    simulationRef.current = simulation;

    simulation.on("tick", () => {
      link
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);

      node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
      label.attr("x", (d) => d.x + 18).attr("y", (d) => d.y + 5);
    });

    return () => simulation.stop();
  }, [graphData, showNames]);

  useEffect(() => {
    const roleColors = {
      Anchor: "#facc15",
      Connector: "#22c55e",
      Explorer: "#38bdf8",
      Catalyst: "#f97316",
      Builder: "#94a3b8"
    };

    d3.select(svgRef.current)
      .selectAll("circle")
      .transition()
      .duration(1000)
      .attr("fill", (d) => (rolesRevealed ? roleColors[d.role] : sectorColors[d.sector]));
  }, [rolesRevealed]);

  const attendeeCount = graphData.nodes.length;
  const connectionCount = graphData.links.length;
  const crossSectorCount = graphData.links.filter((link) => {
    const source = typeof link.source === "object" ? link.source.id : link.source;
    const target = typeof link.target === "object" ? link.target.id : link.target;
    const sourceSector = attendees.find((person) => person.id === source)?.sector;
    const targetSector = attendees.find((person) => person.id === target)?.sector;
    return sourceSector !== targetSector;
  }).length;
  const anbiPool = Math.min(connectionCount, 250);

  function reheatLayout() {
    simulationRef.current?.alpha(0.9).restart();
  }

  return (
    <main className="min-h-screen bg-[#0e0e0c] p-6 text-white">
      <section className="mx-auto max-w-7xl">
        <header className="mb-5 flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 shadow-2xl md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-white/50">Live Ecosystem Network</p>
            <h1 className="mt-2 text-3xl font-bold">Connections forming in real time</h1>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
            <Stat label="Attendees" value={attendeeCount} />
            <Stat label="Connections" value={connectionCount} />
            <Stat label="Cross-sector" value={crossSectorCount} />
            <Stat label="ANBI pool" value={`€${anbiPool}`} />
          </div>
        </header>

        <div className="mb-4 flex flex-wrap gap-3">
          <button onClick={() => setRolesRevealed(true)} className="rounded-xl bg-white px-4 py-2 font-semibold text-black">
            Reveal roles
          </button>
          <button onClick={() => setShowNames((value) => !value)} className="rounded-xl border border-white/20 px-4 py-2 font-semibold">
            Toggle names
          </button>
          <button onClick={reheatLayout} className="rounded-xl border border-white/20 px-4 py-2 font-semibold">
            Reheat layout
          </button>
        </div>

        <div ref={wrapperRef} className="overflow-hidden rounded-2xl border border-white/10 bg-black/30">
          <svg ref={svgRef} className="h-[620px] w-full" />
        </div>

        <p className="mt-4 text-sm text-white/50">
          In production, replace the sample arrays with Supabase rows and subscribe to connection inserts using Supabase Realtime.
        </p>
      </section>
    </main>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl bg-black/30 px-4 py-3">
      <div className="text-xs uppercase tracking-widest text-white/40">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  );
}
