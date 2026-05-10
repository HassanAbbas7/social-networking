import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { TABLE_NAME } from "../data/config";
import { assignRoles, computeAttendeeStats } from "../utils/roleUtils";

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
    metric: "connections",
    scoreKey: "connectionCount",
  },
  {
    key: "connector",
    roleName: "Connector",
    name: "Connector",
    subtitle: "Cross-sector bridges",
    color: "#1D9E75",
    metric: "cross-sector",
    scoreKey: "crossSectorCount",
  },
  {
    key: "explorer",
    roleName: "Explorer",
    name: "Explorer",
    subtitle: "Sectors reached",
    color: "#7F77DD",
    metric: "sectors",
    scoreKey: "sectorsReachedCount",
  },
  {
    key: "catalyst",
    roleName: "Catalyst",
    name: "Catalyst",
    subtitle: "Fastest networker",
    color: "#D85A30",
    metric: "per hour",
    scoreKey: "connectionsPerHour",
  },
  {
    key: "builder",
    roleName: "Builder",
    name: "Builder",
    subtitle: "Mutual connections",
    color: "#378ADD",
    metric: "mutual",
    scoreKey: "mutualConnectionCount",
  },
];

const RANK_THEMES = {
  0: {
    label: "1ST",
    bg: "#D4A73A",
    text: "#1A1400",
    glow: "rgba(212, 167, 58, 0.4)",
    rowBg: "linear-gradient(90deg, rgba(212, 167, 58, 0.15) 0%, rgba(212, 167, 58, 0.03) 100%)",
    rowBorder: "rgba(212, 167, 58, 0.3)",
  },
  1: {
    label: "2ND",
    bg: "#A8ACAF",
    text: "#1A1A1A",
    glow: "rgba(168, 172, 175, 0.3)",
    rowBg: "linear-gradient(90deg, rgba(168, 172, 175, 0.1) 0%, rgba(168, 172, 175, 0.02) 100%)",
    rowBorder: "rgba(168, 172, 175, 0.2)",
  },
  2: {
    label: "3RD",
    bg: "#C0825A",
    text: "#1A1000",
    glow: "rgba(192, 130, 90, 0.3)",
    rowBg: "linear-gradient(90deg, rgba(192, 130, 90, 0.1) 0%, rgba(192, 130, 90, 0.02) 100%)",
    rowBorder: "rgba(192, 130, 90, 0.2)",
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

function makeLeaderboardRoles(attendees, connections) {
  // Use the shared assignRoles(computeAttendeeStats(...)) pipeline —
  // identical to what ScreenPage uses via computeRoles()
  const stats = assignRoles(computeAttendeeStats(attendees, connections));

  return ROLE_DEFINITIONS.map((roleDef) => {
    const entries = stats
      .filter(
        (stat) =>
          stat.role === roleDef.roleName && stat.connectionCount > 0
      )
      .sort((a, b) => {
        const diff = b[roleDef.scoreKey] - a[roleDef.scoreKey];
        if (diff !== 0) return diff;
        return b.connectionCount - a.connectionCount;
      })
      .slice(0, MAX_RANKS)
      .map((stat) => ({
        id: stat.id,
        name: getDisplayName(stat.attendee),
        company: getCompany(stat.attendee),
        score: stat[roleDef.scoreKey],
      }));

    return { ...roleDef, entries };
  });
}

function formatScore(value, scoreKey) {
  if (scoreKey === "connectionsPerHour") {
    return Number(value || 0).toFixed(1);
  }
  return Math.round(Number(value || 0));
}

function formatEuro(value) {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function Initials({ name, color, size = 46 }) {
  const safeName = (name || "?").trim();
  const letters =
    safeName
      .split(/\s+/)
      .map((word) => word[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: `${color}15`,
        border: `2px solid ${color}40`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.38,
        fontWeight: 700,
        color,
        fontFamily: "'DM Serif Display', serif",
        flexShrink: 0,
        boxShadow: `inset 0 0 10px ${color}10`,
      }}
    >
      {letters}
    </div>
  );
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

  useEffect(() => {
    let isMounted = true;

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

      if (!isMounted) return;

      if (attendeesError || connectionsError) {
        console.error("Error loading leaderboard data:", attendeesError || connectionsError);
        setErrorMessage("Could not load the live leaderboard.");
        setLoading(false);
        return;
      }

      setAttendees(attendeesData || []);
      setConnections(connectionsData || []);
      setLoading(false);
    }

    loadLeaderboardData();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("leaderboard-connections-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: CONNECTIONS_TABLE },
        (payload) => {
          const newConnection = payload.new;
          setConnections((current) => {
            if (current.some((c) => c.id === newConnection.id)) return current;
            return [...current, newConnection];
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: CONNECTIONS_TABLE },
        (payload) => {
          setConnections((current) =>
            current.filter((c) => c.id !== payload.old.id)
          );
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const attendeeById = useMemo(
    () => new Map(attendees.map((a) => [a.id, a])),
    [attendees]
  );

  const totalConnections = connections.length;

  const crossSector = useMemo(() => {
    return connections.filter((c) => {
      const scanner = attendeeById.get(c.scanner_id);
      const scanned = attendeeById.get(c.scanned_id);
      return (
        scanner &&
        scanned &&
        scanner.sector &&
        scanned.sector &&
        scanner.sector !== scanned.sector
      );
    }).length;
  }, [connections, attendeeById]);

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
          background: "#0A0A0A",
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
          background: "#0A0A0A",
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
        @keyframes fadeSlideRight {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
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
          background: "linear-gradient(170deg, #0A0A0A 0%, #121110 40%, #161412 100%)",
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
            background: "radial-gradient(ellipse, rgba(0,128,128,0.06) 0%, transparent 60%)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: 40,
            flexShrink: 0,
            animation: "fadeSlideUp 0.6s both",
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: 48,
                color: "#F0ECE4",
                lineHeight: 1.0,
                letterSpacing: "-0.5px",
              }}
            >
              Building Ecosystems
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12 }}>
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: "#8A857C",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                }}
              >
                Top connectors
              </span>
              <span style={{ color: "#444", fontSize: 16 }}>·</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <PulseDot />
                <span
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: "#1D9E75",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  Live
                </span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              display: "flex",
              gap: 20,
              padding: "0 16px",
              animation: "fadeSlideUp 0.6s 0.2s both",
            }}
          >
            <div style={{ width: 80, flexShrink: 0 }} />

            {roles.map((role) => (
              <div key={`header-${role.key}`} style={{ flex: 1, minWidth: 0, paddingLeft: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                  <div
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      background: role.color,
                      boxShadow: `0 0 12px ${role.color}80`,
                    }}
                  />
                  <span
                    style={{
                      fontSize: 22,
                      fontWeight: 700,
                      color: "#F0ECE4",
                      fontFamily: "'DM Serif Display', serif",
                      letterSpacing: "-0.3px",
                    }}
                  >
                    {role.name}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "#6A655C",
                    fontWeight: 600,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    paddingLeft: 22,
                  }}
                >
                  {role.subtitle}
                </div>
              </div>
            ))}
          </div>

          {[0, 1, 2].map((rankIndex) => {
            const theme = RANK_THEMES[rankIndex];

            return (
              <div
                key={`row-${rankIndex}`}
                style={{
                  display: "flex",
                  gap: 20,
                  alignItems: "center",
                  background: theme.rowBg,
                  border: `1px solid ${theme.rowBorder}`,
                  borderRadius: 20,
                  padding: "16px",
                  animation: `fadeSlideRight 0.6s ${0.3 + rankIndex * 0.15}s both`,
                  backdropFilter: "blur(10px)",
                  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
                }}
              >
                <div
                  style={{
                    width: 80,
                    flexShrink: 0,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: "50%",
                      background: theme.bg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 18,
                      fontWeight: 900,
                      color: theme.text,
                      fontFamily: "'Outfit', sans-serif",
                      letterSpacing: "0.05em",
                      boxShadow: `0 0 20px ${theme.glow}, inset 0 -2px 6px rgba(0,0,0,0.2)`,
                      border: "2px solid rgba(255,255,255,0.4)",
                    }}
                  >
                    {theme.label}
                  </div>
                </div>

                {roles.map((role) => {
                  const entry = role.entries[rankIndex];

                  if (!entry) {
                    return (
                      <div
                        key={`${role.key}-${rankIndex}-empty`}
                        style={{
                          flex: 1,
                          minWidth: 0,
                          display: "flex",
                          alignItems: "center",
                          gap: 14,
                          padding: "8px",
                          borderRadius: 12,
                          background: "rgba(255,255,255,0.01)",
                        }}
                      >
                        <div
                          style={{
                            width: 46,
                            height: 46,
                            borderRadius: "50%",
                            background: "rgba(255,255,255,0.03)",
                          }}
                        />
                        <div
                          style={{
                            flex: 1,
                            height: 12,
                            background: "rgba(255,255,255,0.03)",
                            borderRadius: 4,
                          }}
                        />
                      </div>
                    );
                  }

                  return (
                    <div
                      key={`${role.key}-${rankIndex}-${entry.id}`}
                      style={{
                        flex: 1,
                        minWidth: 0,
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                        padding: "8px",
                        borderRadius: 12,
                        background: "rgba(255,255,255,0.02)",
                      }}
                    >
                      <Initials name={entry.name} color={role.color} />

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 16,
                            fontWeight: 700,
                            color: "#EDE9E0",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            letterSpacing: "0.02em",
                          }}
                        >
                          {entry.name}
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: "#8A857C",
                            fontWeight: 500,
                            marginTop: 2,
                          }}
                        >
                          {entry.company}
                        </div>
                      </div>

                      <div style={{ textAlign: "right", flexShrink: 0, paddingRight: 8 }}>
                        <div
                          style={{
                            fontSize: 26,
                            fontWeight: 800,
                            color: role.color,
                            fontFamily: "'Outfit', sans-serif",
                            lineHeight: 1,
                            textShadow:
                              rankIndex === 0 ? `0 0 15px ${role.color}60` : "none",
                          }}
                        >
                          {formatScore(entry.score, role.scoreKey)}
                        </div>
                        <div
                          style={{
                            fontSize: 10,
                            color: "#6A655C",
                            fontWeight: 700,
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            marginTop: 4,
                          }}
                        >
                          {role.metric}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
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
              <span style={{ fontSize: 32, fontWeight: 800, color: "#F0ECE4" }}>
                {totalConnections}
              </span>
              <span
                style={{
                  fontSize: 12,
                  color: "#6A655C",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  marginLeft: 10,
                }}
              >
                total connections
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
              <span style={{ fontSize: 32, fontWeight: 800, color: "#008080" }}>
                {crossSector}
              </span>
              <span
                style={{
                  fontSize: 12,
                  color: "#6A655C",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  marginLeft: 10,
                }}
              >
                cross-sector
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
                color: "#8A857C",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                marginBottom: 6,
              }}
            >
              ANBI Donation Pool
            </div>
            <div
              style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: 46,
                color: "#008080",
                lineHeight: 1.0,
                letterSpacing: "-1px",
                background: "linear-gradient(90deg, #00A090, #00D0C0, #00A090)",
                backgroundSize: "200% 100%",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                animation: "shimmer 3s ease-in-out infinite",
                textShadow: "0 4px 20px rgba(0, 128, 128, 0.3)",
              }}
            >
              {anbiPool}
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
                color: "#6A655C",
                letterSpacing: "0.15em",
              }}
            >
              CCS
            </span>
            <span style={{ fontSize: 16, color: "#4A453C" }}>×</span>
            <span
              style={{
                fontSize: 16,
                fontWeight: 800,
                color: "#008080",
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