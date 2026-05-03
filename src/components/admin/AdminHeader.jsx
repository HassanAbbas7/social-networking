import { NavLink } from "react-router-dom";
import { useState } from "react";

export default function AdminHeader() {
  const [collapsed, setCollapsed] = useState(false);

  const linkClass = ({ isActive }) =>
    [
      "rounded-lg px-3 py-2 text-sm font-medium transition",
      isActive
        ? "bg-teal-600 text-white"
        : "text-gray-600 hover:bg-teal-50 hover:text-teal-700",
    ].join(" ");

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/90 backdrop-blur">

      {/* Collapse Button */}
      <div className="flex justify-end px-4 pt-2">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-sm px-3 py-1 rounded-md bg-gray-100 hover:bg-gray-200"
        >
          {collapsed ? "Expand" : "Collapse"}
        </button>
      </div>

      {/* Hide this whole section when collapsed */}
      {!collapsed && (
        <>
          <div className="relative text-center">
            <img
              src="/logo.png"
              alt="Logo"
              style={{
                position: "absolute",
                top: "25%",
                left: "23%",
                transform: "translate(-50%, -50%)",
                height: "69px",
                opacity: 0.89,
                zIndex: 0,
                pointerEvents: "none",
              }}
            />

            <div style={{ position: "relative", zIndex: 1 }}>
              <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">
                Building Ecosystems
              </h1>

              <h2
                className="text-sm font-medium text-teal-600 mt-1"
                style={{ fontSize: "41px", color: "teal" }}
              >
                Admin Panel
              </h2>

              <p className="text-xs text-gray-500 mt-1">
                Manage attendees, uploads, and QR records
              </p>
            </div>
          </div>

          <div className="mx-auto flex max-w-7xl items-center justify-between px-6">
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
        </>
      )}
    </header>
  );
}