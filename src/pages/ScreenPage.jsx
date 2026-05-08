import { useEffect, useMemo, useState } from "react";
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

function ScreenPage() {
  const [attendees, setAttendees] = useState([]);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [showNames, setShowNames] = useState(true);
  const [revealRoles, setRevealRoles] = useState(false);
  const [layoutVersion, setLayoutVersion] = useState(0);

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
        console.error("Error loading screen data:", attendeesError || connectionsError);
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
      if (connection.scanner_id) connectedAttendeeIds.add(connection.scanner_id);
      if (connection.scanned_id) connectedAttendeeIds.add(connection.scanned_id);
    });

    return attendees.filter((attendee) => connectedAttendeeIds.has(attendee.id));
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

  const crossSectorCount = useMemo(() => {
    return visibleConnections.filter((connection) => {
      const scanner = attendeeById.get(connection.scanner_id);
      const scanned = attendeeById.get(connection.scanned_id);

      return scanner && scanned && scanner.sector !== scanned.sector;
    }).length;
  }, [visibleConnections, attendeeById]);

  const anbiPool = Math.min(visibleConnections.length, 250);

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
    <main className="min-h-screen bg-[#0e0e0c] text-white flex flex-col">
      <header className="flex items-center justify-between border-b border-white/10 px-8 py-5">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Building Ecosystems
          </h1>
          <p className="text-sm uppercase tracking-[0.32em] text-white/50">
            Live network · CCS x NLMTD
          </p>
        </div>

        <div className="grid grid-cols-4 gap-3 text-right">
          <Stat label="Attendees" value={visibleAttendees.length} />
          <Stat label="Connections" value={visibleConnections.length} />
          <Stat label="Cross-sector" value={crossSectorCount} />
          <Stat label="ANBI pool" value={`€${anbiPool}`} />
        </div>
      </header>

      <section className="relative flex-1 min-h-0">
        <NetworkGraph
          attendees={visibleAttendees}
          connections={visibleConnections}
          showNames={showNames}
          revealRoles={revealRoles}
          layoutVersion={layoutVersion}
          sectorColors={SECTOR_COLORS}
        />
      </section>

    </main>
  );
}

function Stat({ label, value }) {
  return (
    <div className="min-w-28 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
      <div className="text-2xl font-semibold tabular-nums">{value}</div>
      <div className="text-xs uppercase tracking-[0.22em] text-white/45">
        {label}
      </div>
    </div>
  );
}

export default ScreenPage;