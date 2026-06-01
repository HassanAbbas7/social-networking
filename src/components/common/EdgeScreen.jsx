// src/components/admin/EdgeScreen.jsx
import { useState } from "react";
import { useParams } from "react-router-dom";
import {
  SECTOR_CONFIG,
  getTranslations,
  normalizeLanguage,
} from "../../data/config";

// Pass attendeeList as a prop — fetch from Supabase in the parent
export default function EdgeScreen({
  type,
  profile,
  onReset,
  attendeeList = [],
  onActivate,
}) {
  const { lang } = useParams();

  const language = normalizeLanguage(lang);
  const t = getTranslations(language).edgeScreen;

  const [selected, setSelected] = useState("");

  const cfg = SECTOR_CONFIG[profile?.sector] || SECTOR_CONFIG.consultancy;

  function replaceVars(template, values = {}) {
    return String(template || "").replace(/\{\{(\w+)\}\}/g, (_, key) => {
      return values[key] ?? "";
    });
  }

  const firstName = profile?.name?.split(" ")[0] || "";

  const configs = {
    self: {
      icon: t.states.self.icon,
      title: t.states.self.title,
      body: t.states.self.body,
      sub: t.states.self.sub,
      cta: null,
    },

    duplicate: {
      icon: t.states.duplicate.icon,
      title: t.states.duplicate.title,
      body: replaceVars(t.states.duplicate.body, {
        name: firstName,
      }),
      sub: t.states.duplicate.sub,
      cta: {
        label: t.states.duplicate.ctaLabel,
        action: () =>
          window.open(profile?.linkedin_url || profile?.linkedin, "_blank"),
      },
    },

    notFound: {
      icon: t.states.notFound.icon,
      title: t.states.notFound.title,
      body: t.states.notFound.body,
      sub: t.states.notFound.sub,
      cta: null,
    },
  };

  // ── Not Activated: identity picker ──
  if (type === "notActivated") {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          padding: "40px 28px",
        }}
      >
        <div
          style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: 26,
            color: "#111",
            marginBottom: 10,
          }}
        >
          {t.notActivated.title}
        </div>

        <div
          style={{
            fontSize: 14,
            color: "#7A7570",
            marginBottom: 28,
            lineHeight: 1.6,
          }}
        >
          {t.notActivated.description}
        </div>

        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#ACA79E",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            {t.notActivated.nameLabel}
          </div>

          <select
            value={selected}
            onChange={(event) => setSelected(event.target.value)}
            style={{
              width: "100%",
              padding: "14px 16px",
              border: "1.5px solid #E4DED4",
              borderRadius: 12,
              fontSize: 15,
              color: "#222",
              background: "#FFF",
              fontFamily: "'Outfit', sans-serif",
              appearance: "none",
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23ACA79E' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 16px center",
            }}
          >
            <option value="">{t.notActivated.chooseName}</option>

            {attendeeList.map((attendee) => (
              <option key={attendee.slug} value={attendee.slug}>
                {attendee.name} — {attendee.company}
              </option>
            ))}
          </select>
        </div>

        <div
          style={{
            fontSize: 12,
            color: "#C4BFB8",
            marginBottom: "auto",
            lineHeight: 1.6,
          }}
        >
          {t.notActivated.identitySaved}
        </div>

        <button
          disabled={!selected}
          onClick={() => selected && onActivate?.(selected)}
          style={{
            width: "100%",
            padding: "18px 0",
            background: selected
              ? "radial-gradient(circle at 38% 35%, #00A090, #008080)"
              : "#E4DED4",
            border: "none",
            borderRadius: 16,
            color: selected ? "#FFF" : "#ACA79E",
            fontSize: 17,
            fontWeight: 700,
            fontFamily: "'Outfit', sans-serif",
            cursor: selected ? "pointer" : "default",
            marginBottom: 12,
            transition: "all 0.2s",
          }}
        >
          {selected
            ? t.notActivated.continue
            : t.notActivated.selectNameToContinue}
        </button>
      </div>
    );
  }

  // ── self / duplicate / notFound ──
  const c = configs[type];

  if (!c) return null;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 28px",
      }}
    >
      <div style={{ fontSize: 56, marginBottom: 20 }}>{c.icon}</div>

      <div
        style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: 28,
          color: "#111",
          textAlign: "center",
          marginBottom: 12,
        }}
      >
        {c.title}
      </div>

      <div
        style={{
          fontSize: 15,
          color: "#5A5751",
          textAlign: "center",
          marginBottom: 8,
          lineHeight: 1.6,
        }}
      >
        {c.body}
      </div>

      <div
        style={{
          fontSize: 13,
          color: "#ACA79E",
          textAlign: "center",
          marginBottom: 36,
          lineHeight: 1.6,
        }}
      >
        {c.sub}
      </div>

      {c.cta && (
        <button
          onClick={c.cta.action}
          style={{
            padding: "14px 28px",
            background: cfg.color,
            border: "none",
            borderRadius: 12,
            color: "#FFF",
            fontSize: 15,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "'Outfit', sans-serif",
            marginBottom: 16,
          }}
        >
          {c.cta.label}
        </button>
      )}

      {onReset && (
        <button
          onClick={onReset}
          style={{
            background: "none",
            border: "none",
            color: "#ACA79E",
            fontSize: 13,
            cursor: "pointer",
            textDecoration: "underline",
            fontFamily: "'Outfit', sans-serif",
          }}
        >
          {t.back}
        </button>
      )}
    </div>
  );
}