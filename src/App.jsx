import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ScreenPage from "./pages/ScreenPage";
import ProfilePage from "./pages/Profile";
import CsvUploader from "./pages/CsvUpload";
import RecordsPage from "./pages/RecordsPage";
import ConnectPage from "./pages/Connect";


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ScreenPage />} />
        <Route path="/connect/:slug" element={<ConnectPage />} />
        <Route path="/upload" element={<CsvUploader />} />
        <Route path="/records" element={<RecordsPage />} />
      </Routes>
    </Router>
  );
}
export default App;