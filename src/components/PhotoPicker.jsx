import { useState } from "react";
import { Camera, Upload, Image as ImageIcon } from "lucide-react";
import { PRIMARY, STATUS_COLOR } from "../lib/constants.js";
import { uploadPhoto } from "../lib/db.js";

export default function PhotoPicker({ photoUrl, onChange }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setError("");
    setUploading(true);
    try {
      const url = await uploadPhoto(file);
      onChange(url);
    } catch {
      setError("Couldn't upload photo. Try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div
      className="w-full mb-3 rounded-xl flex flex-col items-center gap-2 py-4 px-3"
      style={{ border: "2px dashed #C9C5B8", background: "#FAFBF7" }}
    >
      {photoUrl ? (
        <img
          src={photoUrl}
          alt=""
          className="w-full rounded-lg object-cover"
          style={{ height: 140, border: "1px solid #E0E8D3" }}
        />
      ) : (
        <ImageIcon size={22} color="#9C978C" />
      )}

      <div className="text-[12px] text-stone-500 text-center">
        {uploading ? "Uploading..." : photoUrl ? "Replace photo" : "Take a photo or upload one"}
      </div>

      {error && <div className="text-[12px] text-center" style={{ color: STATUS_COLOR.red }}>{error}</div>}

      <div className="flex items-center gap-2 w-full">
        <label
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[12.5px] font-semibold cursor-pointer"
          style={{ background: "white", border: "1px solid #D8D5CB", color: PRIMARY, opacity: uploading ? 0.6 : 1 }}
        >
          <Camera size={15} />
          Camera
          <input type="file" accept="image/*" capture="environment" onChange={handleFile} disabled={uploading} className="hidden" />
        </label>
        <label
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[12.5px] font-semibold cursor-pointer"
          style={{ background: "white", border: "1px solid #D8D5CB", color: PRIMARY, opacity: uploading ? 0.6 : 1 }}
        >
          <Upload size={15} />
          Upload
          <input type="file" accept="image/*" onChange={handleFile} disabled={uploading} className="hidden" />
        </label>
      </div>
    </div>
  );
}
