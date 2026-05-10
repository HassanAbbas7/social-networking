import { useNavigate } from "react-router-dom";

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100 px-6">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-sm border border-gray-200">
        <h1 className="text-3xl font-semibold text-center text-gray-900">
          Building Ecosystems
        </h1>

        <p className="mt-3 text-center text-sm text-gray-500">
          Choose where you want to go
        </p>

        <div className="mt-8 flex flex-col gap-4">
          <button
            onClick={() => navigate("/screen")}
            className="w-full rounded-2xl bg-teal-600 px-5 py-4 text-white font-medium hover:bg-teal-700 transition"
          >
            Screen
          </button>

          <button
            onClick={() => navigate("/leaderboard")}
            className="w-full rounded-2xl bg-gray-900 px-5 py-4 text-white font-medium hover:bg-gray-700 transition"
          >
            Leaderboard
          </button>

          <button
            onClick={() => navigate("/admin")}
            className="w-full rounded-2xl bg-gray-900 px-5 py-4 text-white font-medium hover:bg-gray-700 transition"
          >
            Admin
          </button>
        </div>
      </div>
    </main>
  );
}