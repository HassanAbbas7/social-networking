import { useState } from "react";
import { useParams } from "react-router-dom";
import Papa from "papaparse";
import {
  expectedColumns,
  TABLE_NAME,
  QR_BASE_URL,
  countryOptions,
  normalizeLanguage,
  getTranslations,
} from "../data/config";
import { createClient } from "@supabase/supabase-js";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { createBadgePng } from "../utils/badgeExporter";
import SingleUpload from "../components/common/SingleUpload";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

const countryLookup = new Map(
  countryOptions.flatMap(({ code, name }) => {
    const normalizedCode = code.toUpperCase();

    return [
      [code.toLowerCase(), normalizedCode],
      [normalizedCode.toLowerCase(), normalizedCode],
      [name.toLowerCase(), normalizedCode],
    ];
  })
);

function normalizeCountry(value) {
  const country = String(value || "").trim();
  if (!country) return null;

  return countryLookup.get(country.toLowerCase()) || country;
}

function downloadSampleCsv() {
  const headers = [
    "name",
    "company",
    "title",
    "sector",
    "country",
    "linkedin_url",
    "photo_url",
  ];

  const csvContent = `${headers.join(",")}\n`;
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

  saveAs(blob, "sample-upload.csv");
}

function safeFileName(name) {
  return String(name || "badge")
    .toLowerCase()
    .replace(/[^a-z0-9]/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function buildLocalizedConnectUrl(language, slug) {
  const cleanBaseUrl = String(QR_BASE_URL || "").replace(/\/connect\/?$/, "");
  const cleanSlug = String(slug || "").replace(/^\/+|\/+$/g, "");

  return `${cleanBaseUrl}/${language}/connect/${cleanSlug}`;
}

function replaceVars(template, values = {}) {
  return String(template || "").replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return values[key] ?? "";
  });
}

export default function CsvUploader() {
  const { lang } = useParams();
  const language = normalizeLanguage(lang);
  const t = getTranslations(language).csvUpload;

  const [status, setStatus] = useState("");
  const [loadedData, setLoadedData] = useState(null);

  const [isGeneratingBadge, setIsGeneratingBadge] = useState(false);
  const [badgeProgress, setBadgeProgress] = useState("");

  const isErrorStatus =
    status.toLowerCase().includes("failed") ||
    status.toLowerCase().includes("mislukt") ||
    status.toLowerCase().includes("missing") ||
    status.toLowerCase().includes("ontbrekende") ||
    status.toLowerCase().includes("empty") ||
    status.toLowerCase().includes("leeg");

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setStatus(t.readingCsv);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const rows = results.data;

          if (!rows.length) {
            setStatus(t.csvEmpty);
            return;
          }

          const csvColumns = Object.keys(rows[0]);
          console.log("CSV Columns:", csvColumns);

          const missingColumns = expectedColumns.filter(
            (col) => !csvColumns.includes(col)
          );

          if (missingColumns.length > 0) {
            setStatus(`${t.missingColumns}: ${missingColumns.join(", ")}`);
            return;
          }

          const cleanedRows = rows.map((row) => {
            const cleaned = {};

            expectedColumns.forEach((col) => {
              let value = row[col] === "" ? null : row[col];

              value = String(value || "").trim();

              cleaned[col] =
                col === "country"
                  ? normalizeCountry(value)
                  : col === "sector"
                  ? value.toLowerCase()
                  : value;
            });

            return cleaned;
          });

          setStatus(t.uploadingToSupabase);

          const { data, error } = await supabase
            .from(TABLE_NAME)
            .insert(cleanedRows)
            .select("*");

          if (error) {
            console.error(error);
            setStatus(`${t.uploadFailed}: ${error.message}`);
            return;
          }

          setStatus(
            replaceVars(t.uploadedRows, {
              count: cleanedRows.length,
            })
          );

          console.log("Inserted rows:", data);
          setLoadedData(data);
        } catch (err) {
          console.error(err);
          setStatus(t.uploadFailedGeneric);
        }
      },
      error: (error) => {
        console.error(error);
        setStatus(t.parseFailed);
      },
    });
  };

  async function downloadZip() {
    try {
      if (!loadedData?.length) {
        setBadgeProgress(t.noDataLoaded);
        return;
      }

      setIsGeneratingBadge(true);
      setBadgeProgress(t.generatingBadges);

      const zip = new JSZip();

      for (let i = 0; i < loadedData.length; i += 1) {
        const item = loadedData[i];

        const imageBlob = await createBadgePng({
          ...item,
          url: buildLocalizedConnectUrl(language, item.slug),
        });

        zip.file(
          `${String(i + 1).padStart(3, "0")}-${safeFileName(
            item.name
          )}-badge.png`,
          imageBlob
        );

        setBadgeProgress(
          replaceVars(t.generatedProgress, {
            current: i + 1,
            total: loadedData.length,
          })
        );
      }

      setBadgeProgress(t.creatingZip);

      const zipBlob = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
      });

      saveAs(zipBlob, "badges.zip");
      setBadgeProgress(t.done);
    } catch (err) {
      console.error(err);
      setBadgeProgress(t.failedZip);
    } finally {
      setIsGeneratingBadge(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-gray-900">
                {t.title}
              </h2>

              <p className="text-sm text-gray-500">{t.description}</p>

              {/* <p className="text-xs text-gray-400">
                {t.currentLanguageRoute}: /{language}/
              </p> */}
            </div>

            <button
              type="button"
              onClick={downloadSampleCsv}
              className="mt-4 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              {t.downloadSampleCsv}
            </button>

            <label className="mt-6 flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center transition hover:border-gray-400 hover:bg-gray-100">
              <span className="text-sm font-medium text-gray-700">
                {t.clickToUpload}
              </span>

              <span className="mt-1 text-xs text-gray-500">
                {t.onlyCsvSupported}
              </span>

              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {status && (
              <div
                className="mt-4 rounded-lg px-4 py-3 text-sm"
                style={{
                  backgroundColor: isErrorStatus ? "#FDE2E1" : "#E6F4EA",
                  color: isErrorStatus ? "#D93025" : "#137333",
                }}
              >
                {status}
              </div>
            )}

            {loadedData?.length > 0 && (
              <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {t.dataLoaded}
                    </p>

                    <p className="text-xs text-gray-500">
                      {replaceVars(t.rowsReady, {
                        count: loadedData.length,
                      })}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={downloadZip}
                    disabled={isGeneratingBadge}
                    className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isGeneratingBadge ? t.generating : t.generateBadgeZip}
                  </button>
                </div>

                {badgeProgress && (
                  <p className="mt-3 text-xs text-gray-500">
                    {badgeProgress}
                  </p>
                )}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <SingleUpload
              safeFileName={safeFileName}
              language={language}
              buildLocalizedConnectUrl={buildLocalizedConnectUrl}
            />
          </section>
        </div>
      </div>
    </main>
  );
}