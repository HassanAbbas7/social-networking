import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import ScreenPage from "./pages/ScreenPage";
import CsvUploader from "./pages/CsvUpload";
import RecordsPage from "./pages/RecordsPage";
import ConnectPage from "./pages/Connect";
import IdentitySelect from "./pages/IdentitySelect";
import AdminLayout from "./layouts/AdminLayout";
import Leaderboard from "./pages/LeaderboardPage";
import HomePage from "./pages/HomePage";

// ── Utility pages (language-agnostic) ────────────────────────────────────────

const OpenLinkedInButtonPage = () => {
  function openLinkedIn(input) {
    localStorage.clear();
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
      setTimeout(() => { window.location.href = webURL; }, 1500);
    } else {
      window.location.href = webURL;
    }
  }

  const [value, setValue] = useState("");
  return (
    <div>
      <h1>Open LinkedIn Profile</h1>
      <input
        type="text"
        placeholder="Enter LinkedIn profile URL or slug"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <button onClick={() => openLinkedIn(value)}>Open in LinkedIn</button>
    </div>
  );
};

const ClearLocalStorage = () => {
  useEffect(() => {
    localStorage.clear();
    const timer = setTimeout(() => { window.location.href = "/en/identity"; }, 4000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h1>Profile Cleared</h1>
      <p>Your locally stored profile is cleared, redirecting you to identity select page.</p>
    </div>
  );
};

// ── App ───────────────────────────────────────────────────────────────────────

function App() {
  return (
  <Router>
    <Routes>
      {/*
       * Root redirect — send bare "/" to the default English home.
       * Deep-links like /connect/:slug stay language-agnostic so that
       * QR codes printed on badges don't need a locale prefix.
       */}
      <Route path="/" element={<Navigate to="/en" replace />} />

      {/* Language-agnostic utility routes */}
      <Route path="/forget" element={<ClearLocalStorage />} />
      <Route path="/connect/:slug" element={<ConnectPage />} />

      {/* ── Localised routes: /en/... and /nl/... ───────────────────────── */}
      <Route path="/:lang">
        {/* Home: /en and /nl */}
        <Route index element={<HomePage />} />

        {/* Main pages */}
        <Route path="screen" element={<ScreenPage />} />
        <Route path="leaderboard" element={<Leaderboard />} />
        <Route path="identity" element={<IdentitySelect />} />

        {/* Connect with locale context */}
        <Route path="connect/:slug" element={<ConnectPage />} />

        {/* Admin routes */}
        <Route path="admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="upload" replace />} />
          <Route path="upload" element={<CsvUploader />} />
          <Route path="records" element={<RecordsPage />} />
        </Route>
      </Route>

      {/* Legacy paths — redirect to /en equivalent so old links still work */}
      <Route path="/screen" element={<Navigate to="/en/screen" replace />} />
      <Route
        path="/leaderboard"
        element={<Navigate to="/en/leaderboard" replace />}
      />
      <Route
        path="/identity"
        element={<Navigate to="/en/identity" replace />}
      />
      <Route
        path="/admin/*"
        element={<Navigate to="/en/admin/upload" replace />}
      />

      {/* Catch-all fallback */}
      <Route path="*" element={<Navigate to="/en" replace />} />
    </Routes>
  </Router>
);
}

export default App;