import React, { useEffect, useMemo, useState } from "react";
import { expectedColumns, TABLE_NAME } from "../data/config";
import QRCode from "qrcode";
import { createClient } from "@supabase/supabase-js";
import { saveAs } from "file-saver";
import { QR_BASE_URL } from "../data/config";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);



export default function RecordsPage({createQrImage}) {
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchRecords();
  }, []);

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

  function safeFileName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

    async function handleGenerateQR(record) {
      const imageBlob = await createQrImage({
        ...record,
        url: `${QR_BASE_URL}${record.slug}`,
      });

      saveAs(imageBlob, `${safeFileName(record.name)}.png`);
    }

  async function fetchRecords() {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select(`id, slug, ${expectedColumns.join(", ")}`)
      .order("name", { ascending: true });

    if (error) {
      setError(error.message);
      setRecords([]);
    } else {
      setRecords(data || []);
    }

    setLoading(false);
  }

  async function handleDelete(id) {
    const confirmed = window.confirm("Are you sure you want to delete this record?");
    if (!confirmed) return;

    setDeletingId(id);
    setError("");

    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq("id", id);

    if (error) {
      setError(error.message);
    } else {
      setRecords((currentRecords) =>
        currentRecords.filter((record) => record.id !== id)
      );
    }

    setDeletingId(null);
  }

  const filteredRecords = useMemo(() => {
    const value = search.trim().toLowerCase();
    if (!value) return records;

    return records.filter((record) =>
      expectedColumns.some((column) => {
        const fieldValue = record[column];
        return String(fieldValue || "")
          .toLowerCase()
          .includes(value);
      })
    );
  }, [records, search]);

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Records</h1>
            <p className="text-sm text-gray-500">
              Showing {filteredRecords.length} of {records.length} records
            </p>
          </div>

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search records..."
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm outline-none focus:border-gray-500 sm:max-w-sm"
          />
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl bg-white p-8 text-center text-gray-500 shadow-sm">
            Loading records...
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center text-gray-500 shadow-sm">
            No records found.
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                      Photo
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                      Company
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                      Title
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                      Sector
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                      Country
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                      LinkedIn
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-600">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {filteredRecords.map((record, index) => (
                    <tr key={record.id} className="hover:bg-gray-50" style={{ backgroundColor: index % 2 === 0 ? "lightgray" : "white" }}>
                      <td className="px-4 py-3">
                        {record.photo_url ? (
                          <img
                            src={record.photo_url}
                            alt={record.name || "Profile"}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-sm font-medium text-gray-600">
                            {(record.name || "?").charAt(0).toUpperCase()}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {record.name || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {record.company || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {record.title || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {record.sector || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {record.country || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {record.linkedin_url ? (
                          <a
                            href={record.linkedin_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            View
                          </a>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleGenerateQR(record)}
                            className="rounded-lg bg-gray-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-900"
                            title="Generate QR"
                          >
                            QR
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(record.id)}
                            disabled={deletingId === record.id}
                            className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {deletingId === record.id ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
