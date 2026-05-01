import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ScreenPage from "./pages/ScreenPage";
import CsvUploader from "./pages/CsvUpload";
import RecordsPage from "./pages/RecordsPage";
import ConnectPage from "./pages/Connect";
import IdentitySelect from "./pages/IdentitySelect";
import AdminLayout from "./layouts/AdminLayout";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ScreenPage />} />
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