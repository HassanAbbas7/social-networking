import React, { useEffect, useMemo, useState } from "react";
import { expectedColumns, TABLE_NAME } from "../data/config";
import QRCode from "qrcode";
import { createClient } from "@supabase/supabase-js";
import { saveAs } from "file-saver";
import JSZip from "jszip";
import { QR_BASE_URL } from "../data/config";
import { createBadgePng } from "../utils/badgeExporter";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

export default function RecordsPage() {
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [bulkAction, setBulkAction] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchRecords();
  }, []);


  function safeFileName(name) {
    return String(name || "record")
      .toLowerCase()
      .replace(/[^a-z0-9]/gi, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }

  async function handleGenerateQR(record) {
    const imageBlob = await createBadgePng({
      ...record,
      url: `${QR_BASE_URL}${record.slug}`,
    });

    saveAs(imageBlob, `${safeFileName(record.name)}.png`);
  }

  async function handleDownloadAllQR() {
    if (!records.length) return;

    try {
      setBulkAction("download");
      setError("");

      const zip = new JSZip();

      for (let i = 0; i < records.length; i++) {
        const record = records[i];

        const imageBlob = await createBadgePng({
          ...record,
          url: `${QR_BASE_URL}${record.slug}`,
        });

        zip.file(
          `${String(i + 1).padStart(3, "0")}-${safeFileName(
            record.name
          )}.png`,
          imageBlob
        );
      }

      const zipBlob = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
      });

      saveAs(zipBlob, "all-qr-codes.zip");
    } catch (err) {
      console.error(err);
      setError("Failed to download all QR codes.");
    } finally {
      setBulkAction("");
    }
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
    const confirmed = window.confirm(
      "WARNING:\n Deleting this record cannot be undone. It can affect the live network graph!"
    );

    if (!confirmed) return;

    setDeletingId(id);
    setError("");

    const { error } = await supabase.from(TABLE_NAME).delete().eq("id", id);

    if (error) {
      setError(error.message);
    } else {
      setRecords((currentRecords) =>
        currentRecords.filter((record) => record.id !== id)
      );
    }

    setDeletingId(null);
  }

  async function handleDeleteAll() {
    const confirmed = window.confirm(
      `WARNING: \nDeleting ${records.length} records cannot be undone. \nThe live network graph will go blank! Continue?`
    );

    if (!confirmed) return;

    try {
      setBulkAction("delete");
      setError("");

      const { error } = await supabase
        .from(TABLE_NAME)
        .delete()
        .not("id", "is", null);

      if (error) {
        setError(error.message);
        return;
      }

      setRecords([]);
    } finally {
      setBulkAction("");
    }
  }

  const filteredRecords = useMemo(() => {
    const value = search.trim().toLowerCase();
    if (!value) return records;

    return records.filter((record) =>
      expectedColumns.some((column) => {
        const fieldValue = record[column];
        return String(fieldValue || "").toLowerCase().includes(value);
      })
    );
  }, [records, search]);

  return (
  <main className="min-h-screen bg-gray-50">
    <div className="mx-auto max-w-7xl pt-2">
      
      {/* Header Row */}
      <div className="mb-2 flex flex-col gap-1 lg:flex-row lg:items-center lg:justify-between">
        
        {/* Left: Title */}
        <div>
          {/* TThere should be a logo that matches the heading size */}
          
          <h1 className="m-0 leading-none text-2xl font-semibold text-gray-900" style={{ fontSize: "42px" }}>
            Records
          </h1>
          <p className="m-0 text-sm text-gray-500 leading-tight">
            Showing {filteredRecords.length} of {records.length} records
          </p>
        </div>

        {/* Right: Controls */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search records..."
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm outline-none focus:border-gray-500 sm:w-72"
          />

          <button
            type="button"
            onClick={handleDownloadAllQR}
            disabled={!records.length || bulkAction === "download"}
            className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {bulkAction === "download"
              ? "Preparing..."
              : "Download QR for All"}
          </button>

          <button
            type="button"
            onClick={handleDeleteAll}
            disabled={!records.length || bulkAction === "delete"}
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 shadow-sm transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {bulkAction === "delete" ? "Deleting..." : "Delete All"}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="rounded-2xl bg-white p-6 text-center text-gray-500 shadow-sm">
          Loading records...
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="rounded-2xl bg-white p-6 text-center text-gray-500 shadow-sm">
          No records found.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                    Name
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                    Company
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                    Title
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                    Sector
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                    Country
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                    LinkedIn
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filteredRecords.map((record, index) => (
                  <tr
                    key={record.id}
                    className="hover:bg-gray-50"
                    style={{
                      backgroundColor:
                        index % 2 === 0 ? "lightgray" : "white",
                    }}
                  >
                    <td className="px-4 py-2 text-sm font-medium text-gray-900">
                      {record.name || "—"}
                    </td>

                    <td className="px-4 py-2 text-sm text-gray-700">
                      {record.company || "—"}
                    </td>

                    <td className="px-4 py-2 text-sm text-gray-700">
                      {record.title || "—"}
                    </td>

                    <td className="px-4 py-2 text-sm text-gray-700">
                      {record.sector || "—"}
                    </td>

                    <td className="px-4 py-2 text-sm text-gray-700">
                      {record.country || "—"}
                    </td>

                    <td className="px-4 py-2 text-sm">
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

                    <td className="px-4 py-2 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleGenerateQR(record)}
                          className="rounded-lg bg-gray-800 px-3 py-1 text-sm font-medium text-white hover:bg-gray-900"
                        >
                          QR
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(record.id)}
                          disabled={deletingId === record.id}
                          className="rounded-lg bg-red-600 px-3 py-1 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {deletingId === record.id
                            ? "Deleting..."
                            : "Delete"}
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