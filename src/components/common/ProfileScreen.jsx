// import Flag from "./Flag"; // extract this too if you want, or inline it

const SECTOR_CONFIG = {
  Tech:            { color: "#378ADD", light: "#EBF4FF" },
  Finance:         { color: "#7F77DD", light: "#EEEDFA" },
  Health:          { color: "#1D9E75", light: "#E5F5EF" },
  Energy:          { color: "#EF9F27", light: "#FDF4E7" },
  "Public Sector": { color: "#D85A30", light: "#FCEEE9" },
  Other:           { color: "#7A7A78", light: "#F2F2F1" },
};

function Avatar({ name, size = 88 }) {
  const initials = name
    ?.split(" ")
    .map(w => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: "linear-gradient(135deg, #00808018 0%, #00808035 100%)",
      border: "3px solid #00808045",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.34, fontWeight: 700,
      color: "#008080", fontFamily: "'DM Serif Display', serif",
      flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

function Spinner() {
  return (
    <div style={{
      width: 20, height: 20,
      border: "2.5px solid rgba(255,255,255,0.3)",
      borderTopColor: "#FFF",
      borderRadius: "50%",
      animation: "spin 0.7s linear infinite",
    }}/>
  );
}

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

export default function ProfileScreen({ profile, onConnect, connecting }) {
  const cfg = SECTOR_CONFIG[profile.sector] || SECTOR_CONFIG.Other;

  const firstName = profile.name?.split(" ")[0] || "";
  const lastName  = profile.name?.split(" ").slice(1).join(" ") || "";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>

      {/* ── Top brand strip ── */}
      <div style={{
        padding: "14px 20px 12px",
        borderBottom: "1px solid #EEE9E0",
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <div style={{
          width: 6, height: 6, borderRadius: "50%", background: "#008080",
        }}/>
        <span style={{
          fontSize: 10, fontWeight: 700, color: "#A8A39A",
          letterSpacing: "0.18em", textTransform: "uppercase",
        }}>
          Building Ecosystems 2026
        </span>
      </div>

      {/* ── Card body ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "32px 28px 0" }}>

        {/* Avatar */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 22 }}>
          <Avatar name={profile.name} size={96}/>
        </div>

        {/* Name */}
        <div style={{ textAlign: "center", marginBottom: 6 }}>
          <div style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: 34, color: "#111", lineHeight: 1.1,
            letterSpacing: "-0.5px",
          }}>
            {firstName} {lastName}
          </div>
        </div>

        {/* Title + Company */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            fontSize: 14, fontWeight: 600, color: "#008080", marginBottom: 3,
          }}>
            {profile.title}
          </div>
          <div style={{ fontSize: 13, color: "#9A9590", fontWeight: 400 }}>
            {profile.company}
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "#EEE9E0", marginBottom: 22 }}/>

        {/* Sector + Country row */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>

          {/* Sector pill */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: cfg.light, border: `1.5px solid ${cfg.color}50`,
            borderRadius: 100, padding: "6px 14px 6px 10px",
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%", background: cfg.color,
            }}/>
            <span style={{
              fontSize: 11, fontWeight: 700, color: cfg.color,
              letterSpacing: "0.1em", textTransform: "uppercase",
            }}>
              {profile.sector}
            </span>
          </div>

          {/* Country flag */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              padding: "3px 4px", background: "#FFF",
              border: "1px solid #E4DED4", borderRadius: 3,
              display: "flex", alignItems: "center",
            }}>
              <Flag country={profile.country} size={24}/>
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#5C5751" }}>
              {profile.country}
            </span>
          </div>
        </div>
      </div>

      {/* ── Connect button ── */}
      <div style={{
        display: "flex", flexDirection: "column",
        alignItems: "center", paddingBottom: 32, paddingTop: 20,
        flexShrink: 0,
      }}>
        <button
          onClick={onConnect}
          disabled={connecting}
          style={{
            width: 230, height: 230,
            borderRadius: "50%",
            background: connecting
              ? "#00808099"
              : "radial-gradient(circle at 38% 35%, #00A090 0%, #008080 55%, #006666 100%)",
            border: "none",
            color: "#FFF",
            fontSize: connecting ? 15 : 26,
            fontWeight: 700,
            fontFamily: "'Outfit', sans-serif",
            cursor: connecting ? "default" : "pointer",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            gap: 8,
            boxShadow: connecting
              ? "none"
              : "0 16px 56px rgba(0,128,128,0.45), 0 4px 16px rgba(0,128,128,0.25), inset 0 1px 0 rgba(255,255,255,0.15)",
            transition: "all 0.2s ease",
            letterSpacing: connecting ? "0.05em" : "0.02em",
          }}
        >
          {connecting ? (
            <><Spinner/><span style={{ fontSize: 13, marginTop: 4 }}>Connecting...</span></>
          ) : (
            "Connect"
          )}
        </button>
      </div>

    </div>
  );
}