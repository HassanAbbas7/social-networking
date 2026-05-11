import { useState } from "react";
import Papa from "papaparse";
import {
  expectedColumns,
  TABLE_NAME,
  QR_BASE_URL,
  DEVELOPER_MODE,
  countryOptions,
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

export default function CsvUploader() {
  const [status, setStatus] = useState("");
  const [loadedData, setLoadedData] = useState(null);

  const [isGeneratingBadge, setIsGeneratingBadge] = useState(false);
  const [badgeProgress, setBadgeProgress] = useState("");

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setStatus("Reading CSV...");

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const rows = results.data;

          if (!rows.length) {
            setStatus("CSV is empty.");
            return;
          }

          const csvColumns = Object.keys(rows[0]);
          console.log("CSV Columns:", csvColumns);

          const missingColumns = expectedColumns.filter(
            (col) => !csvColumns.includes(col)
          );

          if (missingColumns.length > 0) {
            setStatus(`Missing columns: ${missingColumns.join(", ")}`);
            return;
          }

          const cleanedRows = rows.map((row) => {
            const cleaned = {};

            expectedColumns.forEach((col) => {
              
              var value = row[col] === "" ? null : row[col];

              value = String(value || "").trim();
              cleaned[col] = col === "country" ? normalizeCountry(value) : col === "sector" ? value.toLowerCase() : value;
            });

            return cleaned;
          });

          setStatus("Uploading to Supabase...");

          const { data, error } = await supabase
            .from(TABLE_NAME)
            .insert(cleanedRows)
            .select("*");

          if (error) {
            console.error(error);
            setStatus(`Upload failed: ${error.message}`);
            return;
          }

          setStatus(`Uploaded ${cleanedRows.length} rows successfully.`);
          console.log("Inserted rows:", data);
          setLoadedData(data);
        } catch (err) {
          console.error(err);
          setStatus("Upload failed, Something went wrong while uploading.");
        }
      },
      error: (error) => {
        console.error(error);
        setStatus("Failed to parse CSV.");
      },
    });
  };

  function safeFileName(name) {
    return String(name || "badge")
      .toLowerCase()
      .replace(/[^a-z0-9]/gi, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }




  async function downloadZip() {
    try {
      if (!loadedData?.length) {
        setBadgeProgress("No data loaded.");
        return;
      }

      setIsGeneratingBadge(true);
      setBadgeProgress("Generating badges...");

      const zip = new JSZip();

      for (let i = 0; i < loadedData.length; i += 1) {
        const item = loadedData[i];

        const imageBlob = await createBadgePng({
          ...item,
          url: `${QR_BASE_URL}${item.slug}`,
        });

        zip.file(
          `${String(i + 1).padStart(3, "0")}-${safeFileName(item.name)}-badge.png`,
          imageBlob
        );

        setBadgeProgress(`Generated ${i + 1} of ${loadedData.length}`);
      }

      setBadgeProgress("Creating ZIP...");

      const zipBlob = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
      });

      saveAs(zipBlob, "badges.zip");
      setBadgeProgress("Done.");
    } catch (err) {
      console.error(err);
      setBadgeProgress("Failed to generate badges ZIP.");
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
                CSV Upload
              </h2>
              <p className="text-sm text-gray-500">
                Upload a CSV with columns matching your Supabase table.
              </p>
            </div>

            <button
              type="button"
              onClick={downloadSampleCsv}
              className="mt-4 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Download sample CSV
            </button>

            <label className="mt-6 flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center transition hover:border-gray-400 hover:bg-gray-100">
              <span className="text-sm font-medium text-gray-700">
                Click to upload CSV
              </span>
              <span className="mt-1 text-xs text-gray-500">
                Only .csv files are supported
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
                  backgroundColor:
                    status.toLowerCase().includes("failed") ||
                      status.toLowerCase().includes("missing") ||
                      status.toLowerCase().includes("empty")
                      ? "#FDE2E1"
                      : "#E6F4EA",
                  color:
                    status.toLowerCase().includes("failed") ||
                      status.toLowerCase().includes("missing") ||
                      status.toLowerCase().includes("empty")
                      ? "#D93025"
                      : "#137333",
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
                      Data loaded
                    </p>
                    <p className="text-xs text-gray-500">
                      {loadedData.length} rows are ready for badge generation.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={downloadZip}
                    disabled={isGeneratingBadge}
                    className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isGeneratingBadge ? "Generating..." : "Generate Badge ZIP"}
                  </button>
                </div>

                {badgeProgress && (
                  <p className="mt-3 text-xs text-gray-500">{badgeProgress}</p>
                )}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <SingleUpload
              safeFileName={safeFileName}
            />
          </section>
        </div>
      </div>
    </main>
  );
}