import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import NetworkGraph from "../components/graph/NetworkGraph";
import { TABLE_NAME } from "../data/config";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

const CONNECTIONS_TABLE = "connections";

function ScreenPage() {
  const [attendees, setAttendees] = useState([]);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

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

      if (attendeesError) {
        console.error("Error loading attendees:", attendeesError);
        setErrorMessage("Could not load attendees.");
        setLoading(false);
        return;
      }

      if (connectionsError) {
        console.error("Error loading connections:", connectionsError);
        setErrorMessage("Could not load connections.");
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
      .subscribe((status) => {
        console.log("Connections realtime status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const visibleAttendees = useMemo(() => {
    const connectedAttendeeIds = new Set();

    connections.forEach((connection) => {
      if (connection.scanner_id) {
        connectedAttendeeIds.add(connection.scanner_id);
      }

      if (connection.scanned_id) {
        connectedAttendeeIds.add(connection.scanned_id);
      }
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

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0e0e0c] p-6 text-white flex items-center justify-center">
        <p className="text-white/70">Loading network graph...</p>
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main className="min-h-screen bg-[#0e0e0c] p-6 text-white flex items-center justify-center">
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-6 py-4">
          <p className="text-red-200">{errorMessage}</p>
        </div>
      </main>
    );
  }

  return (
    <NetworkGraph
      attendees={visibleAttendees}
      connections={visibleConnections}
    />
  );
}

export default ScreenPage;