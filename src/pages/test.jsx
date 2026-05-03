import { useState, useEffect, useRef } from "react";

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
function Flag({ country, size = 22 }) {
  const s = { display: "block", borderRadius: 2, flexShrink: 0 };
  switch (country) {
    case "Netherlands": return (
      <svg width={size} height={Math.round(size*0.67)} viewBox="0 0 3 2" style={s}>
        <rect width="3" height="0.667" fill="#AE1C28"/>
        <rect y="0.667" width="3" height="0.667" fill="#FFF"/>
        <rect y="1.333" width="3" height="0.667" fill="#21468B"/>
      </svg>
    );
    case "Sweden": return (
      <svg width={size} height={Math.round(size*0.625)} viewBox="0 0 16 10" style={s}>
        <rect width="16" height="10" fill="#006AA7"/>
        <rect x="5" width="2" height="10" fill="#FECC02"/>
        <rect y="4" width="16" height="2" fill="#FECC02"/>
      </svg>
    );
    case "USA": return (
      <svg width={size} height={Math.round(size*0.526)} viewBox="0 0 19 10" style={s}>
        <rect width="19" height="10" fill="#B22234"/>
        {[1,2,3,4,5].map(i=><rect key={i} y={i*1.54} width="19" height="0.77" fill="#FFF"/>)}
        <rect width="8" height="5.4" fill="#3C3B6E"/>
      </svg>
    );
    case "Germany": return (
      <svg width={size} height={Math.round(size*0.6)} viewBox="0 0 5 3" style={s}>
        <rect width="5" height="1" fill="#000"/>
        <rect y="1" width="5" height="1" fill="#DD0000"/>
        <rect y="2" width="5" height="1" fill="#FFCE00"/>
      </svg>
    );
    case "France": return (
      <svg width={size} height={Math.round(size*0.67)} viewBox="0 0 3 2" style={s}>
        <rect width="1" height="2" fill="#002395"/>
        <rect x="1" width="1" height="2" fill="#FFF"/>
        <rect x="2" width="1" height="2" fill="#ED2939"/>
      </svg>
    );
    case "UK": return (
      <svg width={size} height={Math.round(size*0.5)} viewBox="0 0 60 30" style={s}>
        <rect width="60" height="30" fill="#012169"/>
        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#FFF" strokeWidth="6"/>
        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" strokeWidth="4"/>
        <path d="M30,0 V30 M0,15 H60" stroke="#FFF" strokeWidth="10"/>
        <path d="M30,0 V30 M0,15 H60" stroke="#C8102E" strokeWidth="6"/>
      </svg>
    );
    case "Pakistan": return (
      <svg width={size} height={Math.round(size*0.67)} viewBox="0 0 3 2" style={s}>
        <rect width="0.75" height="2" fill="#FFF"/>
        <rect x="0.75" width="2.25" height="2" fill="#01411C"/>
        <circle cx="1.85" cy="1" r="0.45" fill="#FFF"/>
        <circle cx="1.97" cy="0.9" r="0.35" fill="#01411C"/>
        <polygon points="2.1,0.72 2.22,0.6 2.34,0.72 2.22,0.84" fill="#FFF" transform="translate(0.05,0) rotate(40,2.22,0.72)"/>
      </svg>
    );
    default: return (
      <svg width={size} height={Math.round(size*0.67)} viewBox="0 0 3 2" style={s}>
        <rect width="3" height="2" fill="#C4C0B8" rx="1"/>
      </svg>
    );
  }
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ name, color, size = 88 }) {
  const initials = name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
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

// ─── Spinner ──────────────────────────────────────────────────────────────────
function Spinner({ color }) {
  return (
    <div style={{
      width: 20, height: 20,
      border: `2.5px solid rgba(255,255,255,0.3)`,
      borderTopColor: "#FFF",
      borderRadius: "50%",
      animation: "spin 0.7s linear infinite",
    }}/>
  );
}

// ─── Demo profiles ────────────────────────────────────────────────────────────
const PROFILES = [
  { slug: "anna-bergstrom", firstName: "Anna", lastName: "Bergström", title: "Head of Sustainability", company: "Vattenfall", sector: "Energy", country: "Sweden", linkedin: "https://linkedin.com" },
  { slug: "pieter-janssen", firstName: "Pieter", lastName: "Janssen", title: "VP Risk & Compliance", company: "ING", sector: "Finance", country: "Netherlands", linkedin: "https://linkedin.com" },
  { slug: "james-crawford", firstName: "James", lastName: "Crawford", title: "Director of Engineering", company: "Microsoft", sector: "Tech", country: "USA", linkedin: "https://linkedin.com" },
  { slug: "sophie-laurent", firstName: "Sophie", lastName: "Laurent", title: "Chief Medical Officer", company: "Ramsay Santé", sector: "Health", country: "France", linkedin: "https://linkedin.com" },
];

const ATTENDEE_LIST = [
  "Anna Bergström — Vattenfall",
  "Pieter Janssen — ING",
  "James Crawford — Microsoft",
  "Sophie Laurent — Ramsay",
  "Marcus Weber — Bundesbank",
];

// ─── Screen: Profile (LOAD → TAP) ────────────────────────────────────────────
function ProfileScreen({ profile, onConnect, connecting }) {
  const cfg = SECTOR_CONFIG[profile.sector] || SECTOR_CONFIG.Other;
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Top brand strip */}
      <div style={{
        padding: "14px 20px 12px",
        borderBottom: "1px solid #EEE9E0",
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#008080" }}/>
        <span style={{
          fontSize: 10, fontWeight: 700, color: "#A8A39A",
          letterSpacing: "0.18em", textTransform: "uppercase",
        }}>Building Ecosystems 2026</span>
      </div>

      {/* Card body */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "32px 28px 0" }}>
        {/* Avatar */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 22 }}>
          <Avatar name={`${profile.firstName} ${profile.lastName}`} color={cfg.color} size={96}/>
        </div>

        {/* Name */}
        <div style={{ textAlign: "center", marginBottom: 6 }}>
          <div style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: 34, color: "#111", lineHeight: 1.1,
            letterSpacing: "-0.5px",
          }}>{profile.firstName} {profile.lastName}</div>
        </div>

        {/* Title + Company */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#008080", marginBottom: 3 }}>
            {profile.title}
          </div>
          <div style={{ fontSize: 13, color: "#9A9590", fontWeight: 400 }}>
            {profile.company}
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "#EEE9E0", marginBottom: 22 }}/>

        {/* Sector + Country row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 0 }}>
          {/* Sector pill */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: cfg.light, border: `1.5px solid ${cfg.color}50`,
            borderRadius: 100, padding: "6px 14px 6px 10px",
          }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: cfg.color }}/>
            <span style={{
              fontSize: 11, fontWeight: 700, color: cfg.color,
              letterSpacing: "0.1em", textTransform: "uppercase",
            }}>{profile.sector}</span>
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

      {/* ── Large circular Connect button — brand green, bottom dominant ── */}
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

// ─── Screen: Success ──────────────────────────────────────────────────────────
function SuccessScreen({ profile, connectionCount, onReset }) {
  const [countdown, setCountdown] = useState(2);
  const [redirected, setRedirected] = useState(false);
  const cfg = SECTOR_CONFIG[profile.sector] || SECTOR_CONFIG.Other;

  useEffect(() => {
    const t = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(t); setRedirected(true); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      height: "100%", alignItems: "center",
      justifyContent: "center", padding: "40px 28px",
      background: "#F8F7F4",
    }}>
      {/* Check circle */}
      <div style={{
        width: 80, height: 80, borderRadius: "50%",
        background: `linear-gradient(135deg, ${cfg.color}22, ${cfg.color}44)`,
        border: `3px solid ${cfg.color}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 28,
        animation: "popIn 0.4s cubic-bezier(0.34,1.56,0.64,1)",
      }}>
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
          <path d="M8 18L15 25L28 11" stroke={cfg.color} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      {/* Connected message */}
      <div style={{
        fontFamily: "'DM Serif Display', serif",
        fontSize: 32, color: "#111", textAlign: "center",
        lineHeight: 1.1, marginBottom: 10,
      }}>Connected!</div>

      <div style={{
        fontSize: 15, color: "#7A7570",
        textAlign: "center", marginBottom: 8,
      }}>
        You're now connected with{" "}
        <span style={{ color: cfg.color, fontWeight: 700 }}>{profile.firstName}</span>.
      </div>

      {/* Connection count reward */}
      <div style={{
        background: cfg.light,
        border: `1.5px solid ${cfg.color}40`,
        borderRadius: 12, padding: "10px 20px",
        marginBottom: 36, marginTop: 8,
        fontSize: 13, color: cfg.color,
        fontWeight: 600, textAlign: "center",
      }}>
        🎯 Connection {connectionCount} of your day
      </div>

      {/* Countdown bar */}
      {!redirected ? (
        <div style={{ width: "100%", maxWidth: 280 }}>
          <div style={{
            fontSize: 12, color: "#ACA79E", textAlign: "center",
            marginBottom: 10, fontWeight: 600, letterSpacing: "0.05em",
          }}>
            REDIRECTING TO LINKEDIN IN {countdown}s
          </div>
          <div style={{
            height: 4, background: "#EEE9E0",
            borderRadius: 100, overflow: "hidden",
          }}>
            <div style={{
              height: "100%", background: cfg.color,
              borderRadius: 100,
              width: `${(countdown / 2) * 100}%`,
              transition: "width 1s linear",
            }}/>
          </div>
        </div>
      ) : (
        <div style={{
          fontSize: 13, color: "#ACA79E",
          textAlign: "center",
        }}>
          Opening LinkedIn...
          <button onClick={onReset} style={{
            display: "block", margin: "14px auto 0",
            background: "none", border: "none",
            color: cfg.color, fontSize: 13,
            fontWeight: 600, cursor: "pointer",
            textDecoration: "underline",
          }}>← Back to demo</button>
        </div>
      )}
    </div>
  );
}

// ─── Screen: Edge Case ────────────────────────────────────────────────────────
function EdgeScreen({ type, profile, onReset }) {
  const [selected, setSelected] = useState("");
  const cfg = SECTOR_CONFIG[profile?.sector] || SECTOR_CONFIG.Finance;

  const configs = {
    self: {
      icon: "👋",
      title: "That's you!",
      body: "This is your profile — you are all set.",
      sub: "Point your camera at someone else's badge to connect.",
      cta: null,
    },
    duplicate: {
      icon: "✅",
      title: "Already connected",
      body: `You are already connected with ${profile?.firstName}.`,
      sub: "Your connection was logged earlier today.",
      cta: "View LinkedIn Profile",
    },
    notFound: {
      icon: "❓",
      title: "Profile not found",
      body: "This badge isn't registered in the system.",
      sub: "Ask a staff member at the registration desk to add you.",
      cta: null,
    },
  };

  const c = configs[type];

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
          To connect with others, we need to know who you are. Select your name from the list below — this only takes a moment.
        </div>
        <div style={{ marginBottom: 20 }}>
          <div style={{
            fontSize: 11, fontWeight: 700, color: "#ACA79E",
            letterSpacing: "0.14em", textTransform: "uppercase",
            marginBottom: 8,
          }}>Your name</div>
          <select
            value={selected}
            onChange={e => setSelected(e.target.value)}
            style={{
              width: "100%", padding: "14px 16px",
              border: "1.5px solid #E4DED4", borderRadius: 12,
              fontSize: 15, color: "#222",
              background: "#FFF", fontFamily: "'Outfit', sans-serif",
              appearance: "none",
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23ACA79E' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 16px center",
            }}
          >
            <option value="">— Choose your name —</option>
            {ATTENDEE_LIST.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div style={{
          fontSize: 12, color: "#C4BFB8", marginBottom: "auto",
          lineHeight: 1.6,
        }}>
          Your identity is saved to this browser. Next time you scan a badge, connection is one tap.
        </div>
        <button
          disabled={!selected}
          style={{
            width: "100%", padding: "18px 0",
            background: selected ? "radial-gradient(circle at 38% 35%, #00A090, #008080)" : "#E4DED4",
            border: "none", borderRadius: 16,
            color: selected ? "#FFF" : "#ACA79E",
            fontSize: 17, fontWeight: 700,
            fontFamily: "'Outfit', sans-serif",
            cursor: selected ? "pointer" : "default",
            marginBottom: 12,
            transition: "all 0.2s",
          }}
        >
          {selected ? "Continue →" : "Select your name to continue"}
        </button>
      </div>
    );
  }

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      height: "100%", alignItems: "center",
      justifyContent: "center", padding: "40px 28px",
    }}>
      <div style={{ fontSize: 56, marginBottom: 20 }}>{c.icon}</div>
      <div style={{
        fontFamily: "'DM Serif Display', serif",
        fontSize: 28, color: "#111", textAlign: "center",
        marginBottom: 12,
      }}>{c.title}</div>
      <div style={{ fontSize: 15, color: "#5A5751", textAlign: "center", marginBottom: 8, lineHeight: 1.6 }}>
        {c.body}
      </div>
      <div style={{ fontSize: 13, color: "#ACA79E", textAlign: "center", marginBottom: 36, lineHeight: 1.6 }}>
        {c.sub}
      </div>
      {c.cta && (
        <button style={{
          padding: "14px 28px", background: cfg.color,
          border: "none", borderRadius: 12, color: "#FFF",
          fontSize: 15, fontWeight: 700, cursor: "pointer",
          fontFamily: "'Outfit', sans-serif", marginBottom: 16,
        }}>{c.cta}</button>
      )}
      <button onClick={onReset} style={{
        background: "none", border: "none",
        color: "#ACA79E", fontSize: 13,
        cursor: "pointer", textDecoration: "underline",
        fontFamily: "'Outfit', sans-serif",
      }}>← Back to demo</button>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("profile");
  const [profileIdx, setProfileIdx] = useState(0);
  const [connecting, setConnecting] = useState(false);
  const [connectionCount] = useState(7);

  const profile = PROFILES[profileIdx];

  const handleConnect = () => {
    setConnecting(true);
    setTimeout(() => {
      setConnecting(false);
      setScreen("success");
    }, 1400);
  };

  const handleReset = () => {
    setScreen("profile");
    setConnecting(false);
  };

  // State switcher options
  const STATES = [
    { key: "profile",      label: "Profile" },
    { key: "self",         label: "Self-scan" },
    { key: "duplicate",    label: "Duplicate" },
    { key: "notActivated", label: "Not Activated" },
    { key: "notFound",     label: "Not Found" },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Outfit:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes popIn {
          0% { transform: scale(0.4); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes fadeUp {
          0% { opacity: 0; transform: translateY(14px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        select:focus { outline: none; border-color: #7F77DD; }
        button:active { transform: scale(0.98); }
      `}</style>

      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg, #1C1A17 0%, #252220 100%)",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "flex-start",
        padding: "32px 16px 40px",
        fontFamily: "'Outfit', sans-serif",
      }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{
            fontSize: 10, letterSpacing: "0.2em", color: "#504C47",
            textTransform: "uppercase", fontWeight: 600, marginBottom: 5,
          }}>Connect Screen · State Preview</div>
          <div style={{
            fontSize: 18, color: "#EDE9E2",
            fontFamily: "'DM Serif Display', serif",
          }}>QR Scan Flow</div>
        </div>

        {/* Profile switcher */}
        <div style={{
          display: "flex", gap: 6, marginBottom: 16,
          flexWrap: "wrap", justifyContent: "center",
        }}>
          {PROFILES.map((p, i) => {
            const c = SECTOR_CONFIG[p.sector].color;
            return (
              <button key={i} onClick={() => { setProfileIdx(i); handleReset(); }} style={{
                padding: "5px 12px", borderRadius: 100,
                border: `1.5px solid ${profileIdx === i ? c : "#3A3630"}`,
                background: profileIdx === i ? c : "transparent",
                color: profileIdx === i ? "#FFF" : "#6A6560",
                fontSize: 11, fontWeight: 700, cursor: "pointer",
                letterSpacing: "0.05em", fontFamily: "'Outfit', sans-serif",
              }}>{p.firstName}</button>
            );
          })}
        </div>

        {/* State switcher */}
        <div style={{
          display: "flex", gap: 6, marginBottom: 24,
          flexWrap: "wrap", justifyContent: "center",
        }}>
          {STATES.map(s => (
            <button key={s.key} onClick={() => { setScreen(s.key); setConnecting(false); }} style={{
              padding: "5px 12px", borderRadius: 100,
              border: `1.5px solid ${screen === s.key ? "#EDE9E2" : "#3A3630"}`,
              background: screen === s.key ? "#EDE9E2" : "transparent",
              color: screen === s.key ? "#1C1A17" : "#6A6560",
              fontSize: 11, fontWeight: 700, cursor: "pointer",
              letterSpacing: "0.05em", fontFamily: "'Outfit', sans-serif",
            }}>{s.label}</button>
          ))}
        </div>

        {/* Phone frame */}
        <div style={{
          width: 390, maxWidth: "100%",
          background: "#F8F7F4",
          borderRadius: 44,
          overflow: "hidden",
          boxShadow: "0 0 0 10px #2A2724, 0 0 0 12px #3A3630, 0 40px 80px rgba(0,0,0,0.6)",
          minHeight: 720,
          display: "flex", flexDirection: "column",
          position: "relative",
          animation: "fadeUp 0.3s ease",
        }}>
          {/* Status bar */}
          <div style={{
            padding: "14px 24px 6px",
            display: "flex", justifyContent: "space-between",
            fontSize: 12, fontWeight: 600, color: "#5A5550",
            background: "#F8F7F4",
          }}>
            <span>9:41</span>
            <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <svg width="16" height="12" viewBox="0 0 16 12" fill="#5A5550">
                <rect x="0" y="4" width="3" height="8" rx="1"/>
                <rect x="4.5" y="2.5" width="3" height="9.5" rx="1"/>
                <rect x="9" y="0.5" width="3" height="11.5" rx="1"/>
                <rect x="13.5" y="0" width="2.5" height="12" rx="1" opacity="0.3"/>
              </svg>
              <svg width="15" height="12" viewBox="0 0 15 12" fill="#5A5550">
                <path d="M7.5 2.5 C10.5 2.5 13 4.5 14 7 C13 5 10.5 3.5 7.5 3.5 C4.5 3.5 2 5 1 7 C2 4.5 4.5 2.5 7.5 2.5Z"/>
                <circle cx="7.5" cy="10" r="1.5"/>
              </svg>
              <span>100%</span>
            </span>
          </div>

          {/* Screen content */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            {screen === "profile" && (
              <ProfileScreen
                profile={profile}
                onConnect={handleConnect}
                connecting={connecting}
              />
            )}
            {screen === "success" && (
              <SuccessScreen
                profile={profile}
                connectionCount={connectionCount}
                onReset={handleReset}
              />
            )}
            {(screen === "self" || screen === "duplicate" || screen === "notFound") && (
              <EdgeScreen type={screen} profile={profile} onReset={handleReset}/>
            )}
            {screen === "notActivated" && (
              <EdgeScreen type="notActivated" profile={profile} onReset={handleReset}/>
            )}
          </div>

          {/* Home indicator */}
          <div style={{
            height: 32, display: "flex",
            alignItems: "center", justifyContent: "center",
            background: "#F8F7F4",
          }}>
            <div style={{
              width: 120, height: 5,
              background: "#D4CFC6", borderRadius: 100,
            }}/>
          </div>
        </div>

        {/* Spec callout */}
        <div style={{
          marginTop: 28, maxWidth: 390, width: "100%",
          background: "#23201D", borderRadius: 12,
          padding: "16px 20px", border: "1px solid #333",
        }}>
          <div style={{
            fontSize: 10, color: "#504C47", letterSpacing: "0.14em",
            textTransform: "uppercase", fontWeight: 600, marginBottom: 10,
          }}>What this demo covers</div>
          {[
            "✓  Initials avatar colour-coded by sector",
            "✓  Sector colour-coded badge (not table row)",
            "✓  SVG country flags (not text abbreviations)",
            "✓  Single dominant CTA — no other tappable elements",
            "✓  Connection logged before LinkedIn redirect",
            "✓  Success: connection count reward + countdown",
            "✓  Edge: Self-scan, Duplicate, Not Activated, Not Found",
          ].map(t => (
            <div key={t} style={{
              fontSize: 12, color: "#6A6560", marginBottom: 5,
              fontFamily: "'Outfit', sans-serif",
            }}>{t}</div>
          ))}
        </div>
      </div>
    </>
  );
}