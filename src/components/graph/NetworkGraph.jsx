import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import GraphHeader from "./GraphHeader";
import GraphControls from "./GraphControls";
import GraphLegend from "./GraphLegend";
import { buildGraphData, sectorColors, roleColors } from "../../lib/graphHelpers";
import { useNetworkStats } from "../../hooks/useNetworkStats";

function NetworkGraph({ attendees, connections }) {
  const svgRef = useRef(null);
  const wrapperRef = useRef(null);
  const simulationRef = useRef(null);

  const [showNames, setShowNames] = useState(true);
  const [rolesRevealed, setRolesRevealed] = useState(false);

  const graphData = useMemo(() => {
    return buildGraphData(attendees, connections);
  }, [attendees, connections]);

  const stats = useNetworkStats(attendees, connections);

  useEffect(() => {
    if (!svgRef.current || !wrapperRef.current) return;

    const width = wrapperRef.current.clientWidth;
    const height = 620;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("viewBox", `0 0 ${width} ${height}`);

    const linkGroup = svg.append("g");
    const nodeGroup = svg.append("g");
    const labelGroup = svg.append("g");

    const links = linkGroup
      .selectAll("line")
      .data(graphData.links)
      .join("line")
      .attr("stroke", (d) => (d.isCrossSector ? "#22c55e" : "#4b5563"))
      .attr("stroke-width", (d) => (d.isCrossSector ? 3 : 1.5))
      .attr("stroke-opacity", 0.85);

    const nodes = nodeGroup
      .selectAll("circle")
      .data(graphData.nodes)
      .join("circle")
      .attr("r", (d) => 12 + d.connectionCount * 3)
      .attr("fill", (d) =>
        rolesRevealed ? roleColors[d.role] : sectorColors[d.sector] || "#e5e7eb"
      )
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

    nodes.append("title").text((d) => {
      return `${d.name} · ${d.company} · ${d.sector}`;
    });

    const labels = labelGroup
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

    const simulation = d3
      .forceSimulation(graphData.nodes)
      .force(
        "link",
        d3
          .forceLink(graphData.links)
          .id((d) => d.id)
          .distance(135)
      )
      .force("charge", d3.forceManyBody().strength(-480))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force(
        "collision",
        d3.forceCollide().radius((d) => 34 + d.connectionCount * 2)
      );

    simulationRef.current = simulation;

    simulation.on("tick", () => {
      links
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);

      nodes.attr("cx", (d) => d.x).attr("cy", (d) => d.y);

      labels.attr("x", (d) => d.x + 18).attr("y", (d) => d.y + 5);
    });

    return () => simulation.stop();
  }, [graphData, showNames, rolesRevealed]);

  useEffect(() => {
    d3.select(svgRef.current)
      .selectAll("circle")
      .transition()
      .duration(1000)
      .attr("fill", (d) =>
        rolesRevealed ? roleColors[d.role] : sectorColors[d.sector] || "#e5e7eb"
      );
  }, [rolesRevealed]);

  function reheatLayout() {
    simulationRef.current?.alpha(0.9).restart();
  }

  return (
    <main className="min-h-screen bg-[#0e0e0c] p-6 text-white">
      <section className="mx-auto max-w-7xl">
        <GraphHeader stats={stats} />

        <GraphControls
          showNames={showNames}
          rolesRevealed={rolesRevealed}
          onToggleNames={() => setShowNames((value) => !value)}
          onRevealRoles={() => setRolesRevealed(true)}
          onResetRoles={() => setRolesRevealed(false)}
          onReheatLayout={reheatLayout}
        />

        <div
          ref={wrapperRef}
          className="overflow-hidden rounded-2xl border border-white/10 bg-black/30"
        >
          <svg ref={svgRef} className="h-[620px] w-full" />
        </div>

        <GraphLegend rolesRevealed={rolesRevealed} />
      </section>
    </main>
  );
}

export default NetworkGraph;