import React from "react";
import { countryMap, SECTOR_CONFIG } from "../../data/config";


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
function Avatar({ name, photoUrl, size = 96 }) {
  const initials = name
    ?.split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const [imageError, setImageError] = React.useState(false);

  const showImage = photoUrl && !imageError;

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        overflow: "hidden",
        background: "#008080",
        color: "#FFF",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.34,
        fontWeight: 700,
        border: "4px solid #FFF",
        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
      }}
    >
      {showImage ? (
        <img
          src={photoUrl}
          alt={name || "Profile photo"}
          onError={() => setImageError(true)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
      ) : (
        initials || "?"
      )}
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
export default function BobProfile() {
  const cfg = SECTOR_CONFIG.public;

  const firstName = "Bob"
  const lastName = "the Builder"
  const [connecting, setConnecting] = React.useState(false);

  const handleConnect = async () => {
    setConnecting(true);
    // redirect to linkedin
    window.open("https://www.linkedin.com/in/bob-the-builder/", "_blank");
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
            <Avatar name={"Bob the Builder"} photoUrl={"https://www.bigissue.com/wp-content/uploads/2025/11/1694-Bob_the_Builder_Hero.jpg"} size={96} />
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
              {"Builder"}
            </div>
            <div style={{ fontSize: 13, color: "#9A9590" }}>{"Bob's Company"}</div>
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
                {"Public"}
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
                <Flag country={"nl"} size={24} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#5C5751" }}>
                {countryMap["nl"]}
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