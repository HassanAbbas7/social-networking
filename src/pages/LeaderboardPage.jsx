import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { TABLE_NAME } from "../data/config";
import { computeAttendeeStats, computeRoles } from "../utils/roleUtils";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

const CONNECTIONS_TABLE = "connections";
const MAX_RANKS = 3;

const DONATION_PER_CONNECTION = Number(
  import.meta.env.VITE_ANBI_EURO_PER_CONNECTION || 50
);

const ROLE_DEFINITIONS = [
  {
    key: "anchor",
    roleName: "Anchor",
    name: "Anchor",
    subtitle: "Most connected",
    color: "#EF9F27",
    scoreKey: "connectionCount",
  },
  {
    key: "connector",
    roleName: "Connector",
    name: "Connector",
    subtitle: "Cross-sector bridges",
    color: "#1D9E75",
    scoreKey: "crossSectorCount",
  },
  {
    key: "explorer",
    roleName: "Explorer",
    name: "Explorer",
    subtitle: "Sectors reached",
    color: "#7F77DD",
    scoreKey: "sectorsReachedCount",
  },
  {
    key: "catalyst",
    roleName: "Catalyst",
    name: "Catalyst",
    subtitle: "Fastest networker",
    color: "#D85A30",
    scoreKey: "connectionCount",
  },
  {
    key: "builder",
    roleName: "Builder",
    name: "Builder",
    subtitle: "Mutual connections",
    color: "#378ADD",
    scoreKey: "mutualConnectionCount",
  },
];

const RANK_THEMES = {
  0: {
    label: "1ST",
    bg: "#D4A73A",
    text: "#1A1400",
    glow: "rgba(212, 167, 58, 0.4)",
    rankColor: "#D4A73A",
  },
  1: {
    label: "2ND",
    bg: "#A8ACAF",
    text: "#1A1A1A",
    glow: "rgba(168, 172, 175, 0.3)",
    rankColor: "#A8ACAF",
  },
  2: {
    label: "3RD",
    bg: "#C0825A",
    text: "#1A1000",
    glow: "rgba(192, 130, 90, 0.3)",
    rankColor: "#C0825A",
  },
};

function getDisplayName(attendee) {
  return (
    attendee.name ||
    attendee.full_name ||
    [attendee.first_name, attendee.last_name].filter(Boolean).join(" ") ||
    attendee.email ||
    "Unknown attendee"
  );
}

function getCompany(attendee) {
  return (
    attendee.company ||
    attendee.organization ||
    attendee.organisation ||
    attendee.company_name ||
    attendee.sector ||
    "—"
  );
}

function getVisibleAttendees(attendees, connections) {
  const connectedIds = new Set();

  connections.forEach((connection) => {
    if (connection.scanner_id) connectedIds.add(connection.scanner_id);
    if (connection.scanned_id) connectedIds.add(connection.scanned_id);
  });

  return attendees.filter((attendee) => connectedIds.has(attendee.id));
}

function getVisibleConnections(visibleAttendees, connections) {
  const visibleIds = new Set(visibleAttendees.map((attendee) => attendee.id));

  return connections.filter(
    (connection) =>
      visibleIds.has(connection.scanner_id) &&
      visibleIds.has(connection.scanned_id)
  );
}

function makeLeaderboardRoles(attendees, connections) {
  const visibleAttendees = getVisibleAttendees(attendees, connections);
  const visibleConnections = getVisibleConnections(visibleAttendees, connections);

  const roleById = computeRoles(visibleAttendees, visibleConnections);

  const stats = computeAttendeeStats(visibleAttendees, visibleConnections).map(
    (stat) => ({
      ...stat,
      role: roleById.get(stat.id) || "Builder",
    })
  );

  return ROLE_DEFINITIONS.map((roleDef) => {
    const entries = stats
      .filter(
        (stat) =>
          stat.role === roleDef.roleName &&
          Number(stat.connectionCount || 0) > 0
      )
      .sort((a, b) => {
        const diff =
          Number(b[roleDef.scoreKey] || 0) -
          Number(a[roleDef.scoreKey] || 0);

        if (diff !== 0) return diff;

        return Number(b.connectionCount || 0) - Number(a.connectionCount || 0);
      })
      .slice(0, MAX_RANKS)
      .map((stat) => ({
        id: stat.id,
        name: getDisplayName(stat.attendee),
        company: getCompany(stat.attendee),
        score: stat[roleDef.scoreKey],
      }));

    return {
      ...roleDef,
      entries,
    };
  });
}

function formatScore(value) {
  return Math.round(Number(value || 0));
}

function formatEuro(value) {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function PulseDot() {
  return (
    <div style={{ position: "relative", width: 12, height: 12, flexShrink: 0 }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background: "#1D9E75",
          animation: "pulse 2s ease-in-out infinite",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 2,
          borderRadius: "50%",
          background: "#1D9E75",
        }}
      />
    </div>
  );
}

export default function Leaderboard() {
  const [attendees, setAttendees] = useState([]);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadLeaderboardData() {
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

    if (attendeesError || connectionsError) {
      console.error(
        "Error loading leaderboard data:",
        attendeesError || connectionsError
      );
      setErrorMessage("Could not load the live leaderboard.");
      setLoading(false);
      return;
    }

    setAttendees(attendeesData || []);
    setConnections(connectionsData || []);
    setLoading(false);
  }

  useEffect(() => {
    let isMounted = true;

    async function init() {
      if (!isMounted) return;
      await loadLeaderboardData();
    }

    init();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("leaderboard-live-data")
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
        { event: "UPDATE", schema: "public", table: CONNECTIONS_TABLE },
        (payload) => {
          setConnections((current) =>
            current.map((connection) =>
              connection.id === payload.new.id ? payload.new : connection
            )
          );
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
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: TABLE_NAME },
        (payload) => {
          const newAttendee = payload.new;

          setAttendees((current) => {
            if (current.some((attendee) => attendee.id === newAttendee.id)) {
              return current;
            }

            return [...current, newAttendee];
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: TABLE_NAME },
        (payload) => {
          setAttendees((current) =>
            current.map((attendee) =>
              attendee.id === payload.new.id ? payload.new : attendee
            )
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: TABLE_NAME },
        (payload) => {
          setAttendees((current) =>
            current.filter((attendee) => attendee.id !== payload.old.id)
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const visibleAttendees = useMemo(
    () => getVisibleAttendees(attendees, connections),
    [attendees, connections]
  );

  const visibleConnections = useMemo(
    () => getVisibleConnections(visibleAttendees, connections),
    [visibleAttendees, connections]
  );

  const attendeeById = useMemo(
    () => new Map(visibleAttendees.map((attendee) => [attendee.id, attendee])),
    [visibleAttendees]
  );

  const totalConnections = visibleConnections.length;

  const crossSector = useMemo(() => {
    return visibleConnections.filter((connection) => {
      const scanner = attendeeById.get(connection.scanner_id);
      const scanned = attendeeById.get(connection.scanned_id);

      return (
        scanner &&
        scanned &&
        scanner.sector &&
        scanned.sector &&
        scanner.sector !== scanned.sector
      );
    }).length;
  }, [visibleConnections, attendeeById]);

  const roles = useMemo(
    () => makeLeaderboardRoles(attendees, connections),
    [attendees, connections]
  );

  const anbiPool = formatEuro(totalConnections * DONATION_PER_CONNECTION);

  if (loading) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#080808",
          color: "#EDE9E0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'Outfit', sans-serif",
        }}
      >
        Loading live leaderboard...
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#080808",
          color: "#F9C7C7",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'Outfit', sans-serif",
          padding: 24,
        }}
      >
        {errorMessage}
      </main>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Outfit:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(2.2); }
        }

        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
      `}</style>

      <div
        style={{
          minHeight: "100vh",
          background:
            "linear-gradient(170deg, #080808 0%, #111111 40%, #151515 100%)",
          fontFamily: "'Outfit', sans-serif",
          color: "#EDE9E0",
          display: "flex",
          flexDirection: "column",
          padding: "40px 48px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -150,
            left: "50%",
            transform: "translateX(-50%)",
            width: "100%",
            height: 600,
            background:
              "radial-gradient(ellipse, rgba(0,128,128,0.05) 0%, transparent 60%)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            alignItems: "center",
            marginBottom: 40,
            flexShrink: 0,
            animation: "fadeSlideUp 0.6s both",
          }}
        >
          <div style={{ paddingLeft: 8 }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "#C0BCB5",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                textAlign: "left",
              }}
            >
              Building Ecosystems
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginTop: 8,
              }}
            >
              <PulseDot />
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#1D9E75",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                Live Connection Feed
              </span>
            </div>
          </div>

          <div style={{ textAlign: "center" }}>
            <h1
              style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: 64,
                color: "#F0ECE4",
                lineHeight: 1,
                letterSpacing: "-1px",
                background:
                  "linear-gradient(180deg, #F0ECE4 0%, #BDB9B0 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                filter: "drop-shadow(0 10px 20px rgba(0,0,0,0.5))",
              }}
            >
              Top Connectors
            </h1>
          </div>

          <div />
        </div>

        <div
          style={{
            flex: 1,
            display: "flex",
            gap: "24px",
            alignItems: "stretch",
          }}
        >
          <div
            style={{
              width: 80,
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ height: 80, marginBottom: 0 }} />

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[0, 1, 2].map((rankIndex) => {
                const theme = RANK_THEMES[rankIndex];

                return (
                  <div
                    key={`rank-${rankIndex}`}
                    style={{
                      height: 90,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      animation: `fadeSlideUp 0.6s ${
                        0.3 + rankIndex * 0.1
                      }s both`,
                    }}
                  >
                    <div
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: 16,
                        background: theme.bg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 22,
                        fontWeight: 900,
                        color: theme.text,
                        boxShadow: `0 0 20px ${theme.glow}, inset 0 -2px 6px rgba(0,0,0,0.2)`,
                        border: "2px solid rgba(255,255,255,0.4)",
                      }}
                    >
                      {theme.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {roles.map((role, colIndex) => (
            <div
              key={`col-${role.key}`}
              style={{
                flex: 1,
                minWidth: 0,
                background: "rgba(25, 25, 25, 0.4)",
                border: "1px solid rgba(255, 255, 255, 0.05)",
                borderRadius: 24,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                animation: `fadeSlideUp 0.6s ${0.2 + colIndex * 0.1}s both`,
              }}
            >
              <div
                style={{
                  padding: "20px 16px",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                  background: `linear-gradient(180deg, ${role.color}15 0%, transparent 100%)`,
                  textAlign: "center",
                  height: 80,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    fontSize: 24,
                    fontWeight: 700,
                    color: role.color,
                    fontFamily: "'DM Serif Display', serif",
                    letterSpacing: "-0.5px",
                  }}
                >
                  {role.name}
                </div>

                <div
                  style={{
                    fontSize: 11,
                    color: "#C0BCB5",
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    marginTop: 2,
                  }}
                >
                  {role.subtitle}
                </div>
              </div>

              <div
                style={{
                  padding: 16,
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                  flex: 1,
                }}
              >
                {[0, 1, 2].map((rankIndex) => {
                  const entry = role.entries[rankIndex];
                  const theme = RANK_THEMES[rankIndex];

                  const baseCardStyle = {
                    height: 90,
                    borderRadius: 12,
                    padding: "16px 20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid rgba(255, 255, 255, 0.06)",
                    boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
                  };

                  if (!entry) {
                    return (
                      <div
                        key={`${role.key}-${rankIndex}-empty`}
                        style={{
                          ...baseCardStyle,
                          border: "1px dashed rgba(255,255,255,0.15)",
                          background: "transparent",
                          justifyContent: "center",
                        }}
                      >
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: "rgba(255,255,255,0.2)",
                            letterSpacing: "0.2em",
                            textTransform: "uppercase",
                          }}
                        >
                          Awaiting Data
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={`${role.key}-${rankIndex}-${entry.id}`}
                      style={{
                        ...baseCardStyle,
                        borderLeft: `4px solid ${theme.rankColor}`,
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0, paddingRight: 10, textAlign: "left" }}>
                        <div
                          style={{
                            fontSize: 18,
                            fontWeight: 700,
                            color: "#EDE9E0",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {entry.name}
                        </div>

                        <div
                          style={{
                            fontSize: 13,
                            color: "#C0BCB5",
                            fontWeight: 500,
                            marginTop: 4,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {entry.company}
                        </div>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <div
                          style={{
                            fontSize: 32,
                            fontWeight: 800,
                            color: role.color,
                            lineHeight: 1,
                            textShadow: `0 0 15px ${role.color}40`,
                          }}
                        >
                          {formatScore(entry.score)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 40,
            paddingTop: 24,
            borderTop: "1px solid rgba(255,255,255,0.08)",
            flexShrink: 0,
            animation: "fadeSlideUp 0.6s 0.8s both",
          }}
        >
          <div style={{ display: "flex", gap: 36, flex: 1 }}>
            <div>
              <span
                style={{
                  fontSize: 32,
                  fontWeight: 800,
                  color: "#F0ECE4",
                }}
              >
                {totalConnections}
              </span>

              <span
                style={{
                  fontSize: 12,
                  color: "#C0BCB5",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  marginLeft: 10,
                }}
              >
                Total Connections
              </span>
            </div>

            <div
              style={{
                width: 1,
                height: 30,
                background: "rgba(255,255,255,0.1)",
                alignSelf: "center",
              }}
            />

            <div>
              <span
                style={{
                  fontSize: 32,
                  fontWeight: 800,
                  color: "#1D9E75",
                }}
              >
                {crossSector}
              </span>

              <span
                style={{
                  fontSize: 12,
                  color: "#C0BCB5",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  marginLeft: 10,
                }}
              >
                Cross-Sector
              </span>
            </div>
          </div>

          <div
            style={{
              flex: 1,
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#C0BCB5",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                marginBottom: 6,
              }}
            >
              <span>Connection Target</span>
            </div>

            <div
              style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: 46,
                color: "#1D9E75",
                lineHeight: 1.0,
                letterSpacing: "-1px",
                background:
                  "linear-gradient(90deg, #1D9E75, #2ED3A1, #1D9E75)",
                backgroundSize: "200% 100%",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                animation: "shimmer 3s ease-in-out infinite",
                textShadow: "0 4px 20px rgba(29, 158, 117, 0.3)",
              }}
            >
              500
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: 12,
              flex: 1,
            }}
          >
            <span
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: "#C0BCB5",
                letterSpacing: "0.15em",
              }}
            >
              SCC
            </span>

            <span style={{ fontSize: 16, color: "#C0BCB5" }}>×</span>

            <span
              style={{
                fontSize: 16,
                fontWeight: 800,
                color: "#1D9E75",
                letterSpacing: "0.1em",
              }}
            >
              NLMTD
            </span>
          </div>
        </div>
      </div>
    </>
  );
}