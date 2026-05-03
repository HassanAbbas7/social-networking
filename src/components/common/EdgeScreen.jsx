import { useState } from "react";

const SECTOR_CONFIG = {
  Tech:            { color: "#378ADD", light: "#EBF4FF" },
  Finance:         { color: "#7F77DD", light: "#EEEDFA" },
  Health:          { color: "#1D9E75", light: "#E5F5EF" },
  Energy:          { color: "#EF9F27", light: "#FDF4E7" },
  "Public Sector": { color: "#D85A30", light: "#FCEEE9" },
  Other:           { color: "#7A7A78", light: "#F2F2F1" },
};

// Pass attendeeList as a prop — fetch from Supabase in the parent
export default function EdgeScreen({ type, profile, onReset, attendeeList = [], onActivate }) {
  const [selected, setSelected] = useState("");
  const cfg = SECTOR_CONFIG[profile?.sector] || SECTOR_CONFIG.Finance;

  const configs = {
    self: {
      icon: "👋",
      title: "That's you!",
      body: "This is your own profile.",
      sub: "Point your camera at someone else's badge to connect.",
      cta: null,
    },
    duplicate: {
      icon: "✅",
      title: "Already connected",
      body: `You're already connected with ${profile?.name?.split(" ")[0]}.`,
      sub: "Your connection was logged earlier today.",
      cta: {
        label: "View LinkedIn Profile",
        action: () => window.open(profile?.linkedin_url || profile?.linkedin, "_blank"),
      },
    },
    notFound: {
      icon: "❓",
      title: "Profile not found",
      body: "This badge isn't registered in the system.",
      sub: "Ask a staff member at the registration desk for help.",
      cta: null,
    },
  };

  // ── Not Activated: identity picker ──
  if (type === "notActivated") {
    return (
      <div style={{
        display: "flex", flexDirection: "column",
        height: "100%", padding: "40px 28px",
      }}>
        <div style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: 26, color: "#111", marginBottom: 10,
        }}>Welcome!</div>

        <div style={{ fontSize: 14, color: "#7A7570", marginBottom: 28, lineHeight: 1.6 }}>
          To connect with others, we need to know who you are. Select your name below — this only takes a moment.
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{
            fontSize: 11, fontWeight: 700, color: "#ACA79E",
            letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 8,
          }}>Your name</div>

          <select
            value={selected}
            onChange={e => setSelected(e.target.value)}
            style={{
              width: "100%", padding: "14px 16px",
              border: "1.5px solid #E4DED4", borderRadius: 12,
              fontSize: 15, color: "#222", background: "#FFF",
              fontFamily: "'Outfit', sans-serif", appearance: "none",
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23ACA79E' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 16px center",
            }}
          >
            <option value="">— Choose your name —</option>
            {attendeeList.map(a => (
              <option key={a.slug} value={a.slug}>
                {a.name} — {a.company}
              </option>
            ))}
          </select>
        </div>

        <div style={{
          fontSize: 12, color: "#C4BFB8", marginBottom: "auto", lineHeight: 1.6,
        }}>
          Your identity is saved to this browser. Next time you scan a badge, connecting is one tap.
        </div>

        <button
          disabled={!selected}
          onClick={() => selected && onActivate?.(selected)}
          style={{
            width: "100%", padding: "18px 0",
            background: selected
              ? "radial-gradient(circle at 38% 35%, #00A090, #008080)"
              : "#E4DED4",
            border: "none", borderRadius: 16,
            color: selected ? "#FFF" : "#ACA79E",
            fontSize: 17, fontWeight: 700,
            fontFamily: "'Outfit', sans-serif",
            cursor: selected ? "pointer" : "default",
            marginBottom: 12, transition: "all 0.2s",
          }}
        >
          {selected ? "Continue →" : "Select your name to continue"}
        </button>
      </div>
    );
  }

  // ── self / duplicate / notFound ──
  const c = configs[type];
  if (!c) return null;

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      height: "100%", alignItems: "center",
      justifyContent: "center", padding: "40px 28px",
    }}>
      <div style={{ fontSize: 56, marginBottom: 20 }}>{c.icon}</div>

      <div style={{
        fontFamily: "'DM Serif Display', serif",
        fontSize: 28, color: "#111", textAlign: "center", marginBottom: 12,
      }}>{c.title}</div>

      <div style={{ fontSize: 15, color: "#5A5751", textAlign: "center", marginBottom: 8, lineHeight: 1.6 }}>
        {c.body}
      </div>

      <div style={{ fontSize: 13, color: "#ACA79E", textAlign: "center", marginBottom: 36, lineHeight: 1.6 }}>
        {c.sub}
      </div>

      {c.cta && (
        <button
          onClick={c.cta.action}
          style={{
            padding: "14px 28px", background: cfg.color,
            border: "none", borderRadius: 12, color: "#FFF",
            fontSize: 15, fontWeight: 700, cursor: "pointer",
            fontFamily: "'Outfit', sans-serif", marginBottom: 16,
          }}
        >{c.cta.label}</button>
      )}

      {onReset && (
        <button onClick={onReset} style={{
          background: "none", border: "none",
          color: "#ACA79E", fontSize: 13,
          cursor: "pointer", textDecoration: "underline",
          fontFamily: "'Outfit', sans-serif",
        }}>← Back</button>
      )}
    </div>
  );
}