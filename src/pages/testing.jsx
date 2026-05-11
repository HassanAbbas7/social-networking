
import React, { useState, useEffect } from "react";

// ─── Role & Data Definitions ──────────────────────────────────────────────────
const ROLES = [
  {
    key: "anchor",
    name: "Anchor",
    logic: "Top 15% by total connections",
    description: "You grounded the ecosystem — everyone passed through you",
    color: "#EF9F27",
    entries: [
      { name: "Pieter Janssen", company: "ING", score: 24 },
      { name: "Lena Müller", company: "Allianz", score: 21 },
      { name: "Tomás Reyes", company: "BBVA", score: 19 },
    ],
  },
  {
    key: "connector",
    name: "Connector",
    logic: "Top 30% cross-sector, min 3",
    description: "You linked what should not yet be linked",
    color: "#1D9E75",
    entries: [
      { name: "Anna Bergström", company: "Vattenfall", score: 18 },
      { name: "James Crawford", company: "Microsoft", score: 15 },
      { name: "Sophie Laurent", company: "Ramsay", score: 12 },
    ],
  },
  {
    key: "explorer",
    name: "Explorer",
    logic: "3+ sectors, cross-sector >50%",
    description: "You went where others did not — and brought people back",
    color: "#7F77DD",
    entries: [
      { name: "Marcus Weber", company: "Bundesbank", score: 5 },
      { name: "Zara Mitchell", company: "Deloitte", score: 4 },
      // Intentional missing entry to demonstrate deliberate empty state
    ],
  },
  {
    key: "catalyst",
    name: "Catalyst",
    logic: "Top 30% connections, not Anchor",
    description: "You accelerated what was already in motion",
    color: "#D85A30",
    entries: [
      { name: "Riya Patel", company: "Tata", score: 8 },
      { name: "Olivier Dupont", company: "BNP", score: 7 },
      { name: "Emma Lindqvist", company: "Ericsson", score: 6 },
    ],
  },
  {
    key: "builder",
    name: "Builder",
    logic: "Everyone else — consistent",
    description: "You showed up consistently and made it real",
    color: "#378ADD",
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
    rankColor: "#D4A73A" 
  },
  1: { 
    label: "2ND", 
    bg: "#A8ACAF", 
    text: "#1A1A1A", 
    glow: "rgba(168, 172, 175, 0.3)",
    rankColor: "#A8ACAF" 
  },
  2: { 
    label: "3RD", 
    bg: "#C0825A", 
    text: "#1A1000", 
    glow: "rgba(192, 130, 90, 0.3)",
    rankColor: "#C0825A" 
  },
};

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
  const totalConnections = 247;
  const crossSector = 89;
  const anbiPool = "€12,500";

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

      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(170deg, #080808 0%, #111111 40%, #151515 100%)",
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
          background: "radial-gradient(ellipse, rgba(0,128,128,0.05) 0%, transparent 60%)",
          pointerEvents: "none",
        }}/>

        {/* ── Header ── */}
        <div style={{
          display: "grid", 
          gridTemplateColumns: "1fr auto 1fr", 
          alignItems: "center",
          marginBottom: 40, 
          flexShrink: 0,
          animation: "fadeSlideUp 0.6s both",
        }}>
          {/* Left: Project Title */}
          <div style={{ paddingLeft: 8 }}>
            <div style={{
              fontSize: 14, fontWeight: 700, color: "#C0BCB5", 
              letterSpacing: "0.2em", textTransform: "uppercase",
            }}>Building Ecosystems</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
              <PulseDot/>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#1D9E75", letterSpacing: "0.08em", textTransform: "uppercase" }}>Live Connection Feed</span>
            </div>
          </div>

          {/* Center: MAIN HEADING */}
          <div style={{ textAlign: "center" }}>
            <h1 style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: 64, 
              color: "#F0ECE4",
              lineHeight: 1,
              letterSpacing: "-1px",
              background: "linear-gradient(180deg, #F0ECE4 0%, #BDB9B0 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              filter: "drop-shadow(0 10px 20px rgba(0,0,0,0.5))"
            }}>
              Top Connectors
            </h1>
          </div>

          <div />
        </div>

        {/* ── Main Data Grid ── */}
        <div style={{ flex: 1, display: "flex", gap: "24px", alignItems: "stretch" }}>
          
          {/* ── Rank Pillar (Left) ── */}
          <div style={{ width: 80, flexShrink: 0, display: "flex", flexDirection: "column" }}>
            
            {/* 160px height spacer aligns exactly with column headers */}
            <div style={{ height: 160, marginBottom: 0 }} /> 
            
            {/* Added 16px paddingTop to perfectly lock geometric alignment with the cards inside the columns */}
            <div style={{ paddingTop: 16, display: "flex", flexDirection: "column", gap: 16 }}>
              {[0, 1, 2].map((rankIndex) => {
                const theme = RANK_THEMES[rankIndex];
                return (
                  <div key={`rank-${rankIndex}`} style={{
                    height: 90, display: "flex", alignItems: "center", justifyContent: "center",
                    position: "relative", // Crucial for anchoring the connection track
                    animation: `fadeSlideUp 0.6s ${0.3 + rankIndex * 0.1}s both`,
                  }}>
                    
                    {/* ── The Horizontal Connection Track ── */}
                    {/* This shoots to the right and creates a "lane" behind the columns */}
                    <div style={{
                      position: "absolute",
                      left: "50%", 
                      width: "100vw", // Spans the whole screen width
                      height: 90, // Exactly matches the height of the cards
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: `linear-gradient(90deg, ${theme.rankColor}15 0%, ${theme.rankColor}03 60%, transparent 100%)`,
                      borderTop: `1px solid ${theme.rankColor}30`,
                      borderBottom: `1px solid ${theme.rankColor}30`,
                      zIndex: 0, // Sits perfectly behind the badge
                      pointerEvents: "none",
                    }} />

                    {/* The Badge */}
                    <div style={{
                      width: 64, height: 64, borderRadius: 16, background: theme.bg,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 22, fontWeight: 900, color: theme.text,
                      boxShadow: `0 0 20px ${theme.glow}, inset 0 -2px 6px rgba(0,0,0,0.2)`,
                      border: `2px solid rgba(255,255,255,0.4)`,
                      position: "relative", zIndex: 1 
                    }}>
                      {theme.label}
                    </div>

                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Columns ── */}
          {ROLES.map((role, colIndex) => (
            <div key={`col-${role.key}`} style={{ 
              flex: 1, minWidth: 0,
              position: "relative", // ensures column stacks above the horizontal tracks
              background: "rgba(25, 25, 25, 0.4)",
              border: "1px solid rgba(255, 255, 255, 0.05)",
              borderRadius: 24,
              display: "flex", flexDirection: "column",
              overflow: "hidden",
              animation: `fadeSlideUp 0.6s ${0.2 + colIndex * 0.1}s both`
            }}>
              
              <div style={{ 
                padding: "24px 16px 16px", 
                borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                background: `linear-gradient(180deg, ${role.color}15 0%, transparent 100%)`,
                textAlign: "center",
                height: 160, 
                display: 'flex', flexDirection: 'column', alignItems: 'center'
              }}>
                <div style={{
                  fontSize: 26, fontWeight: 700, color: role.color,
                  fontFamily: "'DM Serif Display', serif", letterSpacing: "-0.5px", marginBottom: 6
                }}>{role.name}</div>
                
                <div style={{
                  flex: 1, display: "flex", alignItems: "center",
                  fontSize: 13, color: "#EDE9E0", fontStyle: "italic", fontWeight: 400,
                  lineHeight: 1.3, marginBottom: 12, padding: "0 4px"
                }}>
                  "{role.description}"
                </div>

                <div style={{
                  fontSize: 9, color: "#C0BCB5", fontWeight: 700,
                  letterSpacing: "0.08em", textTransform: "uppercase",
                  background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                  padding: "4px 10px", borderRadius: 6, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "90%"
                }}>
                  {role.logic}
                </div>
              </div>

              <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 16, flex: 1 }}>
                {[0, 1, 2].map((rankIndex) => {
                  const entry = role.entries[rankIndex];
                  const theme = RANK_THEMES[rankIndex];
                  
                  const baseCardStyle = {
                    height: 90, borderRadius: 12, padding: "16px 20px",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    background: "rgba(255, 255, 255, 0.03)", 
                    border: "1px solid rgba(255, 255, 255, 0.06)",
                    boxShadow: "0 4px 15px rgba(0,0,0,0.1)"
                  };

                  if (!entry) {
                    return (
                      <div key={`${role.key}-${rankIndex}-empty`} style={{ 
                        ...baseCardStyle, border: "1px dashed rgba(255,255,255,0.15)", background: "transparent", justifyContent: "center"
                      }}>
                         <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.2)", letterSpacing: "0.2em", textTransform: "uppercase" }}>
                           Awaiting Data
                         </span>
                      </div>
                    );
                  }

                  return (
                    <div key={`${role.key}-${rankIndex}`} style={{
                      ...baseCardStyle, borderLeft: `4px solid ${theme.rankColor}`
                    }}>
                      <div style={{ flex: 1, minWidth: 0, paddingRight: 10 }}>
                        <div style={{
                          fontSize: 18, fontWeight: 700, color: "#EDE9E0",
                          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                        }}>{entry.name}</div>
                        <div style={{ fontSize: 13, color: "#C0BCB5", fontWeight: 500, marginTop: 4 }}>
                          {entry.company}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{
                          fontSize: 32, fontWeight: 800, color: role.color,
                          lineHeight: 1, textShadow: `0 0 15px ${role.color}40`
                        }}>{entry.score}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* ── Footer ── */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginTop: 40, paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.08)",
          flexShrink: 0, animation: "fadeSlideUp 0.6s 0.8s both",
        }}>
          <div style={{ display: "flex", gap: 36, flex: 1 }}>
            <div>
              <span style={{ fontSize: 32, fontWeight: 800, color: "#F0ECE4" }}>{totalConnections}</span>
              <span style={{ fontSize: 12, color: "#C0BCB5", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginLeft: 10 }}>Total Connections</span>
            </div>
            <div style={{ width: 1, height: 30, background: "rgba(255,255,255,0.1)", alignSelf: "center" }}/>
            <div>
              <span style={{ fontSize: 32, fontWeight: 800, color: "#1D9E75" }}>{crossSector}</span>
              <span style={{ fontSize: 12, color: "#C0BCB5", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginLeft: 10 }}>Cross-Sector</span>
            </div>
          </div>

          <div style={{ flex: 1, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#C0BCB5", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 6 }}>ANBI Donation Pool</div>
            <div style={{
              fontFamily: "'DM Serif Display', serif", fontSize: 46, color: "#1D9E75", lineHeight: 1.0, letterSpacing: "-1px",
              background: "linear-gradient(90deg, #1D9E75, #2ED3A1, #1D9E75)", backgroundSize: "200% 100%",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              animation: "shimmer 3s ease-in-out infinite", textShadow: "0 4px 20px rgba(29, 158, 117, 0.3)"
            }}>{anbiPool}</div>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 12, flex: 1 }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: "#C0BCB5", letterSpacing: "0.15em" }}>CCS</span>
            <span style={{ fontSize: 16, color: "#C0BCB5" }}>×</span>
            <span style={{ fontSize: 16, fontWeight: 800, color: "#1D9E75", letterSpacing: "0.1em" }}>NLMTD</span>
          </div>
        </div>
      </div>
    </>
  );
}