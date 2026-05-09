import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import NetworkGraph from "../components/graph/NetworkGraph";
import { TABLE_NAME } from "../data/config";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

const CONNECTIONS_TABLE = "connections";

const SECTOR_COLORS = {
  tech: "#378ADD",
  finance: "#7F77DD",
  health: "#1D9E75",
  energy: "#EF9F27",
  public_sector: "#D85A30",
  other: "#888780",
};

// Role colours as specified in the design doc (Section 7)
const ROLE_COLORS = {
  Anchor: "#EF9F27",
  Connector: "#1D9E75",
  Explorer: "#7F77DD",
  Catalyst: "#D85A30",
  Builder: "#378ADD",
};

/**
 * Pure function — computes a role for every attendee from the raw DB rows.
 * Called once on button press, not on every render.
 */
function computeRoles(attendees, connections) {
  const attendeeById = new Map(attendees.map((a) => [a.id, a]));

  const stats = new Map();

  attendees.forEach((attendee) => {
    stats.set(attendee.id, {
      id: attendee.id,
      connectionCount: 0,
      crossSectorCount: 0,
      sectorsReached: new Set(),
    });
  });

  connections.forEach((connection) => {
    const a = attendeeById.get(connection.scanner_id);
    const b = attendeeById.get(connection.scanned_id);
    if (!a || !b) return;

    const aStats = stats.get(a.id);
    const bStats = stats.get(b.id);
    if (!aStats || !bStats) return;

    aStats.connectionCount += 1;
    bStats.connectionCount += 1;

    aStats.sectorsReached.add(b.sector);
    bStats.sectorsReached.add(a.sector);

    if (a.sector !== b.sector) {
      aStats.crossSectorCount += 1;
      bStats.crossSectorCount += 1;
    }
  });

  const ranked = [...stats.values()].sort(
    (a, b) => b.connectionCount - a.connectionCount
  );

  const top15Count = Math.max(1, Math.ceil(ranked.length * 0.15));
  const top30Count = Math.max(1, Math.ceil(ranked.length * 0.3));

  const anchorIds = new Set(ranked.slice(0, top15Count).map((s) => s.id));
  const catalystIds = new Set(ranked.slice(0, top30Count).map((s) => s.id));

  const result = new Map();

  ranked.forEach((stat) => {
    const crossSectorRatio =
      stat.connectionCount === 0
        ? 0
        : stat.crossSectorCount / stat.connectionCount;

    if (anchorIds.has(stat.id)) {
      result.set(stat.id, "Anchor");
    } else if (crossSectorRatio >= 0.3 && stat.connectionCount >= 3) {
      result.set(stat.id, "Connector");
    } else if (stat.sectorsReached.size >= 3 && crossSectorRatio > 0.5) {
      result.set(stat.id, "Explorer");
    } else if (catalystIds.has(stat.id)) {
      result.set(stat.id, "Catalyst");
    } else {
      result.set(stat.id, "Builder");
    }
  });

  return result;
}

function ScreenPage() {
  const [attendees, setAttendees] = useState([]);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [showNames, setShowNames] = useState(true);
  const [revealRoles, setRevealRoles] = useState(false);
  const [layoutVersion, setLayoutVersion] = useState(0);
  const [isGraphFullscreen, setIsGraphFullscreen] = useState(false);

  // Roles are computed on demand (button press) and stored here.
  // null means "not yet computed"; recomputed fresh each time reveal is toggled on.
  const [computedRoleById, setComputedRoleById] = useState(null);

  // Keep a stable ref to the latest attendees/connections for the reveal callback
  // so it always uses live data without stale closures.
  const attendeesRef = useRef(attendees);
  const connectionsRef = useRef(connections);

  useEffect(() => {
    attendeesRef.current = attendees;
  }, [attendees]);

  useEffect(() => {
    connectionsRef.current = connections;
  }, [connections]);

  useEffect(() => {
    let isMounted = true;

    async function loadGraphData() {
      setLoading(true);
      setErrorMessage("");

      const [
        { data: attendeesData, error: attendeesError },
        { data: connectionsData, error: connectionsError },
      ] = await Promise.all([
        supabase.from(TABLE_NAME).select("*"),
        supabase
          .from(CONNECTIONS_TABLE)
          .select("*")
          .order("created_at", { ascending: true }),
      ]);

      if (!isMounted) return;

      if (attendeesError || connectionsError) {
        console.error(
          "Error loading screen data:",
          attendeesError || connectionsError
        );
        setErrorMessage("Could not load the live network.");
        setLoading(false);
        return;
      }

      setAttendees(attendeesData || []);
      setConnections(connectionsData || []);
      setLoading(false);
    }

    loadGraphData();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("screen-connections-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: CONNECTIONS_TABLE,
        },
        (payload) => {
          const newConnection = payload.new;

          setConnections((currentConnections) => {
            const alreadyExists = currentConnections.some(
              (connection) => connection.id === newConnection.id
            );

            if (alreadyExists) return currentConnections;

            return [...currentConnections, newConnection];
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: CONNECTIONS_TABLE,
        },
        (payload) => {
          const deletedConnection = payload.old;

          setConnections((currentConnections) =>
            currentConnections.filter(
              (connection) => connection.id !== deletedConnection.id
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const attendeeById = useMemo(() => {
    return new Map(attendees.map((attendee) => [attendee.id, attendee]));
  }, [attendees]);

  const visibleAttendees = useMemo(() => {
    const connectedAttendeeIds = new Set();

    connections.forEach((connection) => {
      if (connection.scanner_id)
        connectedAttendeeIds.add(connection.scanner_id);
      if (connection.scanned_id)
        connectedAttendeeIds.add(connection.scanned_id);
    });

    return attendees.filter((attendee) =>
      connectedAttendeeIds.has(attendee.id)
    );
  }, [attendees, connections]);

  const visibleConnections = useMemo(() => {
    const visibleAttendeeIds = new Set(
      visibleAttendees.map((attendee) => attendee.id)
    );

    return connections.filter(
      (connection) =>
        visibleAttendeeIds.has(connection.scanner_id) &&
        visibleAttendeeIds.has(connection.scanned_id)
    );
  }, [connections, visibleAttendees]);

  /**
   * Toggle reveal: on → query the DB fresh, compute roles, update state.
   * off → clear computed roles so they reset cleanly.
   */
  async function handleRevealRoles() {
    if (revealRoles) {
      // Toggling off — go back to sector view
      setRevealRoles(false);
      setComputedRoleById(null);
      return;
    }

    // Fetch the freshest snapshot directly from the DB
    const [
      { data: freshAttendees, error: attendeesError },
      { data: freshConnections, error: connectionsError },
    ] = await Promise.all([
      supabase.from(TABLE_NAME).select("*"),
      supabase
        .from(CONNECTIONS_TABLE)
        .select("*")
        .order("created_at", { ascending: true }),
    ]);

    if (attendeesError || connectionsError) {
      console.error(
        "Error fetching roles:",
        attendeesError || connectionsError
      );
      return;
    }

    const roleMap = computeRoles(
      freshAttendees || [],
      freshConnections || []
    );

    setComputedRoleById(roleMap);
    setRevealRoles(true);
  }

  /**
   * When roles are revealed, attach the computed role to each visible attendee.
   * When not revealed, role field is omitted so the graph falls back to sector colour.
   */
  const graphAttendees = useMemo(() => {
    return visibleAttendees.map((attendee) => ({
      ...attendee,
      role:
        revealRoles && computedRoleById
          ? computedRoleById.get(attendee.id) || "Builder"
          : undefined,
    }));
  }, [visibleAttendees, revealRoles, computedRoleById]);

  const crossSectorCount = useMemo(() => {
    return visibleConnections.filter((connection) => {
      const scanner = attendeeById.get(connection.scanner_id);
      const scanned = attendeeById.get(connection.scanned_id);

      return scanner && scanned && scanner.sector !== scanned.sector;
    }).length;
  }, [visibleConnections, attendeeById]);

  const clustersFormedCount = useMemo(() => {
    const visibleIds = new Set(visibleAttendees.map((attendee) => attendee.id));
    const adjacency = new Map();

    visibleIds.forEach((id) => adjacency.set(id, []));

    visibleConnections.forEach((connection) => {
      const a = connection.scanner_id;
      const b = connection.scanned_id;

      if (!visibleIds.has(a) || !visibleIds.has(b)) return;

      adjacency.get(a).push(b);
      adjacency.get(b).push(a);
    });

    const visited = new Set();
    let clusters = 0;

    visibleIds.forEach((id) => {
      if (visited.has(id)) return;

      clusters += 1;
      const stack = [id];
      visited.add(id);

      while (stack.length > 0) {
        const current = stack.pop();

        adjacency.get(current).forEach((neighbor) => {
          if (!visited.has(neighbor)) {
            visited.add(neighbor);
            stack.push(neighbor);
          }
        });
      }
    });

    return clusters;
  }, [visibleAttendees, visibleConnections]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0e0e0c] text-white flex items-center justify-center">
        <p className="text-white/70 tracking-wide">Loading live network...</p>
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main className="min-h-screen bg-[#0e0e0c] text-white flex items-center justify-center p-6">
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-6 py-4">
          <p className="text-red-200">{errorMessage}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f7f5] text-[#1f1f1d] flex flex-col">
      <section
        className={
          isGraphFullscreen
            ? "fixed inset-0 z-50 bg-[#f7f7f5] p-4"
            : "relative flex-1 min-h-[440px] px-6 pt-4"
        }
      >
        <button
          className="absolute right-6 top-6 z-10 rounded-lg border border-[#d8d8d2] bg-white px-4 py-2 text-sm shadow-sm"
          onClick={() => setIsGraphFullscreen((value) => !value)}
        >
          {isGraphFullscreen ? "Exit fullscreen" : "Fullscreen"}
        </button>

        <NetworkGraph
          attendees={graphAttendees}
          connections={visibleConnections}
          showNames={showNames}
          revealRoles={revealRoles}
          layoutVersion={layoutVersion}
          sectorColors={SECTOR_COLORS}
          roleColors={ROLE_COLORS}
        />
      </section>

      {!isGraphFullscreen && (
        <footer className="px-6 pb-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex gap-2">
              <button
                className="rounded-lg border border-[#d8d8d2] bg-white px-4 py-2 text-sm shadow-sm"
                onClick={() => setShowNames((value) => !value)}
              >
                Add connections ↗
              </button>

              <button
                className="rounded-lg border border-[#d8d8d2] bg-white px-4 py-2 text-sm shadow-sm"
                onClick={handleRevealRoles}
              >
                {revealRoles ? "Show sectors ↗" : "Reveal roles ↗"}
              </button>

              <button
                className="rounded-lg border border-[#d8d8d2] bg-white px-4 py-2 text-sm shadow-sm"
                onClick={() => setLayoutVersion((value) => value + 1)}
              >
                Reset
              </button>
            </div>

            <p className="text-sm text-[#4f4f4a]">
              {visibleAttendees.length} attendees ·{" "}
              {visibleConnections.length} connections
            </p>
          </div>

          <div className="grid grid-cols-4 gap-2 mb-3">
            <Stat label="Attendees" value={visibleAttendees.length} />
            <Stat label="Connections" value={visibleConnections.length} />
            <Stat label="Cross-sector" value={crossSectorCount} />
            <Stat label="Clusters formed" value={clustersFormedCount} />
          </div>

          <div className="space-y-3">
            {revealRoles ? (
              <div className="flex flex-wrap items-center gap-4 text-xs text-[#4f4f4a]">
                {Object.entries(ROLE_COLORS).map(([role, color]) => (
                  <LegendDot key={role} color={color} label={role} />
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-4 text-xs text-[#4f4f4a]">
                <LegendDot color={SECTOR_COLORS.tech} label="Tech" />
                <LegendDot color={SECTOR_COLORS.finance} label="Finance" />
                <LegendDot color={SECTOR_COLORS.health} label="Health" />
                <LegendDot color={SECTOR_COLORS.energy} label="Energy" />
                <LegendDot
                  color={SECTOR_COLORS.public_sector}
                  label="Public sector"
                />
                <LegendDot color={SECTOR_COLORS.other} label="Other" />
              </div>
            )}
          </div>
        </footer>
      )}
    </main>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl bg-[#efeee9] px-4 py-3 text-center">
      <div className="text-xl font-bold tabular-nums">{value}</div>
      <div className="text-xs text-[#3f3f3a]">{label}</div>
    </div>
  );
}

function LegendDot({ color, label }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className="h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span>{label}</span>
    </div>
  );
}

export default ScreenPage;