import { useState, useEffect } from "react";

const SECTOR_CONFIG = {
  Tech: { color: "#378ADD", light: "#EBF4FF" },
  Finance: { color: "#7F77DD", light: "#EEEDFA" },
  Health: { color: "#1D9E75", light: "#E5F5EF" },
  Energy: { color: "#EF9F27", light: "#FDF4E7" },
  "Public Sector": { color: "#D85A30", light: "#FCEEE9" },
  Other: { color: "#7A7A78", light: "#F2F2F1" },
};

function openLinkedIn(input) {
    const isAndroid = /android/i.test(navigator.userAgent);
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);

    const getSlug = (value) => {
      if (!value) return "";
      const trimmed = String(value).trim();

      if (!/^https?:\/\//i.test(trimmed) && !/^www\./i.test(trimmed)) {
        return trimmed.replace(/^\/+|\/+$/g, "");
      }

      try {
        const url = new URL(
          /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
        );
        const parts = url.pathname.split("/").filter(Boolean);
        const inIndex = parts.findIndex((p) => p.toLowerCase() === "in");
        if (inIndex !== -1 && parts[inIndex + 1]) {
          return decodeURIComponent(parts[inIndex + 1]);
        }
        return "";
      } catch {
        return "";
      }
    };

    const slug = getSlug(input);
    if (!slug) return;

    const webURL = `https://www.linkedin.com/in/${encodeURIComponent(slug)}`;

    if (isAndroid) {
      // ✅ Fix: use www.linkedin.com as the host in the intent URI
      window.location.href =
        `intent://www.linkedin.com/in/${encodeURIComponent(slug)}` +
        `#Intent;` +
        `action=android.intent.action.VIEW;` +
        `category=android.intent.category.BROWSABLE;` +
        `scheme=https;` +
        `package=com.linkedin.android;` +
        `S.browser_fallback_url=${encodeURIComponent(webURL)};` +
        `end`;
    } else if (isIOS) {
      window.location.href = `linkedin://in/${encodeURIComponent(slug)}`;
      setTimeout(() => {
        window.location.href = webURL;
      }, 1500);
    } else {
      window.location.href = webURL;
    }
  }

const DURATION = 4;

export default function SuccessScreen({ profile, connectionCount, onReset }) {
  const cfg = SECTOR_CONFIG[profile.sector] || SECTOR_CONFIG.Other;

  const [startTime] = useState(Date.now());
  const [countdown, setCountdown] = useState(DURATION);

  useEffect(() => {
    const t = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      const remaining = Math.max(DURATION - elapsed, 0);

      setCountdown(remaining);

      if (remaining <= 0) {
        clearInterval(t);
        openLinkedIn(profile.linkedin_url);
        // window.location.href = deepLink;
      }
    }, 50);

    return () => clearInterval(t);
  }, []);

  return (
  <div
    style={{
      minHeight: "100dvh",
      width: "100%",
      boxSizing: "border-box",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 28px",
      background: "#F8F7F4",
    }}
  >
      {/* Check circle */}
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: "50%",
          background: `linear-gradient(135deg, ${cfg.color}22, ${cfg.color}44)`,
          border: `3px solid ${cfg.color}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 28,
          animation: "popIn 0.4s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
          <path
            d="M8 18L15 25L28 11"
            stroke={cfg.color}
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <div
        style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: 32,
          color: "#111",
          textAlign: "center",
          lineHeight: 1.1,
          marginBottom: 10,
        }}
      >
        Connected!
      </div>

      <div
        style={{
          fontSize: 15,
          color: "#7A7570",
          textAlign: "center",
          marginBottom: 8,
        }}
      >
        You're now connected with{" "}
        <span style={{ color: cfg.color, fontWeight: 700 }}>
          {profile.name?.split(" ")[0]}
        </span>
        .
      </div>

      <div
        style={{
          background: cfg.light,
          border: `1.5px solid ${cfg.color}40`,
          borderRadius: 12,
          padding: "10px 20px",
          marginBottom: 36,
          marginTop: 8,
          fontSize: 13,
          color: cfg.color,
          fontWeight: 600,
          textAlign: "center",
        }}
      >
        🎯 Connection {connectionCount} of your day
      </div>

      {/* Countdown */}
      <div style={{ width: "100%", maxWidth: 280 }}>
        <div
          style={{
            fontSize: 12,
            color: "#ACA79E",
            textAlign: "center",
            marginBottom: 10,
            fontWeight: 600,
            letterSpacing: "0.05em",
          }}
        >
          REDIRECTING TO LINKEDIN IN {Math.ceil(countdown)}s
        </div>

        <div
          style={{
            height: 4,
            background: "#EEE9E0",
            borderRadius: 100,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              background: cfg.color,
              borderRadius: 100,
              width: `${(countdown / DURATION) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Reset */}
      {onReset && (
        <button
          onClick={onReset}
          style={{
            marginTop: 30,
            background: "none",
            border: "none",
            color: cfg.color,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            textDecoration: "underline",
          }}
        >
          ← Back
        </button>
      )}
    </div>
  );
}