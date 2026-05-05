import React from "react";

// ─── Sector config ────────────────────────────────────────────────────────────
const SECTOR_CONFIG = {
  Tech:            { color: "#378ADD", light: "#EBF4FF" },
  Finance:         { color: "#7F77DD", light: "#EEEDFA" },
  Health:          { color: "#1D9E75", light: "#E5F5EF" },
  Energy:          { color: "#EF9F27", light: "#FDF4E7" },
  "Public Sector": { color: "#D85A30", light: "#FCEEE9" },
  Other:           { color: "#7A7A78", light: "#F2F2F1" },
};

// ─── SVG Flags ────────────────────────────────────────────────────────────────
function Flag({ country, size = 24 }) {
  return (
    <img
      src={`/flags/${country}.svg`}
      width={size}
      alt={country}
      style={{ display: "block", borderRadius: 2 }}
    />
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ name, size = 88 }) {
  const initials = name
    ?.split(" ")
    .map(w => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "linear-gradient(135deg, #00808022 0%, #00808044 100%)",
        border: "3px solid #00808030",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.34,
        fontWeight: 700,
        color: "#008080",
        fontFamily: "'DM Serif Display', serif",
      }}
    >
      {initials}
    </div>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div
      style={{
        width: 18,
        height: 18,
        border: "2.5px solid rgba(255,255,255,0.3)",
        borderTopColor: "#FFF",
        borderRadius: "50%",
        animation: "spin 0.7s linear infinite",
      }}
    />
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function ProfileScreen({ profile, onConnect, connecting }) {
  const cfg = SECTOR_CONFIG[profile.sector] || SECTOR_CONFIG.Other;

  const firstName = profile.name?.split(" ")[0] || "";
  const lastName = profile.name?.split(" ").slice(1).join(" ") || "";

  const handleConnect = async () => {
    if (connecting) return;
    await onConnect(profile);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Outfit:wght@400;500;600;700&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div
        style={{
          minHeight: "100vh",
          background: "#F8F7F4",
          display: "flex",
          flexDirection: "column",
          fontFamily: "'Outfit', sans-serif",
        }}
      >
        {/* Top bar */}
        <div
          style={{
            padding: "14px 20px 12px",
            borderBottom: "1px solid #EEE9E0",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#008080" }} />
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: "#A8A39A",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
            }}
          >
            Building Ecosystems 2026
          </span>
        </div>

        {/* Body */}
        <div style={{ padding: "32px 28px 0" }}>
          {/* Avatar */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 22 }}>
            <Avatar name={profile.name} size={96} />
          </div>

          {/* Name */}
          <div style={{ textAlign: "center", marginBottom: 6 }}>
            <div
              style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: 34,
                color: "#111",
                lineHeight: 1.1,
                letterSpacing: "-0.5px",
              }}
            >
              {firstName} {lastName}
            </div>
          </div>

          {/* Title */}
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#008080" }}>
              {profile.title}
            </div>
            <div style={{ fontSize: 13, color: "#9A9590" }}>{profile.company}</div>
          </div>

          <div style={{ height: 1, background: "#EEE9E0", marginBottom: 22 }} />

          {/* Sector + Country */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 32,
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: cfg.light,
                border: `1.5px solid ${cfg.color}50`,
                borderRadius: 100,
                padding: "6px 14px 6px 10px",
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: cfg.color,
                }}
              />
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: cfg.color,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                {profile.sector}
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  padding: "3px 4px",
                  background: "#FFF",
                  border: "1px solid #E4DED4",
                  borderRadius: 3,
                }}
              >
                <Flag country={profile.country} size={24} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#5C5751" }}>
                {profile.country}
              </span>
            </div>
          </div>
        </div>

        {/* Button */}
        <div style={{ padding: "0 20px 40px" }}>
          <button
            onClick={handleConnect}
            disabled={connecting}
            style={{
              width: "100%",
              padding: "18px 0",
              background: connecting
                ? "#00808099"
                : "linear-gradient(135deg, #008080 0%, #006666 100%)",
              border: "none",
              borderRadius: 16,
              color: "#FFF",
              fontSize: 17,
              fontWeight: 700,
              cursor: connecting ? "default" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              boxShadow: connecting
                ? "none"
                : "0 8px 32px rgba(0,128,128,0.45)",
            }}
          >
            {connecting ? (
              <>
                <Spinner />
                Connecting...
              </>
            ) : (
              `Connect with ${firstName}`
            )}
          </button>
        </div>
      </div>
    </>
  );
}