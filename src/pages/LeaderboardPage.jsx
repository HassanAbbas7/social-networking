import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { DEFAULT_LANGUAGE, getTranslations, normalizeLanguage, TABLE_NAME } from "../data/config";
import { useParams } from "react-router-dom";
import { computeRoleStats } from "../utils/roleUtils";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

const ATTENDEE_STATS_TABLE = "attendee_stats";
const MAX_RANKS = 3;

const DONATION_PER_CONNECTION = Number(
  import.meta.env.VITE_ANBI_EURO_PER_CONNECTION || 50
);

const BASE_ROLE_DEFINITIONS = [
  {
    key: "anchor",
    roleName: "Anchor",
    name: "Anchor",
    logic: "Top 15% by total connections",
    description: "You grounded the ecosystem — everyone passed through you",
    color: "#EF9F27",
    scoreKey: "connectionCount",
  },
  {
    key: "connector",
    roleName: "Connector",
    name: "Connector",
    logic: "Top 3 by cross-sector %",
    description: "You linked what should not yet be linked",
    color: "#1D9E75",
    scoreKey: "crossSectorCount",
  },
  {
    key: "explorer",
    roleName: "Explorer",
    name: "Explorer",
    logic: "Most sectors reached out of 6",
    description: "You went where others did not — and brought people back",
    color: "#7F77DD",
    scoreKey: "sectorsReachedCount",
  },
  {
    key: "catalyst",
    roleName: "Catalyst",
    name: "Catalyst",
    logic: "Most connections in first hour",
    description: "You accelerated what was already in motion",
    color: "#D85A30",
    scoreKey: "connectionsFirstHour",
  },
  {
    key: "builder",
    roleName: "Builder",
    name: "Builder",
    logic: "The bridge — consistent",
    description: "You showed up consistently and made it real",
    color: "#378ADD",
    scoreKey: "connectionCount",
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

function getDisplayName(stat, unknownAttendee = "Unknown attendee") {
  const attendee = stat.attendee || stat.raw || {};

  return (
    attendee.name ||
    attendee.full_name ||
    [attendee.first_name, attendee.last_name].filter(Boolean).join(" ") ||
    attendee.email ||
    unknownAttendee
  );
}

function getCompany(stat) {
  const attendee = stat.attendee || stat.raw || {};

  return (
    attendee.company ||
    attendee.organization ||
    attendee.organisation ||
    attendee.company_name ||
    attendee.sector ||
    "—"
  );
}

function mergeStatsWithAttendees(attendeeStatsRows = [], attendees = []) {
  const attendeeById = new Map(
    attendees.map((attendee) => [attendee.id, attendee])
  );

  return attendeeStatsRows.map((statRow) => {
    const attendee = attendeeById.get(statRow.user_id);

    return {
      ...statRow,

      // These display fields are merged in so roleUtils can expose them
      // through stat.attendee / stat.raw.
      ...(attendee || {}),
    };
  });
}

function hasLeaderboardRole(stat, roleName) {
  /**
   * All roles are now mutually exclusive.
   * Catalyst is treated like Anchor, Connector, Explorer, and Builder.
   *
   * Supports both:
   *   - stat.role: "Catalyst"
   *   - stat.roles: ["Catalyst"]
   *
   * The updated roleUtils returns a single primary role and a single-item
   * roles array for UI compatibility.
   */
  return stat.role === roleName || stat.roles?.includes(roleName);
}

function getLeaderboardScore(stat, roleDef) {
  if (roleDef.key === "connector") {
    return Number(stat.crossSectorRatio || 0) * 100;
  }

  return Number(stat[roleDef.scoreKey] || 0);
}

function makeLeaderboardRoles(attendeeStatsRows, roleDefinitions) {
  const stats = computeRoleStats(attendeeStatsRows).filter(
    (stat) => Number(stat.connectionCount || 0) > 0
  );

  return roleDefinitions.map((roleDef) => {
    const entries = stats
      .filter((stat) => hasLeaderboardRole(stat, roleDef.roleName))
      .sort((a, b) => {
        const scoreDiff =
          getLeaderboardScore(b, roleDef) - getLeaderboardScore(a, roleDef);

        if (scoreDiff !== 0) return scoreDiff;

        const connectionDiff =
          Number(b.connectionCount || 0) - Number(a.connectionCount || 0);

        if (connectionDiff !== 0) return connectionDiff;

        return String(a.id || "").localeCompare(String(b.id || ""));
      })
      .slice(0, MAX_RANKS)
      .map((stat) => ({
        id: stat.id,
        name: getDisplayName(stat, roleDef.unknownAttendee),
        company: getCompany(stat),
        score: getLeaderboardScore(stat, roleDef),
      }));

    return {
      ...roleDef,
      entries,
    };
  });
}

function formatScore(value, roleKey) {
  const roundedValue = Math.round(Number(value || 0));

  return roleKey === "connector" ? `${roundedValue}%` : roundedValue;
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
  const { lang } = useParams();
  console.log(`Detected language: ${lang}`);
  const language = normalizeLanguage(lang);
  const t = getTranslations(language).leaderboard;

  const roleDefinitions = useMemo(
    () =>
      BASE_ROLE_DEFINITIONS.map((roleDef) => ({
        ...roleDef,
        name: t.roles?.[roleDef.key]?.name || roleDef.name,
        logic: t.roles?.[roleDef.key]?.logic || roleDef.logic,
        description:
          t.roles?.[roleDef.key]?.description || roleDef.description,
        unknownAttendee: t.unknownAttendee,
      })),
    [t]
  );

  const [attendeeStats, setAttendeeStats] = useState([]);
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadLeaderboardData(showLoading = false) {
    if (showLoading) setLoading(true);

    setErrorMessage("");

    const [
      { data: attendeeStatsData, error: attendeeStatsError },
      { data: attendeesData, error: attendeesError },
    ] = await Promise.all([
      supabase
        .from(ATTENDEE_STATS_TABLE)
        .select("*")
        .order("total_connections", { ascending: false }),

      supabase.from(TABLE_NAME).select("*"),
    ]);

    if (attendeeStatsError || attendeesError) {
      console.error(
        "Error loading leaderboard data:",
        attendeeStatsError || attendeesError
      );
      setErrorMessage(t.loadError);
      setLoading(false);
      return;
    }

    setAttendeeStats(attendeeStatsData || []);
    setAttendees(attendeesData || []);
    setLoading(false);
  }

  useEffect(() => {
    loadLeaderboardData(true);

    const intervalId = setInterval(() => {
      loadLeaderboardData(false);
    }, 3000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("leaderboard-live-data")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: ATTENDEE_STATS_TABLE,
        },
        () => {
          loadLeaderboardData(false);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: TABLE_NAME,
        },
        () => {
          loadLeaderboardData(false);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const mergedAttendeeStats = useMemo(
    () => mergeStatsWithAttendees(attendeeStats, attendees),
    [attendeeStats, attendees]
  );

  const roleStats = useMemo(
    () => computeRoleStats(mergedAttendeeStats),
    [mergedAttendeeStats]
  );

  const roles = useMemo(
    () => makeLeaderboardRoles(mergedAttendeeStats, roleDefinitions),
    [mergedAttendeeStats, roleDefinitions]
  );

  /**
   * attendee_stats is per attendee.
   * Because your SQL view is based on all_connections, each real connection
   * appears once from each attendee's perspective.
   *
   * Therefore:
   *   sum(total_connections) / 2 = real total connections
   *   sum(cross_sector_count) / 2 = real cross-sector connections
   */
  const totalConnections = useMemo(() => {
    const totalUserConnections = roleStats.reduce(
      (sum, stat) => sum + Number(stat.connectionCount || 0),
      0
    );

    return Math.round(totalUserConnections / 2);
  }, [roleStats]);

  const crossSector = useMemo(() => {
    const totalUserCrossSectorConnections = roleStats.reduce(
      (sum, stat) => sum + Number(stat.crossSectorCount || 0),
      0
    );

    return Math.round(totalUserCrossSectorConnections / 2);
  }, [roleStats]);

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
        {t.loading}
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
              {t.brand}
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
                {t.liveFeed}
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
              {t.title}
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
            <div style={{ height: 160, marginBottom: 0 }} />

            <div
              style={{
                paddingTop: 16,
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
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
                      position: "relative",
                      animation: `fadeSlideUp 0.6s ${
                        0.3 + rankIndex * 0.1
                      }s both`,
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        left: "50%",
                        width: "100vw",
                        height: 90,
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: `linear-gradient(90deg, ${theme.rankColor}15 0%, ${theme.rankColor}03 60%, transparent 100%)`,
                        borderTop: `1px solid ${theme.rankColor}30`,
                        borderBottom: `1px solid ${theme.rankColor}30`,
                        zIndex: 0,
                        pointerEvents: "none",
                      }}
                    />

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
                        position: "relative",
                        zIndex: 1,
                      }}
                    >
                      {t.ranks?.[rankIndex] || theme.label}
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
                position: "relative",
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
                  padding: "24px 16px 16px",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                  background: `linear-gradient(180deg, ${role.color}15 0%, transparent 100%)`,
                  textAlign: "center",
                  height: 160,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    fontSize: 26,
                    fontWeight: 700,
                    color: role.color,
                    fontFamily: "'DM Serif Display', serif",
                    letterSpacing: "-0.5px",
                    marginBottom: 6,
                  }}
                >
                  {role.name}
                </div>

                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    fontSize: 13,
                    color: "#EDE9E0",
                    fontStyle: "italic",
                    fontWeight: 400,
                    lineHeight: 1.3,
                    marginBottom: 12,
                    padding: "0 4px",
                  }}
                >
                  "{role.description}"
                </div>

                <div
                  style={{
                    fontSize: 9,
                    color: "#C0BCB5",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    padding: "4px 10px",
                    borderRadius: 6,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    maxWidth: "90%",
                  }}
                >
                  {role.logic}
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
                            textAlign: "center",
                          }}
                        >
                          {t.emptyRankLine1} <br />
                          {t.emptyRankLine2}
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
                      <div
                        style={{
                          flex: 1,
                          minWidth: 0,
                          paddingRight: 10,
                          textAlign: "left",
                        }}
                      >
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
                          {role.key === "explorer"
                            ? `${formatScore(entry.score, role.key)}${t.explorerMaxSuffix}`
                            : formatScore(entry.score, role.key)}
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
                {t.crossSector}
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
              <span>{t.connectionTarget}</span>
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
              {totalConnections}/240
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
            {/* <span
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: "#C0BCB5",
                letterSpacing: "0.15em",
              }}
            >
              SCC
            </span> */}

            {/* <span style={{ fontSize: 16, color: "#C0BCB5" }}>×</span> */}

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