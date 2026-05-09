import React from "react";

// ─── Role & Data Definitions ──────────────────────────────────────────────────
const ROLES = [
  {
    key: "anchor",
    name: "Anchor",
    subtitle: "Most connected",
    color: "#7F77DD",
    metric: "connections",
    entries: [
      { name: "Pieter Janssen", company: "ING", score: 24 },
      { name: "Lena Müller", company: "Allianz", score: 21 },
      { name: "Tomás Reyes", company: "BBVA", score: 19 },
    ],
  },
  {
    key: "connector",
    name: "Connector",
    subtitle: "Cross-sector bridges",
    color: "#008080",
    metric: "cross-sector",
    entries: [
      { name: "Anna Bergström", company: "Vattenfall", score: 18 },
      { name: "James Crawford", company: "Microsoft", score: 15 },
      { name: "Sophie Laurent", company: "Ramsay", score: 12 },
    ],
  },
  {
    key: "explorer",
    name: "Explorer",
    subtitle: "Sectors reached",
    color: "#EF9F27",
    metric: "sectors",
    entries: [
      { name: "Marcus Weber", company: "Bundesbank", score: 5 },
      { name: "Zara Mitchell", company: "Deloitte", score: 4 },
      // Intentional missing 3rd entry to demonstrate safe fallback UI
    ],
  },
  {
    key: "catalyst",
    name: "Catalyst",
    subtitle: "Fastest networker",
    color: "#D85A30",
    metric: "per hour",
    entries: [
      { name: "Riya Patel", company: "Tata", score: 8 },
      { name: "Olivier Dupont", company: "BNP", score: 7 },
      { name: "Emma Lindqvist", company: "Ericsson", score: 6 },
    ],
  },
  {
    key: "builder",
    name: "Builder",
    subtitle: "Mutual connections",
    color: "#378ADD",
    metric: "mutual",
    entries: [
      { name: "Chen Wei", company: "Huawei", score: 14 },
      { name: "Pieter Janssen", company: "ING", score: 11 },
      { name: "Fatima Al-Rashid", company: "ADNOC", score: 9 },
    ],
  },
];

// ─── Gamification Aesthetics ──────────────────────────────────────────────────
const RANK_THEMES = {
  0: { 
    label: "1ST", 
    bg: "#D4A73A", 
    text: "#1A1400", 
    glow: "rgba(212, 167, 58, 0.4)",
    rowBg: "linear-gradient(90deg, rgba(212, 167, 58, 0.15) 0%, rgba(212, 167, 58, 0.03) 100%)",
    rowBorder: "rgba(212, 167, 58, 0.3)"
  },
  1: { 
    label: "2ND", 
    bg: "#A8ACAF", 
    text: "#1A1A1A", 
    glow: "rgba(168, 172, 175, 0.3)",
    rowBg: "linear-gradient(90deg, rgba(168, 172, 175, 0.1) 0%, rgba(168, 172, 175, 0.02) 100%)",
    rowBorder: "rgba(168, 172, 175, 0.2)"
  },
  2: { 
    label: "3RD", 
    bg: "#C0825A", 
    text: "#1A1000", 
    glow: "rgba(192, 130, 90, 0.3)",
    rowBg: "linear-gradient(90deg, rgba(192, 130, 90, 0.1) 0%, rgba(192, 130, 90, 0.02) 100%)",
    rowBorder: "rgba(192, 130, 90, 0.2)"
  },
};

// ─── Avatar (Bulletproofed) ───────────────────────────────────────────────────
function Initials({ name, color, size = 46 }) {
  // Safely handle null/undefined and multiple spaces
  const safeName = (name || "?").trim();
  const letters = safeName
    .split(/\s+/)
    .map(w => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";

  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: `${color}15`,
      border: `2px solid ${color}40`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.38, fontWeight: 700, color: color,
      fontFamily: "'DM Serif Display', serif",
      flexShrink: 0,
      boxShadow: `inset 0 0 10px ${color}10`
    }}>
      {letters}
    </div>
  );
}

// ─── Pulse dot (live indicator) ───────────────────────────────────────────────
function PulseDot() {
  return (
    <div style={{ position: "relative", width: 12, height: 12, flexShrink: 0 }}>
      <div style={{
        position: "absolute", inset: 0,
        borderRadius: "50%", background: "#1D9E75",
        animation: "pulse 2s ease-in-out infinite",
      }}/>
      <div style={{
        position: "absolute", inset: 2,
        borderRadius: "50%", background: "#1D9E75",
      }}/>
    </div>
  );
}

// ─── Main Leaderboard ─────────────────────────────────────────────────────────
export default function Leaderboard() {
  // Static data for footer stats (would likely come from your DB in production)
  const totalConnections = 247;
  const crossSector = 89;
  const anbiPool = "€12,500";

  return (
    <>
      {/* 
        Note: For a production app, move the @import to your index.html <head> 
        and the @keyframes to a global CSS file. They are left here for drop-in testing.
      */}
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

      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(170deg, #0A0A0A 0%, #121110 40%, #161412 100%)",
        fontFamily: "'Outfit', sans-serif",
        color: "#EDE9E0",
        display: "flex", flexDirection: "column",
        padding: "40px 48px",
        position: "relative",
        overflow: "hidden",
      }}>

        {/* Ambient background glow */}
        <div style={{
          position: "absolute", top: -150, left: "50%", transform: "translateX(-50%)",
          width: "100%", height: 600,
          background: "radial-gradient(ellipse, rgba(0,128,128,0.06) 0%, transparent 60%)",
          pointerEvents: "none",
        }}/>

        {/* ── Header ── */}
        <div style={{
          display: "flex", alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 40, flexShrink: 0,
          animation: "fadeSlideUp 0.6s both",
        }}>
          <div>
            <div style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: 48, color: "#F0ECE4",
              lineHeight: 1.0, letterSpacing: "-0.5px",
            }}>Building Ecosystems</div>
            <div style={{
              display: "flex", alignItems: "center", gap: 12,
              marginTop: 12,
            }}>
              <span style={{
                fontSize: 16, fontWeight: 600, color: "#8A857C",
                letterSpacing: "0.14em", textTransform: "uppercase",
              }}>Top connectors</span>
              <span style={{ color: "#444", fontSize: 16 }}>·</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <PulseDot/>
                <span style={{
                  fontSize: 15, fontWeight: 700, color: "#1D9E75",
                  letterSpacing: "0.08em", textTransform: "uppercase"
                }}>Live</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Main Data Grid ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
          
          {/* Column Headers */}
          <div style={{ 
            display: "flex", gap: 20, padding: "0 16px", 
            animation: "fadeSlideUp 0.6s 0.2s both" 
          }}>
            <div style={{ width: 80, flexShrink: 0 }} /> {/* Empty space for rank column */}
            
            {ROLES.map((role) => (
              <div key={`header-${role.key}`} style={{ flex: 1, minWidth: 0, paddingLeft: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                  <div style={{
                    width: 12, height: 12, borderRadius: "50%",
                    background: role.color,
                    boxShadow: `0 0 12px ${role.color}80`,
                  }}/>
                  <span style={{
                    fontSize: 22, fontWeight: 700, color: "#F0ECE4",
                    fontFamily: "'DM Serif Display', serif",
                    letterSpacing: "-0.3px",
                  }}>{role.name}</span>
                </div>
                <div style={{
                  fontSize: 12, color: "#6A655C", fontWeight: 600,
                  letterSpacing: "0.1em", textTransform: "uppercase",
                  paddingLeft: 22,
                }}>{role.subtitle}</div>
              </div>
            ))}
          </div>

          {/* Rows (1st, 2nd, 3rd) */}
          {[0, 1, 2].map((rankIndex) => {
            const theme = RANK_THEMES[rankIndex];
            
            return (
              <div key={`row-${rankIndex}`} style={{
                display: "flex", gap: 20, alignItems: "center",
                background: theme.rowBg,
                border: `1px solid ${theme.rowBorder}`,
                borderRadius: 20,
                padding: "16px",
                animation: `fadeSlideRight 0.6s ${0.3 + rankIndex * 0.15}s both`,
                backdropFilter: "blur(10px)",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)"
              }}>
                
                {/* 1. Left Position/Rank Column */}
                <div style={{ 
                  width: 80, flexShrink: 0, display: "flex", 
                  justifyContent: "center", alignItems: "center" 
                }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: "50%",
                    background: theme.bg,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 18, fontWeight: 900, color: theme.text,
                    fontFamily: "'Outfit', sans-serif",
                    letterSpacing: "0.05em",
                    boxShadow: `0 0 20px ${theme.glow}, inset 0 -2px 6px rgba(0,0,0,0.2)`,
                    border: `2px solid rgba(255,255,255,0.4)`
                  }}>
                    {theme.label}
                  </div>
                </div>

                {/* 2. Player Entries Across Roles */}
                {ROLES.map((role) => {
                  const entry = role.entries[rankIndex];
                  
                  // Safe Fallback UI if the array has fewer than 3 entries
                  if (!entry) {
                    return (
                      <div key={`${role.key}-${rankIndex}-empty`} style={{ 
                        flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 14,
                        padding: "8px", borderRadius: 12,
                        background: "rgba(255,255,255,0.01)" 
                      }}>
                        <div style={{ width: 46, height: 46, borderRadius: "50%", background: "rgba(255,255,255,0.03)" }} />
                        <div style={{ flex: 1, height: 12, background: "rgba(255,255,255,0.03)", borderRadius: 4 }} />
                      </div>
                    );
                  }

                  return (
                    <div key={`${role.key}-${rankIndex}`} style={{ 
                      flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 14,
                      padding: "8px", borderRadius: 12,
                      background: "rgba(255,255,255,0.02)"
                    }}>
                      <Initials name={entry.name} color={role.color} />
                      
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 16, fontWeight: 700, color: "#EDE9E0",
                          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                          letterSpacing: "0.02em"
                        }}>{entry.name}</div>
                        <div style={{
                          fontSize: 12, color: "#8A857C", fontWeight: 500,
                          marginTop: 2
                        }}>{entry.company}</div>
                      </div>

                      <div style={{ textAlign: "right", flexShrink: 0, paddingRight: 8 }}>
                        <div style={{
                          fontSize: 26, fontWeight: 800, color: role.color,
                          fontFamily: "'Outfit', sans-serif",
                          lineHeight: 1,
                          textShadow: rankIndex === 0 ? `0 0 15px ${role.color}60` : 'none'
                        }}>{entry.score}</div>
                        <div style={{
                          fontSize: 10, color: "#6A655C", fontWeight: 700,
                          letterSpacing: "0.08em", textTransform: "uppercase",
                          marginTop: 4
                        }}>{role.metric}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* ── Footer ── */}
        <div style={{
          display: "flex", alignItems: "center",
          justifyContent: "space-between",
          marginTop: 40, paddingTop: 24,
          borderTop: "1px solid rgba(255,255,255,0.08)",
          flexShrink: 0,
          animation: "fadeSlideUp 0.6s 0.8s both",
        }}>
          
          {/* Footer Left: Stats */}
          <div style={{ display: "flex", gap: 36, flex: 1 }}>
            <div>
              <span style={{
                fontSize: 32, fontWeight: 800, color: "#F0ECE4",
              }}>{totalConnections}</span>
              <span style={{
                fontSize: 12, color: "#6A655C", fontWeight: 700,
                letterSpacing: "0.1em", textTransform: "uppercase", marginLeft: 10,
              }}>total connections</span>
            </div>
            <div style={{
              width: 1, height: 30, background: "rgba(255,255,255,0.1)", alignSelf: "center",
            }}/>
            <div>
              <span style={{
                fontSize: 32, fontWeight: 800, color: "#008080",
              }}>{crossSector}</span>
              <span style={{
                fontSize: 12, color: "#6A655C", fontWeight: 700,
                letterSpacing: "0.1em", textTransform: "uppercase", marginLeft: 10,
              }}>cross-sector</span>
            </div>
          </div>

          {/* Footer Centre: ANBI Pool (Prominent) */}
          <div style={{ flex: 1, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{
              fontSize: 11, fontWeight: 700, color: "#8A857C",
              letterSpacing: "0.2em", textTransform: "uppercase",
              marginBottom: 6,
            }}>ANBI Donation Pool</div>
            <div style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: 46, color: "#008080",
              lineHeight: 1.0, letterSpacing: "-1px",
              background: "linear-gradient(90deg, #00A090, #00D0C0, #00A090)",
              backgroundSize: "200% 100%",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              animation: "shimmer 3s ease-in-out infinite",
              textShadow: "0 4px 20px rgba(0, 128, 128, 0.3)"
            }}>{anbiPool}</div>
          </div>

          {/* Footer Right: Event Branding */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 12, flex: 1
          }}>
            <span style={{
              fontSize: 16, fontWeight: 700, color: "#6A655C", letterSpacing: "0.15em",
            }}>CCS</span>
            <span style={{
              fontSize: 16, color: "#4A453C",
            }}>×</span>
            <span style={{
              fontSize: 16, fontWeight: 800, color: "#008080", letterSpacing: "0.1em",
            }}>NLMTD</span>
          </div>
        </div>
      </div>
    </>
  );
}