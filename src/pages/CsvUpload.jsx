import { useState } from "react";
import Papa from "papaparse";
import { expectedColumns, TABLE_NAME, QR_BASE_URL } from "../data/config";
import { createClient } from "@supabase/supabase-js";
import QRCode from "qrcode";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import SingleUpload from "../components/common/SingleUpload";


const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);



export default function CsvUploader() {
  const [status, setStatus] = useState("");
  const [loadedData, setLoadedData] = useState(null);

  const [isGeneratingQr, setIsGeneratingQr] = useState(false);
  const [qrProgress, setQrProgress] = useState("");

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
              cleaned[col] = row[col] === "" ? null : row[col];
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
      }
    });
  };


  function safeFileName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function createQrImage(profile) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  const width = 600;
  const height = 900;

  canvas.width = width;
  canvas.height = height;

  // Background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  // --- Sector color mapping ---
  const sectorColors = {
    Tech: "#378ADD",
    Finance: "#7F77DD",
    Health: "#1D9E75",
    Energy: "#EF9F27",
    "Public sector": "#D85A30",
    Other: "#888780",
  };

  const sectorColor = sectorColors[profile.sector] || "#888780";

  // --- Left color strip ---
  ctx.fillStyle = sectorColor;
  ctx.fillRect(0, 0, 16, height);

  // --- Name split ---
  const [firstName, ...rest] = profile.name.split(" ");
  const lastName = rest.join(" ");

  // --- First name (large) ---
  ctx.fillStyle = "#111";
  ctx.font = "bold 48px Arial";
  ctx.textAlign = "left";
  ctx.fillText(firstName, 40, 90);

  // --- Last name + company ---
  ctx.font = "24px Arial";
  ctx.fillStyle = "#444";
  ctx.fillText(`${lastName} — ${profile.company}`, 40, 140);

  // --- QR Code ---
  const qrCanvas = document.createElement("canvas");

  await QRCode.toCanvas(qrCanvas, profile.url, {
  width: 360,
  margin: 1,
  errorCorrectionLevel: "H",
  color: {
    dark: sectorColor,
    light: "#ffffff",
  },
});

  const qrX = (width - 360) / 2;
  const qrY = 220;

  ctx.drawImage(qrCanvas, qrX, qrY);

  const countryCode = profile.country
  ?.trim()
  .toLowerCase();

if (countryCode) {
  const flagImg = new Image();
  flagImg.crossOrigin = "anonymous";
  flagImg.src = `/flags/${countryCode}.svg`;

  await new Promise((res) => {
    flagImg.onload = res;
    flagImg.onerror = res;
  });

  if (flagImg.naturalWidth > 0) {
    ctx.drawImage(flagImg, width - 110, 42, 70, 46);
  } else {
    console.warn("Flag not found:", flagImg.src);
  }
}
  // --- Sector pill (bottom) ---
  const pillText = profile.sector;
  ctx.font = "20px Arial";

  const textWidth = ctx.measureText(pillText).width;
  const pillWidth = textWidth + 40;
  const pillHeight = 40;

  const pillX = (width - pillWidth) / 2;
  const pillY = height - 80;

  // pill background
  ctx.fillStyle = sectorColor;
  ctx.beginPath();
  ctx.roundRect(pillX, pillY, pillWidth, pillHeight, 20);
  ctx.fill();

  // pill text
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(pillText, width / 2, pillY + pillHeight / 2);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png");
  });
}

async function downloadZip() {
  try {
    setIsGeneratingQr(true);
    setQrProgress("Generating QR codes...");

    const zip = new JSZip();

    for (let i = 0; i < loadedData.length; i++) {
      const item = loadedData[i];

      const imageBlob = await createQrImage({
        ...item,
        url: `${QR_BASE_URL}${item.slug}`,
      });

      zip.file(
        `${String(i + 1).padStart(3, "0")}-${safeFileName(item.name)}.png`,
        imageBlob
      );

      setQrProgress(`Generated ${i + 1} of ${loadedData.length}`);
    }

    setQrProgress("Creating ZIP...");

    const zipBlob = await zip.generateAsync({
      type: "blob",
      compression: "DEFLATE",
    });

    saveAs(zipBlob, "qr-codes.zip");
    setQrProgress("Done.");
  } catch (err) {
    console.error(err);
    setQrProgress("Failed to generate ZIP.");
  } finally {
    setIsGeneratingQr(false);
  }
}
  return (
  <main className="min-h-screen bg-gray-50 px-6">
    <div className="mx-auto max-w-7xl">
      {/* <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          Upload Attendees
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Add attendees in bulk with CSV or create one record manually.
        </p>
      </div> */}

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
                    {loadedData.length} rows are ready for QR generation.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={downloadZip}
                  disabled={isGeneratingQr}
                  className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isGeneratingQr ? "Generating..." : "Generate QR ZIP"}
                </button>
              </div>

              {qrProgress && (
                <p className="mt-3 text-xs text-gray-500">{qrProgress}</p>
              )}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <SingleUpload
            createQrImage={createQrImage}
            safeFileName={safeFileName}
          />
        </section>
      </div>
    </div>
  </main>
);
}