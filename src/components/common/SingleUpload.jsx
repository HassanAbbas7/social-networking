import { useMemo, useState } from "react";
import {expectedColumns, TABLE_NAME, QR_BASE_URL } from "../../data/config";
import { createClient } from "@supabase/supabase-js";
import QRCode from "qrcode";
import { saveAs } from "file-saver";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);




export default function SingleUpload({createQrImage, safeFileName}) {
  const initialForm = useMemo(() => {
    return expectedColumns.reduce((acc, column) => {
      acc[column] = "";
      return acc;
    }, {});
  }, []);

  const [data, setData] = useState(null);

  const [formData, setFormData] = useState(initialForm);
  const [status, setStatus] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  function handleChange(column, value) {
    setFormData((current) => ({
      ...current,
      [column]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setIsUploading(true);
      setStatus("Uploading entry to Supabase...");

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
        console.error(error);
        setStatus(`Upload failed: ${error.message}`);
        return;
      }

      setData(data);

      setStatus("Entry uploaded. Generating QR image...");

      // const imageBlob = await createQrImage({
      //   ...data,
      //   url: `${QR_BASE_URL}${data.slug}`,
      // });

      // saveAs(imageBlob, `${safeFileName(data.name)}.png`);
      setStatus("Entry uploaded!");
      setFormData(initialForm);
    } catch (err) {
      console.error(err);
      setStatus("Failed. Something went wrong while uploading or generating the QR image.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-gray-900">
          Upload Single Entry
        </h2>
        <p className="text-sm text-gray-500">
          Add one database entry and download one QR image.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {expectedColumns.map((column) => (
          <label key={column} className="block">
            <span className="text-sm font-medium capitalize text-gray-700">
              {column.replace(/_/g, " ")}
            </span>
            <input
              type="text"
              value={formData[column] ?? ""}
              onChange={(e) => handleChange(column, e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-100"
            />
          </label>
        ))}

        <button
          type={!data ? "submit" : "button"}
          onClick={async () => {
            if (!data) return;
            const imageBlob = await createQrImage({
              ...data,
              url: `${QR_BASE_URL}${data.slug}`,
            });

            saveAs(imageBlob, `${safeFileName(data.name)}.png`);
            setFormData(initialForm);
            setData(null);
          }}

          className="w-full rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isUploading && !data ? "Uploading..." : data ? "Download QR" : "Upload Entry & Download QR"}
        </button>
      </form>

      {status && (
        <div className="mt-4 rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-700" style={{ backgroundColor: status.includes("failed") ? "#FDE2E1" : "#E6F4EA", color: status.includes("failed") ? "#D93025" : "#137333" }}>
          {status}
        </div>
      )}
    </div>
  );
}
