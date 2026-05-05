import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useState } from "react";
import ScreenPage from "./pages/ScreenPage";
import CsvUploader from "./pages/CsvUpload";
import RecordsPage from "./pages/RecordsPage";
import ConnectPage from "./pages/Connect";
import IdentitySelect from "./pages/IdentitySelect";
import AdminLayout from "./layouts/AdminLayout";
import { DEVELOPER_MODE } from "./data/config";


const OpenLinkedInButtonPage = () => {

  function openLinkedIn(input) {
    localStorage.clear(); // Clear localStorage to reset state for next profile
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

  // ✅ Fix: use a button + controlled input, not onChange
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
      <button onClick={() => openLinkedIn(value)}>
        Open in LinkedIn
      </button>
    </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        {/* <Route path="/" element={<ScreenPage />} /> */}
        <Route path="/" element={<OpenLinkedInButtonPage />} />
        <Route path="/connect/:slug" element={<ConnectPage />} />
        <Route path="/identity" element={<IdentitySelect />} />

        <Route path="/admin" element={<AdminLayout />}>
          <Route path="upload" element={<CsvUploader />} />
          <Route path="records" element={<RecordsPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;