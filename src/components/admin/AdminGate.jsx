// src/components/admin/AdminGate.jsx
import { useState } from "react";

const ADMIN_SESSION_KEY = "admin_authenticated";

export default function AdminGate({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(
    sessionStorage.getItem(ADMIN_SESSION_KEY) === "true"
  );

  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event) {
    event.preventDefault();

    const adminPassword = import.meta.env["VITE_ADMIN_PASSWORD"];

    if (!adminPassword) {
      setError("Admin password is not configured.");
      return;
    }

    if (password === adminPassword) {
      sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
      setIsAuthenticated(true);
      setError("");
      return;
    }

    setError("Incorrect password.");
  }

  if (isAuthenticated) {
    return children;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        <h1 className="text-xl font-semibold text-gray-900">
          Admin Access
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          Enter the admin password to continue.
        </p>

        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Password"
          className="mt-5 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-900"
        />

        {error && (
          <p className="mt-3 text-sm text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="mt-5 w-full rounded-xl bg-gray-900 px-4 py-3 text-sm font-medium text-white hover:bg-gray-700"
        >
          Unlock Admin
        </button>
      </form>
    </div>
  );
}