import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ScreenPage from "./pages/ScreenPage";
import CsvUploader from "./pages/CsvUpload";
import RecordsPage from "./pages/RecordsPage";
import ConnectPage from "./pages/Connect";
import IdentitySelect from "./pages/IdentitySelect";
import AdminLayout from "./layouts/AdminLayout";
import { DEVELOPER_MODE } from "./data/config";


const OpenLinkedInButtonPage = () => {

  // if (!DEVELOPER_MODE) {
  //   return (
  //     <div style={{ padding: "20px", textAlign: "center" }}>

  //       <h2>Developer Mode is Off</h2>
  //       <p>
  //         The Open LinkedIn Button is only available in Developer Mode. Please enable Developer Mode in the configuration to access this feature.
  //       </p>
  //     </div>
  //   );
  // }

  function openLinkedIn(input) {
  const isAndroid = /android/i.test(navigator.userAgent);
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);

  const getSlug = (value) => {
    if (!value) return "";

    const trimmed = String(value).trim();

    // If someone still passes just the slug, support that too.
    if (!/^https?:\/\//i.test(trimmed) && !/^www\./i.test(trimmed)) {
      return trimmed.replace(/^\/+|\/+$/g, "");
    }

    try {
      const url = new URL(
        /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
      );

      const parts = url.pathname.split("/").filter(Boolean);

      // Handles:
      // https://www.linkedin.com/in/some-slug
      // https://linkedin.com/in/some-slug/
      const inIndex = parts.findIndex((part) => part.toLowerCase() === "in");

      if (inIndex !== -1 && parts[inIndex + 1]) {
        return decodeURIComponent(parts[inIndex + 1]);
      }

      return "";
    } catch {
      return "";
    }
  };

  const slug = getSlug(input);

  if (!slug) {
    console.warn("Invalid LinkedIn profile URL or slug:", input);
    return;
  }

  const webURL = `https://www.linkedin.com/in/${encodeURIComponent(slug)}`;

  if (isAndroid) {
    window.location.href =
      `intent://in/${encodeURIComponent(slug)}` +
      `#Intent;scheme=linkedin;package=com.linkedin.android;` +
      `S.browser_fallback_url=${encodeURIComponent(webURL)};end`;
  } else if (isIOS) {
    window.location.href = `linkedin://in/${encodeURIComponent(slug)}`;

    setTimeout(() => {
      window.location.href = webURL;
    }, 1500);
  } else {
    window.location.href = webURL;
  }
}

return (
  <div>
    <h1>Open LinkedIn Profile</h1>
    <input
      type="text"
      placeholder="Enter LinkedIn profile URL or slug"
      onChange={(e) => openLinkedIn(e.target.value)}
    />
  </div>
);
}


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