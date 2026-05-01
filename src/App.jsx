import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ScreenPage from "./pages/ScreenPage";
import ProfilePage from "./pages/Profile";
import CsvUploader from "./pages/CsvUpload";
import RecordsPage from "./pages/RecordsPage";
import ConnectPage from "./pages/Connect";
import IdentitySelect from "./pages/IdentitySelect";
import IdentityConfirm from "./pages/IdentityConfirm";


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ScreenPage />} />
        <Route path="/connect/:slug" element={<ConnectPage />} />
        <Route path="/upload" element={<CsvUploader />} />
        <Route path="/records" element={<RecordsPage />} />
        <Route path="/identity" element={<IdentitySelect />} />
      </Routes>
    </Router>
  );
}
export default App;