import { useState } from "react";
import { X } from "lucide-react";
import { PRIMARY, STATUS_COLOR } from "../lib/constants.js";

export default function EditProfileSheet({ profile, onClose, onSave }) {
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [address, setAddress] = useState(profile.address);
  const [error, setError] = useState("");

  function handleSubmit() {
    if (!name.trim()) return setError("Enter your name.");
    if (!email.trim()) return setError("Enter your email.");
    onSave({ name: name.trim(), email: email.trim(), address: address.trim() });
  }

  return (
    <div
      className="flex items-end"
      style={{ position: "absolute", inset: 0, background: "rgba(22,36,15,0.35)", borderRadius: 28 }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full bg-white p-4"
        style={{ borderTopLeftRadius: 20, borderTopRightRadius: 20, border: "1px solid #E0E8D3" }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="text-[15px] font-semibold text-stone-900">Edit profile</div>
          <button onClick={onClose}>
            <X size={18} color="#9C978C" />
          </button>
        </div>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          className="w-full mb-2 px-3 py-2 rounded-lg text-[13.5px]"
          style={{ border: "1px solid #E0E8D3" }}
        />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full mb-2 px-3 py-2 rounded-lg text-[13.5px]"
          style={{ border: "1px solid #E0E8D3" }}
        />
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Home address"
          className="w-full mb-3 px-3 py-2 rounded-lg text-[13.5px]"
          style={{ border: "1px solid #E0E8D3" }}
        />

        {error && <div className="text-[12px] mb-2" style={{ color: STATUS_COLOR.red }}>{error}</div>}

        <button
          onClick={handleSubmit}
          className="w-full py-2.5 rounded-lg text-[13.5px] font-semibold"
          style={{ background: PRIMARY, color: "white" }}
        >
          Save
        </button>
      </div>
    </div>
  );
}
