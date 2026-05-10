import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import { buildGraphData } from "../../lib/graphHelpers";
import { DEVELOPER_MODE } from "../../data/config";

// Fallback palettes — overridden by props passed from ScreenPage
const DEFAULT_SECTOR_COLORS = {
  tech: "#378ADD",
  finance: "#7F77DD",
  health: "#1D9E75",
  energy: "#EF9F27",
  public_sector: "#D85A30",
  other: "#888780",
};

const DEFAULT_ROLE_COLORS = {
  Anchor: "#EF9F27",
  Connector: "#1D9E75",
  Explorer: "#7F77DD",
  Catalyst: "#D85A30",
  Builder: "#378ADD",
};

function getNodeId(value) {
  return typeof value === "object" && value !== null ? value.id : value;
}

function getSafeNumber(value, fallback) {
  return Number.isFinite(value) ? value : fallback;
}

function NetworkGraph({
  attendees,
  connections,
  showNames = false,
  revealRoles = false,
  layoutVersion = 0,
  sectorColors = DEFAULT_SECTOR_COLORS,
  roleColors = DEFAULT_ROLE_COLORS,
}) {
  const svgRef = useRef(null);
  const wrapperRef = useRef(null);
  const simulationRef = useRef(null);

  const graphGroupRef = useRef(null);
  const linkGroupRef = useRef(null);
  const nodeGroupRef = useRef(null);
  const labelGroupRef = useRef(null);

  const linkSelectionRef = useRef(null);
  const nodeSelectionRef = useRef(null);
  const labelSelectionRef = useRef(null);

  const nodeByIdRef = useRef(new Map());
  const previousLinkKeysRef = useRef(new Set());
  const initializedRef = useRef(false);

  const dimensionsRef = useRef({
    width: 1200,
    height: 460,
  });

  const [dimensions, setDimensions] = useState({
    width: 1200,
    height: 460,
  });

  const graphData = useMemo(() => {
    return buildGraphData(attendees, connections);
  }, [attendees, connections]);

  const getNodeColor = (node) => {
    console.log(node)
  if (revealRoles) {
    return roleColors[node.role] || "#888780";
  }

  return sectorColors[node.sector.toLowerCase()] || "#888780";
};

  useEffect(() => {
    dimensionsRef.current = dimensions;
  }, [dimensions]);

  useEffect(() => {
    function updateDimensions() {
      if (!wrapperRef.current) return;

      const rect = wrapperRef.current.getBoundingClientRect();

      const width =
        Math.round(rect.width) ||
        wrapperRef.current.clientWidth ||
        window.innerWidth ||
        1200;

      const height =
        Math.round(rect.height) ||
        wrapperRef.current.clientHeight ||
        460;

      setDimensions((previous) => {
        if (previous.width === width && previous.height === height) {
          return previous;
        }

        return { width, height };
      });
    }

    updateDimensions();

    const resizeObserver = new ResizeObserver(updateDimensions);

    if (wrapperRef.current) {
      resizeObserver.observe(wrapperRef.current);
    }

    window.addEventListener("resize", updateDimensions);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateDimensions);
    };
  }, []);

  useEffect(() => {
    if (!svgRef.current) return;
    if (initializedRef.current) return;

    const svg = d3.select(svgRef.current);

    svg.selectAll("*").interrupt();
    svg.selectAll("*").remove();

    svg
      .style("cursor", "grab")
      .style("background", "#f7f7f5");

    const graphGroup = svg.append("g");
    const linkGroup = graphGroup.append("g");
    const nodeGroup = graphGroup.append("g");
    const labelGroup = graphGroup.append("g");

    graphGroupRef.current = graphGroup;
    linkGroupRef.current = linkGroup;
    nodeGroupRef.current = nodeGroup;
    labelGroupRef.current = labelGroup;

    const zoom = d3
      .zoom()
      .scaleExtent([0.45, 3])
      .on("start", () => {
        svg.style("cursor", "grabbing");
      })
      .on("zoom", (event) => {
        graphGroup.attr("transform", event.transform);
      })
      .on("end", () => {
        svg.style("cursor", "grab");
      });

    svg.call(zoom);

    const { width, height } = dimensionsRef.current;

    svg.call(
      zoom.transform,
      d3.zoomIdentity.translate(width * 0.01, height * 0.02).scale(0.98)
    );

    const simulation = d3
      .forceSimulation([])
      .force(
        "link",
        d3
          .forceLink([])
          .id((d) => d.id)
          .distance(90)
          .strength(0.6)
      )
      .force("charge", d3.forceManyBody().strength(-120))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("x", d3.forceX(width / 2).strength(0.045))
      .force("y", d3.forceY(height / 2).strength(0.06))
      .force(
        "collision",
        d3
          .forceCollide()
          .radius((d) => 10 + d.connectionCount * 1.2)
          .iterations(2)
      );

    simulation.on("tick", () => {
      const { width: currentWidth, height: currentHeight } =
        dimensionsRef.current;

      if (linkSelectionRef.current) {
        linkSelectionRef.current
          .attr("x1", (d) => {
            const source =
              typeof d.source === "object"
                ? d.source
                : nodeByIdRef.current.get(d.source);

            return getSafeNumber(source?.x, currentWidth / 2);
          })
          .attr("y1", (d) => {
            const source =
              typeof d.source === "object"
                ? d.source
                : nodeByIdRef.current.get(d.source);

            return getSafeNumber(source?.y, currentHeight / 2);
          })
          .attr("x2", (d) => {
            const target =
              typeof d.target === "object"
                ? d.target
                : nodeByIdRef.current.get(d.target);

            return getSafeNumber(target?.x, currentWidth / 2);
          })
          .attr("y2", (d) => {
            const target =
              typeof d.target === "object"
                ? d.target
                : nodeByIdRef.current.get(d.target);

            return getSafeNumber(target?.y, currentHeight / 2);
          });
      }

      if (nodeSelectionRef.current) {
        nodeSelectionRef.current
          .attr("cx", (d) => getSafeNumber(d.x, currentWidth / 2))
          .attr("cy", (d) => getSafeNumber(d.y, currentHeight / 2));
      }

      if (labelSelectionRef.current) {
        labelSelectionRef.current
          .attr("x", (d) => getSafeNumber(d.x, currentWidth / 2) + 10)
          .attr("y", (d) => getSafeNumber(d.y, currentHeight / 2) + 3);
      }
    });

    simulationRef.current = simulation;
    initializedRef.current = true;

    return () => {
      simulation.stop();

      d3.select(svgRef.current).selectAll("*").interrupt();
      d3.select(svgRef.current).selectAll("*").remove();

      graphGroupRef.current = null;
      linkGroupRef.current = null;
      nodeGroupRef.current = null;
      labelGroupRef.current = null;

      linkSelectionRef.current = null;
      nodeSelectionRef.current = null;
      labelSelectionRef.current = null;

      simulationRef.current = null;
      nodeByIdRef.current = new Map();
      previousLinkKeysRef.current = new Set();
      initializedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!svgRef.current) return;

    d3.select(svgRef.current).attr(
      "viewBox",
      `0 0 ${dimensions.width} ${dimensions.height}`
    );

    const simulation = simulationRef.current;

    if (!simulation) return;

    simulation.force(
      "center",
      d3.forceCenter(dimensions.width / 2, dimensions.height / 2)
    );

    simulation.force("x", d3.forceX(dimensions.width / 2).strength(0.045));
    simulation.force("y", d3.forceY(dimensions.height / 2).strength(0.06));

    simulation.nodes().forEach((node) => {
      node.x = getSafeNumber(node.x, dimensions.width / 2);
      node.y = getSafeNumber(node.y, dimensions.height / 2);
      node.vx = getSafeNumber(node.vx, 0);
      node.vy = getSafeNumber(node.vy, 0);
    });

    simulation.alpha(0.2).restart();
  }, [dimensions]);

  useEffect(() => {
    if (!simulationRef.current) return;

    simulationRef.current.alpha(0.75).restart();
  }, [layoutVersion]);

  useEffect(() => {
    if (
      !simulationRef.current ||
      !linkGroupRef.current ||
      !nodeGroupRef.current ||
      !labelGroupRef.current
    ) {
      return;
    }

    const simulation = simulationRef.current;
    const { width, height } = dimensionsRef.current;

    const existingNodesById = new Map(
      simulation.nodes().map((node) => [node.id, node])
    );

    const nextNodes = graphData.nodes.map((node) => {
      const existingNode = existingNodesById.get(node.id);

      if (existingNode) {
        Object.assign(existingNode, node);

        existingNode.x = getSafeNumber(existingNode.x, width / 2);
        existingNode.y = getSafeNumber(existingNode.y, height / 2);
        existingNode.vx = getSafeNumber(existingNode.vx, 0);
        existingNode.vy = getSafeNumber(existingNode.vy, 0);

        return existingNode;
      }

      return {
        ...node,
        x: width / 2 + (Math.random() - 0.5) * width * 0.75,
        y: height / 2 + (Math.random() - 0.5) * height * 0.75,
        vx: 0,
        vy: 0,
      };
    });

    const nextNodeIds = new Set(nextNodes.map((node) => node.id));

    const nextLinks = graphData.links
      .map((link) => {
        const source = getNodeId(link.source);
        const target = getNodeId(link.target);

        return {
          ...link,
          source,
          target,
          key: [source, target].sort().join("__"),
        };
      })
      .filter((link) => {
        return nextNodeIds.has(link.source) && nextNodeIds.has(link.target);
      });

    const currentLinkKeys = new Set(nextLinks.map((link) => link.key));
    const previousLinkKeys = previousLinkKeysRef.current;

    const newLinkKeys = new Set(
      [...currentLinkKeys].filter((key) => !previousLinkKeys.has(key))
    );

    previousLinkKeysRef.current = currentLinkKeys;

    const newConnectedNodeIds = new Set();

    nextLinks.forEach((link) => {
      if (!newLinkKeys.has(link.key)) return;

      newConnectedNodeIds.add(getNodeId(link.source));
      newConnectedNodeIds.add(getNodeId(link.target));
    });

    simulation.nodes(nextNodes);
    nodeByIdRef.current = new Map(nextNodes.map((node) => [node.id, node]));

    simulation
      .force("link")
      .links(nextLinks)
      .distance(90)
      .strength(0.6);

    simulation.force(
      "collision",
      d3
        .forceCollide()
        .radius((d) => 10 + d.connectionCount * 1.2)
        .iterations(2)
    );

    linkGroupRef.current.selectAll("line").interrupt();
    nodeGroupRef.current.selectAll("circle").interrupt();
    labelGroupRef.current.selectAll("text").interrupt();

    const links = linkGroupRef.current
      .selectAll("line")
      .data(nextLinks, (d) => d.key)
      .join(
        (enter) =>
          enter
            .append("line")
            .attr("x1", (d) => {
              const source = nodeByIdRef.current.get(getNodeId(d.source));
              return getSafeNumber(source?.x, width / 2);
            })
            .attr("y1", (d) => {
              const source = nodeByIdRef.current.get(getNodeId(d.source));
              return getSafeNumber(source?.y, height / 2);
            })
            .attr("x2", (d) => {
              const target = nodeByIdRef.current.get(getNodeId(d.target));
              return getSafeNumber(target?.x, width / 2);
            })
            .attr("y2", (d) => {
              const target = nodeByIdRef.current.get(getNodeId(d.target));
              return getSafeNumber(target?.y, height / 2);
            })
            .attr("stroke", "#8ec5ad")
            .attr("stroke-width", 1.4)
            .attr("stroke-opacity", 0)
            .attr("stroke-linecap", "round")
            .attr("stroke-dasharray", (d) =>
              newLinkKeys.has(d.key) ? "4 4" : null
            )
            .call((enter) =>
              enter
                .transition()
                .duration(500)
                .attr("stroke-opacity", 0.42)
                .attr("stroke-dasharray", null)
            ),
        (update) =>
          update
            .attr("stroke", "#8ec5ad")
            .attr("stroke-width", 1.4)
            .attr("stroke-opacity", 0.42)
            .attr("stroke-linecap", "round"),
        (exit) => exit.interrupt().remove()
      );

    const nodes = nodeGroupRef.current
      .selectAll("circle")
      .data(nextNodes, (d) => d.id)
      .join(
        (enter) => {
          const enteredNodes = enter
            .append("circle")
            .attr("cx", (d) => getSafeNumber(d.x, width / 2))
            .attr("cy", (d) => getSafeNumber(d.y, height / 2))
            .attr("r", 0)
            .attr("fill", getNodeColor)
            .attr("stroke", "#d9d9d4")
            .attr("stroke-width", 1.5)
            .call(
              d3
                .drag()
                .on("start", (event, d) => {
                  event.sourceEvent.stopPropagation();

                  if (!event.active) {
                    simulationRef.current?.alphaTarget(0.25).restart();
                  }

                  d.fx = d.x;
                  d.fy = d.y;
                })
                .on("drag", (event, d) => {
                  d.fx = event.x;
                  d.fy = event.y;
                })
                .on("end", (event, d) => {
                  if (!event.active) {
                    simulationRef.current?.alphaTarget(0);
                  }

                  d.fx = null;
                  d.fy = null;
                })
            );

          enteredNodes.append("title").text((d) => {
            return `${d.name || "Attendee"} · ${d.company || ""} · ${
              d.sector || ""
            }`;
          });

          enteredNodes
            .transition()
            .duration(500)
            .attr("r", (d) => 4 + d.connectionCount * 0.9);

          return enteredNodes;
        },
        (update) =>
          update.call((update) =>
            update
              .transition()
              .duration(1000)
              .attr("fill", getNodeColor)
              .transition()
              .duration(300)
              .attr("r", (d) => 4 + d.connectionCount * 0.9)
          ),
        (exit) =>
          exit
            .transition()
            .duration(300)
            .attr("r", 0)
            .remove()
      );

    nodes.select("title").text((d) => {
      return `${d.name || "Attendee"} · ${d.company || ""} · ${
        d.sector || ""
      }`;
    });

    const labels = labelGroupRef.current
      .selectAll("text")
      .data(nextNodes, (d) => d.id)
      .join(
        (enter) =>
          enter
            .append("text")
            // if (!DEVELOPER_MODE) {
            // .text((d) => d.name?.split(" ")[0] || "")
            // } else {
            //   .text((d) => d.name || "")
            // }
            .text((d) => !DEVELOPER_MODE? d.name?.split(" ")[0] || "" : d.name || "")
            .attr("x", (d) => getSafeNumber(d.x, width / 2) + 10)
            .attr("y", (d) => getSafeNumber(d.y, height / 2) + 3)
            .attr("font-size", 10)
            .attr("font-weight", 500)
            .attr("fill", "#4b4b47")
            .attr("paint-order", "stroke")
            .attr("stroke", "#f7f7f5")
            .attr("stroke-width", 3)
            .attr("opacity", 0)
            .style("pointer-events", "none")
            .call((enter) =>
              enter
                .transition()
                .duration(400)
                .attr("opacity", showNames ? 1 : 0)
            ),
        (update) =>
          update
            .text((d) => !DEVELOPER_MODE? d.name?.split(" ")[0] || "": d.name || "")
            .attr("opacity", showNames ? 1 : 0),
        (exit) =>
          exit
            .transition()
            .duration(300)
            .attr("opacity", 0)
            .remove()
      );

    linkSelectionRef.current = links;
    nodeSelectionRef.current = nodes;
    labelSelectionRef.current = labels;

    if (newConnectedNodeIds.size > 0) {
      nextNodes.forEach((node) => {
        if (!newConnectedNodeIds.has(node.id)) return;

        node.vx = (node.vx || 0) + (Math.random() - 0.5) * 1.4;
        node.vy = (node.vy || 0) + (Math.random() - 0.5) * 1.4;
      });

      nodes
        .filter((d) => newConnectedNodeIds.has(d.id))
        .raise()
        .transition()
        .duration(140)
        .attr("r", (d) => 6 + d.connectionCount)
        .transition()
        .duration(420)
        .attr("r", (d) => 4 + d.connectionCount * 0.9);

      simulation.alphaTarget(0.06).restart();

      window.setTimeout(() => {
        simulation.alphaTarget(0);
      }, 700);
    } else {
      simulation.alpha(0.2).restart();
    }
  }, [graphData, revealRoles, showNames]);

  return (
    <div className="h-full w-full bg-[#f7f7f5]">
      <div
        ref={wrapperRef}
        className="relative h-full min-h-[460px] w-full overflow-hidden bg-[#f7f7f5]"
      >
        <svg
          ref={svgRef}
          className="h-full w-full"
          style={{ background: "#f7f7f5" }}
        />
      </div>
    </div>
  );
}

export default NetworkGraph;