import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import NetworkGraph from "../components/graph/NetworkGraph";
import {
  TABLE_NAME,
  DEFAULT_SECTOR_COLORS_NL,
  DEFAULT_SECTOR_COLORS,
  SECTOR_CONFIG_NL,
  SECTOR_CONFIG_EN
} from "../data/config";
import { useParams } from "react-router-dom";
import { computeRoleStats, mergeStatsWithAttendees } from "../utils/roleUtils";
import { getTranslations, normalizeLanguage } from "../data/config";


const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

const CONNECTIONS_TABLE = "connections";

const SECTOR_COLORS = DEFAULT_SECTOR_COLORS;
const SECTOR_CONFIG = SECTOR_CONFIG_EN;



const SECTOR_LEGEND_ITEMS = Object.entries(SECTOR_CONFIG).map(
  ([key, config]) => ({
    key,
    label: config.label,
    color: config.color,
  })
);

function ScreenPage() {
  const [attendees, setAttendees] = useState([]);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [showNames, setShowNames] = useState(true);
  const [revealRoles, setRevealRoles] = useState(false);
  const [layoutVersion, setLayoutVersion] = useState(0);
  const [isGraphFullscreen, setIsGraphFullscreen] = useState(false);
  const [computedRoleById, setComputedRoleById] = useState(null);


  const { lang } = useParams();

  const language = normalizeLanguage(lang);
  const t = getTranslations(language).screenPage;

  const ROLE_COLORS = {
    Anchor: "#EF9F27",
    Connector: "#1D9E75",
    Explorer: "#7F77DD",
    Catalyst: "#D85A30",
    Builder: "#378ADD",
  };

  const ROLE_COLORS_NL =
  {
    Anker: "#EF9F27",
    Connector: "#1D9E75",
    Verkenner: "#7F77DD",
    Katalysator: "#D85A30",
    Bouwer: "#378ADD"
  }

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
        { event: "INSERT", schema: "public", table: CONNECTIONS_TABLE },
        (payload) => {
          const newConnection = payload.new;

          setConnections((current) => {
            if (current.some((connection) => connection.id === newConnection.id)) {
              return current;
            }

            return [...current, newConnection];
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: CONNECTIONS_TABLE },
        (payload) => {
          setConnections((current) =>
            current.filter((connection) => connection.id !== payload.old.id)
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
    const connectedIds = new Set();

    connections.forEach((connection) => {
      if (connection.scanner_id) connectedIds.add(connection.scanner_id);
      if (connection.scanned_id) connectedIds.add(connection.scanned_id);
    });

    return attendees.filter((attendee) => connectedIds.has(attendee.id));
  }, [attendees, connections]);

  const visibleConnections = useMemo(() => {
    const visibleIds = new Set(
      visibleAttendees.map((attendee) => attendee.id)
    );

    return connections.filter(
      (connection) =>
        visibleIds.has(connection.scanner_id) &&
        visibleIds.has(connection.scanned_id)
    );
  }, [connections, visibleAttendees]);

  async function handleRevealRoles() {
    if (revealRoles) {
      setRevealRoles(false);
      setComputedRoleById(null);
      return;
    }

    const [
      { data: statsData, error: statsError },
      { data: attendeesData, error: attendeesError },
    ] = await Promise.all([
      supabase
        .from("attendee_stats")
        .select("*")
        .order("total_connections", { ascending: false }),
      supabase.from(TABLE_NAME).select("*"),
    ]);

    if (statsError || attendeesError) {
      console.error("Error fetching roles:", statsError || attendeesError);
      return;
    }

    const merged = mergeStatsWithAttendees(statsData || [], attendeesData || []);
    const withRoles = computeRoleStats(merged);
    const roleMap = new Map(withRoles.map((stat) => [stat.id, stat.role]));

    setComputedRoleById(roleMap);
    setRevealRoles(true);
  }

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
    const visibleIds = new Set(
      visibleAttendees.map((attendee) => attendee.id)
    );

    const adjacency = new Map();
    visibleIds.forEach((id) => adjacency.set(id, []));

    visibleConnections.forEach((connection) => {
      if (
        !visibleIds.has(connection.scanner_id) ||
        !visibleIds.has(connection.scanned_id)
      ) {
        return;
      }

      adjacency.get(connection.scanner_id).push(connection.scanned_id);
      adjacency.get(connection.scanned_id).push(connection.scanner_id);
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
    <main className="min-h-screen bg-[#FAFAF8] text-[#1A1917] flex flex-col">
      <section
        className={
          isGraphFullscreen
            ? "fixed inset-0 z-50 bg-[#FAFAF8] p-4"
            : "relative flex-1 min-h-[440px] px-6 pt-4"
        }
      >
        <button
          className="absolute right-6 top-6 z-10 rounded-xl border border-black/[0.06] bg-white/90 backdrop-blur-sm px-5 py-2.5 text-sm font-medium text-[#3A3630] shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:bg-white transition-colors"
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
          sectorConfig={SECTOR_CONFIG}
          roleColors={ROLE_COLORS}
        />

        {isGraphFullscreen && (
          <div className="absolute bottom-6 left-6 z-10 flex items-center gap-5 rounded-2xl bg-white/80 backdrop-blur-sm border border-black/[0.04] px-5 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
            {revealRoles
              ? Object.entries(language ==="nl"?ROLE_COLORS_NL:ROLE_COLORS).map(([role, color]) => (
                <LegendDot key={role} color={color} label={role} />
              ))
              : SECTOR_LEGEND_ITEMS.map((sector) => (
                <LegendDot
                  key={sector.key}
                  color={sector.color}
                  label={sector.label}
                />
              ))}
          </div>
        )}
      </section>

      {!isGraphFullscreen && (
        <footer className="px-6 pb-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex gap-2">
              <button
                className="rounded-xl border border-black/[0.06] bg-white/90 backdrop-blur-sm px-5 py-2.5 text-sm font-medium text-[#3A3630] shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:bg-white transition-colors"
                onClick={() => setShowNames((value) => !value)}
              >
                {t.toggle}
              </button>

              <button
                className="rounded-xl border border-[#008080]/20 bg-[#008080]/[0.06] backdrop-blur-sm px-5 py-2.5 text-sm font-medium text-[#008080] shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:bg-[#008080]/10 transition-colors"
                onClick={handleRevealRoles}
              >
                {revealRoles ? t.showSectors : t.revealRoles}
              </button>

              <button
                className="rounded-xl border border-black/[0.06] bg-white/90 backdrop-blur-sm px-5 py-2.5 text-sm font-medium text-[#3A3630] shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:bg-white transition-colors"
                onClick={() => setLayoutVersion((value) => value + 1)}
              >
                {t.reset}
              </button>
            </div>

            <p className="text-sm text-[#4f4f4a]">
              {visibleAttendees.length} {t.attendees} ·{" "}
              {visibleConnections.length} {t.connections}
            </p>
          </div>

          <div className="grid grid-cols-4 gap-2 mb-3">
            <Stat label={t.attendees} value={visibleAttendees.length} />
            <Stat label={t.connections} value={visibleConnections.length} />
            <Stat label={t.crossSector} value={crossSectorCount} />
            <Stat label={t.clustersFormed} value={clustersFormedCount} />
          </div>

          <div className="space-y-3">
            {revealRoles ? (
              <div className="flex flex-wrap items-center gap-4 text-xs text-[#4f4f4a]">
                {Object.entries(language==="nl"?ROLE_COLORS_NL:ROLE_COLORS).map(([role, color]) => (
                  <LegendDot key={role} color={color} label={role} />
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-4 text-xs text-[#4f4f4a]">
                {SECTOR_LEGEND_ITEMS.map((sector) => (
                  <LegendDot
                    key={sector.key}
                    color={sector.color}
                    label={sector.label}
                  />
                ))}
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
    <div className="rounded-2xl bg-white/80 backdrop-blur-sm border border-black/[0.04] px-5 py-4 text-center shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="text-2xl font-bold tabular-nums text-[#1A1917]">
        {value}
      </div>
      <div className="text-[11px] font-medium text-[#9A958D] uppercase tracking-wider mt-1">
        {label}
      </div>
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