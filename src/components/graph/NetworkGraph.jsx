import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import { buildGraphData } from "../../lib/graphHelpers";
import { DEVELOPER_MODE, SECTOR_CONFIG } from "../../data/config";

// Fallback palettes — overridden by props passed from ScreenPage
const DEFAULT_SECTOR_COLORS = {
  tech: "#378ADD",
  finance: "#7F77DD",
  health: "#1D9E75",
  energy: "#EF9F27",
  public: "#D85A30",
  industry: "#888780",
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

function getNodeRadius(d) {
  return Math.max(14, Math.min(36, 8 + d.connectionCount * 2.5));
}

function getDisplayedName(d) {
  return !DEVELOPER_MODE ? d.name?.split(" ")[0] || "" : d.name || "";
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
    if (revealRoles && node.role) {
      return roleColors[node.role] || "#888780";
    }
    const sectorKey = (node.sector || "industry").toLowerCase().replace(/\s+/g, "_");
    return sectorColors[sectorKey] || "#888780";
  };

function getLabelCollisionRadius(d) {
  const name = !DEVELOPER_MODE
    ? d.name?.split(" ")[0] || ""
    : d.name || "";

  const fontSize = 16;
  const estimatedTextWidth = name.length * fontSize * 0.55;
  const nodeRadius = getNodeRadius(d);

  return nodeRadius + estimatedTextWidth + 10;
}
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
          .distance(120)
          .strength(0.6)
      )
      .force("charge", d3.forceManyBody().strength(-450))
      .force("center", null)
      .force("x", d3.forceX(width / 2).strength((d) => d.connectionCount > 0 ? 0.045 : 0.012))
      .force("y", d3.forceY(height / 2).strength((d) => d.connectionCount > 0 ? 0.06 : 0.015))
      .force(
        "collision",
        d3
          .forceCollide()
          .radius(getLabelCollisionRadius)
          .iterations(4)
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
          .attr("transform", (d) => {
            const x = getSafeNumber(d.x, currentWidth / 2) + getNodeRadius(d) + 5;
            const y = getSafeNumber(d.y, currentHeight / 2);
            return `translate(${x},${y})`;
          });
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
      .distance(120)
      .strength(0.6);

    simulation.force(
      "collision",
      d3
        .forceCollide()
        .radius(getLabelCollisionRadius)
        .iterations(4)
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
            .attr("stroke", (d) => {
              const sNode = nodeByIdRef.current.get(getNodeId(d.source));
              const tNode = nodeByIdRef.current.get(getNodeId(d.target));
              return (sNode && tNode && sNode.sector !== tNode.sector) ? "#008080" : "#B0ACA4";
            })
            .attr("stroke-width", (d) => {
              const sNode = nodeByIdRef.current.get(getNodeId(d.source));
              const tNode = nodeByIdRef.current.get(getNodeId(d.target));
              return (sNode && tNode && sNode.sector !== tNode.sector) ? 2.5 : 1.5;
            })
            .attr("stroke-opacity", 0)
            .attr("stroke-linecap", "round")
            .attr("stroke-dasharray", (d) =>
              newLinkKeys.has(d.key) ? "4 4" : null
            )
            .call((enter) =>
              enter
                .transition()
                .duration(500)
                .attr("stroke-opacity", (d) => {
                  const sNode = nodeByIdRef.current.get(getNodeId(d.source));
                  const tNode = nodeByIdRef.current.get(getNodeId(d.target));
                  return (sNode && tNode && sNode.sector !== tNode.sector) ? 0.6 : 0.4;
                })
                .attr("stroke-dasharray", null)
            ),
        (update) =>
          update
            .attr("stroke", (d) => {
              const sNode = nodeByIdRef.current.get(getNodeId(d.source));
              const tNode = nodeByIdRef.current.get(getNodeId(d.target));
              return (sNode && tNode && sNode.sector !== tNode.sector) ? "#008080" : "#B0ACA4";
            })
            .attr("stroke-width", (d) => {
              const sNode = nodeByIdRef.current.get(getNodeId(d.source));
              const tNode = nodeByIdRef.current.get(getNodeId(d.target));
              return (sNode && tNode && sNode.sector !== tNode.sector) ? 2.5 : 1.5;
            })
            .attr("stroke-opacity", (d) => {
              const sNode = nodeByIdRef.current.get(getNodeId(d.source));
              const tNode = nodeByIdRef.current.get(getNodeId(d.target));
              return (sNode && tNode && sNode.sector !== tNode.sector) ? 0.6 : 0.4;
            })
            .attr("stroke-linecap", "round"),
        (exit) => exit.interrupt().remove()
      );

    const nodes = nodeGroupRef.current
      .selectAll("circle")
      .data(nextNodes, (d) => d.id)
      .join(
        (enter) => {

          // This was glowless and flat
          // const enteredNodes = enter
          //   .append("circle")
          //   .attr("cx", (d) => getSafeNumber(d.x, width / 2))
          //   .attr("cy", (d) => getSafeNumber(d.y, height / 2))
          //   .attr("r", 0)
          //   .attr("fill", getNodeColor)
          //   .attr("stroke", "rgba(255,255,255,0.15)")
          //   .attr("stroke-width", 1.5)
          //-----------------------------------------
          // Add radial gradient defs per node
          const defs = d3.select(svgRef.current).select("defs").empty()
            ? d3.select(svgRef.current).append("defs")
            : d3.select(svgRef.current).select("defs");

          enter.each(function(d) {
            const color = getNodeColor(d);
            const gradId = `node-grad-${d.id.replace(/[^a-zA-Z0-9]/g, "")}`;
            
            if (defs.select(`#${gradId}`).empty()) {
              const grad = defs.append("radialGradient")
                .attr("id", gradId)
                .attr("cx", "35%")
                .attr("cy", "35%")
                .attr("r", "65%");
              grad.append("stop").attr("offset", "0%").attr("stop-color", d3.color(color).brighter(0.8));
              grad.append("stop").attr("offset", "100%").attr("stop-color", color);
            }
          });

          const enteredNodes = enter
            .append("circle")
            .attr("cx", (d) => getSafeNumber(d.x, width / 2))
            .attr("cy", (d) => getSafeNumber(d.y, height / 2))
            .attr("r", 0)
            .attr("fill", (d) => {
              const gradId = `node-grad-${d.id.replace(/[^a-zA-Z0-9]/g, "")}`;
              return `url(#${gradId})`;
            })
            .attr("stroke", (d) => {
              const color = getNodeColor(d);
              return d3.color(color).brighter(0.3).formatHex();
            })
            .attr("stroke-width", 2)
            .attr("stroke-opacity", 0.4)
            .style("filter", (d) => {
              const color = getNodeColor(d);
              return `drop-shadow(0 0 6px ${color}66)`;
            })
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
            .attr("r", (d) => getNodeRadius(d));

          return enteredNodes;
        },
        // (update) =>
        //   update.call((update) =>
        //     update
        //       .transition()
        //       .duration(1000)
        //       .attr("fill", getNodeColor)
        //       .transition()
        //       .duration(300)
        //       .attr("r", (d) => 4 + d.connectionCount * 0.9)
        //   ),
        (update) =>
          update.call((sel) => {
            sel.each(function(d) {
              const color = getNodeColor(d);
              const gradId = `node-grad-${d.id.replace(/[^a-zA-Z0-9]/g, "")}`;
              const defs = d3.select(svgRef.current).select("defs");
              defs.select(`#${gradId}`).remove();
              const grad = defs.append("radialGradient")
                .attr("id", gradId)
                .attr("cx", "35%").attr("cy", "35%").attr("r", "65%");
              grad.append("stop").attr("offset", "0%").attr("stop-color", d3.color(color).brighter(0.8));
              grad.append("stop").attr("offset", "100%").attr("stop-color", color);
            });

            sel
              .transition()
              .duration(1000)
              .attr("fill", (d) => `url(#node-grad-${d.id.replace(/[^a-zA-Z0-9]/g, "")})`)
              .attr("stroke", (d) => d3.color(getNodeColor(d)).brighter(0.3).formatHex())
              .style("filter", (d) => `drop-shadow(0 0 6px ${getNodeColor(d)}66)`)
              .transition()
              .duration(300)
              .attr("r", (d) => getNodeRadius(d));
          }),
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

    // const labels = labelGroupRef.current
    //   .selectAll("text")
    //   .data(nextNodes, (d) => d.id)
    //   .join(
    //     (enter) =>
    //       enter
    //         .append("text")
    //         // if (!DEVELOPER_MODE) {
    //         // .text((d) => d.name?.split(" ")[0] || "")
    //         // } else {
    //         //   .text((d) => d.name || "")
    //         // }
    //         .text((d) => !DEVELOPER_MODE? d.name?.split(" ")[0] || "": d.name || "")
    //         .attr("x", (d) => getSafeNumber(d.x, width / 2) + getNodeRadius(d) + 5)
    //         .attr("y", (d) => getSafeNumber(d.y, height / 2) + 3)
    //         .attr("font-size", 16)
    //         .attr("font-weight", 500)
    //         .attr("fill", "#2A2826")
    //         .attr("paint-order", null)
    //         .attr("stroke", null)
    //         .attr("stroke-width", null)
    //         .style("filter", "drop-shadow(0 1px 2px rgba(255,255,255,0.8))")
    //         .style("font-family", "'Inter', 'SF Pro Display', system-ui, sans-serif")
    //         .style("letter-spacing", "0.01em")
    //         .attr("opacity", 0)
    //         .style("pointer-events", "none")
    //         .call((enter) =>
    //           enter
    //             .transition()
    //             .duration(400)
    //             .attr("opacity", showNames ? 1 : 0)
    //         ),
    //     (update) =>
    //       update
    //         .text((d) => !DEVELOPER_MODE? d.name?.split(" ")[0] || "": d.name || "")
    //         .attr("opacity", showNames ? 1 : 0),
    //     (exit) =>
    //       exit
    //         .transition()
    //         .duration(300)
    //         .attr("opacity", 0)
    //         .remove()
    //   );

    const labels = labelGroupRef.current
      .selectAll("g.node-label")
      .data(nextNodes, (d) => d.id)
      .join(
        (enter) => {
          const g = enter
            .append("g")
            .attr("class", "node-label")
            .attr("transform", (d) => {
              const x = getSafeNumber(d.x, width / 2) + getNodeRadius(d) + 5;
              const y = getSafeNumber(d.y, height / 2);
              return `translate(${x},${y})`;
            })
            .attr("opacity", 0)
            .style("pointer-events", "none");

          g.append("text")
            .attr("class", "label-name")
            .text((d) => !DEVELOPER_MODE ? d.name?.split(" ")[0] || "" : d.name || "")
            .attr("y", 0)
            .attr("font-size", 15)
            .attr("font-weight", 600)
            .attr("fill", "#2A2826")
            .style("filter", "drop-shadow(0 1px 2px rgba(255,255,255,0.8))")
            .style("font-family", "'Inter', 'SF Pro Display', system-ui, sans-serif");

          g.append("text")
            .attr("class", "label-sub")
            .text((d) => {
              if (revealRoles && d.role) return `${d.role} · ${(d.sector || "").replace(/_/g, " ")}`;
              return (d.sector || "").replace(/_/g, " ");
            })
            .attr("y", 14)
            .attr("font-size", 10)
            .attr("font-weight", 500)
            .attr("fill", (d) => {
              if (revealRoles && d.role) return roleColors[d.role] || "#888780";
              const sectorKey = (d.sector || "industry").toLowerCase().replace(/\s+/g, "_");
              return sectorColors[sectorKey] || "#888780";
            })
            .style("font-family", "'Inter', 'SF Pro Display', system-ui, sans-serif")
            .style("letter-spacing", "0.04em")
            .style("text-transform", "capitalize")
            .attr("opacity", showNames ? 1 : 0);

          g.transition()
            .duration(400)
            .attr("opacity", 1);

          return g;
        },
        (update) => {
          update.select(".label-name")
            .text((d) => !DEVELOPER_MODE ? d.name?.split(" ")[0] || "" : d.name || "");

          update.select(".label-sub")
            .text((d) => {
              if (revealRoles && d.role) return `${d.role} · ${(d.sector || "").replace(/_/g, " ")}`;
              return (d.sector || "").replace(/_/g, " ");
            })
            .attr("fill", (d) => {
              if (revealRoles && d.role) return roleColors[d.role] || "#888780";
              const sectorKey = (d.sector || "industry").toLowerCase().replace(/\s+/g, "_");
              return sectorColors[sectorKey] || "#888780";
            })
            .attr("opacity", showNames ? 1 : 0);

          update.attr("opacity", 1);

          return update;
        },
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
        .attr("r", (d) => getNodeRadius(d) + 6)
        .transition()
        .duration(420)
        .attr("r", (d) => getNodeRadius(d));

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