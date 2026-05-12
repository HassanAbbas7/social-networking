import { useMemo, useState } from "react";
import { expectedColumns, TABLE_NAME, QR_BASE_URL, DEVELOPER_MODE, sectorOptions, countryOptions } from "../../data/config";
import { createClient } from "@supabase/supabase-js";
import { saveAs } from "file-saver";
import { createBadgePng } from "../../utils/badgeExporter";


const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);


export default function SingleUpload({ safeFileName }) {
  const initialForm = useMemo(() => {

    if (DEVELOPER_MODE){
      return {
        name: "Hassan Abbas",
        country: "pk",
        company: "ABC",
        sector: "Tech",
        title: "Programmer",
        linkedin_url: "linkedin.com"
      }
    }
    return expectedColumns.reduce((acc, column) => {
      acc[column] = "";
      return acc;
    }, {});
  }, []);

  const [data, setData] = useState(null);
  const [editingForm, setEditingForm] = useState(false);
  const [formData, setFormData] = useState(initialForm);
  const [status, setStatus] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloadingQr, setIsDownloadingQr] = useState(false);

  function handleChange(column, value) {
    console.log("changing form data");
    setData(null);
    console.log(data);
    setFormData((current) => ({
      ...current,
      [column]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    // check if any required fields are empty except for photo_url
    const missingFields = expectedColumns.filter((col) => !formData[col] && col !== "photo_url");
    if (missingFields.length > 0) {
      setStatus(`Upload Failed: Missing required fields: ${missingFields.join(", ")}`);
      return;
    }


    try {
      setIsUploading(true);
      setStatus("Uploading entry...");

      const cleanedRow = expectedColumns.reduce((acc, column) => {
        acc[column] = formData[column] === "" ? null : formData[column];
        return acc;
      }, {});

      const { data, error } = await supabase
        .from(TABLE_NAME)
        .insert([cleanedRow])
        .select("*")
        .single();

      if (error) {
        setStatus(`Upload failed: ${error.message}`);
        return;
      }

      setData(data);
      setStatus("Entry uploaded. QR is ready to download.");
      setFormData(initialForm);
    } catch (err) {
      console.error(err);
      setStatus("Upload failed. Something went wrong.");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDownloadQr() {
    if (!data) return;

    try {
      setIsDownloadingQr(true);
      setStatus("Generating QR image...");

      const imageBlob = await createBadgePng({
        ...data,
        url: `${QR_BASE_URL}${data.slug}`,
      });
      // await exportBadgeToA6Docx(imageBlob, `${data.name}-badge.docx`);

      saveAs(imageBlob, `${safeFileName(data.name)}.png`);
      setStatus("QR downloaded.");
      setData(null);
    } catch (err) {
      console.error(err);
      setStatus("Failed to generate QR image.");
    } finally {
      setIsDownloadingQr(false);
    }
  }

  const isError =
    status.toLowerCase().includes("failed") ||
    status.toLowerCase().includes("error");

  return (
    <div className="h-full">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-gray-900">
          Single Upload
        </h2>
        <p className="text-sm text-gray-500">
          Add one attendee manually, then download their QR image.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6">
        <div className="grid gap-3 sm:grid-cols-2">
          {expectedColumns.map((column) => (
  <label
    key={column}
    className={
      column === "linkedin_url" || column === "photo_url"
        ? "block sm:col-span-2"
        : "block"
    }
  >
    <span className="text-sm font-medium capitalize text-gray-700">
      {column.replace(/_/g, " ")}
    </span>

    {column === "sector" ? (
  <select
    value={formData[column] ?? ""}
    onChange={(e) => handleChange(column, e.target.value)}
    className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-100"
  >
    <option value="">Select sector</option>
    {sectorOptions.map((sector) => (
      <option key={sector} value={sector}>
        {sector}
      </option>
    ))}
  </select>
) : column === "country" ? (
  <>
    <input
      type="text"
      list="country-options"
      value={
        countryOptions.find((country) => country.code === formData.country)
          ?.name || formData.country || ""
      }
      onChange={(e) => {
        const value = e.target.value;

        const matchedCountry = countryOptions.find(
          (country) =>
            country.name.toLowerCase() === value.toLowerCase() ||
            country.code.toLowerCase() === value.toLowerCase()
        );

        handleChange("country", matchedCountry ? matchedCountry.code : value);
      }}
      placeholder="Start typing country name"
      className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-100"
    />

    <datalist id="country-options">
      {countryOptions.map((country) => (
        <option key={country.code} value={country.name}>
          {country.code.toUpperCase()}
        </option>
      ))}
    </datalist>
  </>
) : (
  <input
    type="text"
    value={formData[column] ?? ""}
    onChange={(e) => handleChange(column, e.target.value)}
    placeholder={column.replace(/_/g, " ")}
    className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-100"
  />
)}
  </label>
))}
        </div>

        {data && (
          <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm font-medium text-gray-900">
              {data.name}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Entry uploaded successfully. You can now download the QR code.
            </p>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          {!data &&<button
            type="submit"
            disabled={isUploading || isDownloadingQr}
            className="flex-1 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isUploading ? "Uploading..." : "Upload Entry"}
          </button>}

          {(data) && <button
            type="button"
            onClick={handleDownloadQr}
            disabled={!data || isUploading || isDownloadingQr}
            className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-800 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isDownloadingQr ? "Generating..." : "Download QR"}
          </button>}
        </div>
      </form>

      {status && (
        <div
          className="mt-4 rounded-lg px-4 py-3 text-sm"
          style={{
            backgroundColor: isError ? "#FDE2E1" : "#E6F4EA",
            color: isError ? "#D93025" : "#137333",
          }}
        >
          {status}
        </div>
      )}
    </div>
  );
}