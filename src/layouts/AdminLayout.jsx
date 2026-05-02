// src/layouts/AdminLayout.jsx
import { Outlet } from "react-router-dom";
import AdminHeader from "../components/admin/AdminHeader";
import AdminGate from "../components/admin/AdminGate";

export default function AdminLayout() {
  return (
    <AdminGate>
      <div className="min-h-screen bg-gray-50">
        <AdminHeader />

        <main>
          <Outlet />
        </main>
      </div>
    </AdminGate>
  );
}