// src/components/admin/AdminHeader.jsx
import { NavLink } from "react-router-dom";

export default function AdminHeader() {
  const linkClass = ({ isActive }) =>
    [
      "rounded-lg px-3 py-2 text-sm font-medium transition",
      isActive
        ? "bg-gray-900 text-white"
        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
    ].join(" ");

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">
            Networking Map Admin
          </h1>
          <p className="text-xs text-gray-500">
            Manage attendees, uploads, and QR records
          </p>
        </div>

        <nav className="flex items-center gap-2">
          <NavLink to="/admin/upload" className={linkClass}>
            Upload
          </NavLink>

          <NavLink to="/admin/records" className={linkClass}>
            Records
          </NavLink>

          <NavLink to="/" className={linkClass}>
            Live Screen
          </NavLink>
        </nav>
      </div>
    </header>
  );
}