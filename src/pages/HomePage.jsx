import { useNavigate, useParams } from "react-router-dom";
import { getTranslations, normalizeLanguage } from "../data/config";

export default function HomePage() {
  const navigate = useNavigate();
  const { lang } = useParams();

  const language = normalizeLanguage(lang);
  const t = getTranslations(language).homePage;

  const goTo = (path) => {
    navigate(`/${language}${path}`);
  };

  const toggleLanguage = () => {
    const nextLanguage = language === "nl" ? "en" : "nl";
    navigate(`/${nextLanguage}`);
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100 px-6">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-sm border border-gray-200">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={toggleLanguage}
            className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            {language === "nl" ? "Switch to English" : "Naar Nederlands"}
          </button>
        </div>

        <h1 className="mt-6 text-3xl font-semibold text-center text-gray-900">
          {t.title}
        </h1>

        <p className="mt-3 text-center text-sm text-gray-500">
          {t.subtitle}
        </p>

        <div className="mt-8 flex flex-col gap-4">
          <button
            type="button"
            onClick={() => goTo("/screen")}
            className="w-full rounded-2xl bg-teal-600 px-5 py-4 text-white font-medium hover:bg-teal-700 transition"
          >
            {t.screen}
          </button>

          <button
            type="button"
            onClick={() => goTo("/leaderboard")}
            className="w-full rounded-2xl bg-gray-900 px-5 py-4 text-white font-medium hover:bg-gray-700 transition"
          >
            {t.leaderboard}
          </button>

          <button
            type="button"
            onClick={() => goTo("/admin/upload")}
            className="w-full rounded-2xl bg-gray-900 px-5 py-4 text-white font-medium hover:bg-gray-700 transition"
          >
            {t.admin}
          </button>
        </div>
      </div>
    </main>
  );
}