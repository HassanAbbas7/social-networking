import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ScreenPage from "./pages/ScreenPage";
import ProfilePage from "./pages/Profile";
import CsvUploader from "./pages/CsvUpload";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ScreenPage />} />
        <Route path="/profile/:id" element={<ProfilePage />} />
        <Route path="/upload" element={<CsvUploader />} />
      </Routes>
    </Router>
  );
}
export default App;