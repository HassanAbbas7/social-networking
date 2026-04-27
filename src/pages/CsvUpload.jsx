import { useState } from "react";
import Papa from "papaparse";
import { expectedColumns, TABLE_NAME, QR_BASE_URL } from "../data/config";
import { createClient } from "@supabase/supabase-js";
import QRCode from "qrcode";
import JSZip from "jszip";
import { saveAs } from "file-saver";

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
            .select("id, name");

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
          setStatus("Something went wrong while uploading.");
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

async function createQrImage({ name, id }) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  const width = 500;
  const height = 600;
  const qrSize = 420;

  canvas.width = width;
  canvas.height = height;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "#111111";
  ctx.font = "bold 32px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const maxNameLength = 28;
  const displayName =
    name.length > maxNameLength
      ? name.slice(0, maxNameLength - 3) + "..."
      : name;

  ctx.fillText(displayName, width / 2, 55);

  const qrCanvas = document.createElement("canvas");

  await QRCode.toCanvas(qrCanvas, QR_BASE_URL + id, {
    width: qrSize,
    margin: 2,
    errorCorrectionLevel: "H",
  });

  ctx.drawImage(qrCanvas, 40, 110, qrSize, qrSize);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png");
  });
}

function QrZipDownloader() {

  async function downloadZip() {
    setIsGeneratingQr(true);
    setQrProgress("Generating QR codes...");

    const zip = new JSZip();

    for (let i = 0; i < loadedData.length; i++) {
      const item = loadedData[i];

      const imageBlob = await createQrImage(item);

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
    setIsGeneratingQr(false);
  }


  async function downloadZip() {
    setIsGeneratingQr(true);
    setQrProgress("Generating QR codes...");

    const zip = new JSZip();

    for (let i = 0; i < loadedData.length; i++) {
      const item = loadedData[i];

      const imageBlob = await createQrImage(item);

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
    setIsGeneratingQr(false);
  }

    try {
        downloadZip();
    } catch (err) {
        console.error(err);
        setQrProgress("Failed to generate ZIP.");
        setIsGeneratingQr(false);
    }
  }

  return (
  <div className="mx-auto max-w-xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
    <div className="space-y-2">
      <h2 className="text-xl font-semibold text-gray-900">
        Upload CSV
      </h2>
      <p className="text-sm text-gray-500">
        Upload a CSV with column names matching your Supabase table.
      </p>
    </div>

    <label className="mt-6 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center transition hover:border-gray-400 hover:bg-gray-100">
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
      <div className="mt-4 rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-700">
        {status}
      </div>
    )}

    {loadedData?.length > 0 && (
      <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
        <div className="flex items-center justify-between gap-4">
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
            onClick={QrZipDownloader}
            disabled={isGeneratingQr}
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isGeneratingQr ? "Generating..." : "Generate QR ZIP"}
          </button>
        </div>

        {qrProgress && (
          <p className="mt-3 text-xs text-gray-500">
            {qrProgress}
          </p>
        )}
      </div>
    )}
  </div>
);
}