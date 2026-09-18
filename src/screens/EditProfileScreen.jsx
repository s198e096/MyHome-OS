import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { PRIMARY, STATUS_COLOR } from "../lib/constants.js";

export default function EditProfileScreen({ profile, onBack, onSave }) {
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [address, setAddress] = useState(profile.address);
  const [propertyValue, setPropertyValue] = useState(profile.propertyValue != null ? String(profile.propertyValue) : "");
  const [error, setError] = useState("");

  function handleSubmit() {
    if (!name.trim()) return setError("Enter your name.");
    if (!email.trim()) return setError("Enter your email.");
    let value = null;
    if (propertyValue.trim()) {
      const num = parseFloat(propertyValue);
      if (isNaN(num) || num < 0) return setError("Enter a valid property value.");
      value = num;
    }
    onSave({ name: name.trim(), email: email.trim(), address: address.trim(), propertyValue: value });
  }

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1 mb-3 text-[13px] text-stone-500">
        <ChevronLeft size={16} /> Account
      </button>

      <div className="text-[17px] font-semibold text-stone-900 mb-4">Edit profile</div>

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
        className="w-full mb-2 px-3 py-2 rounded-lg text-[13.5px]"
        style={{ border: "1px solid #E0E8D3" }}
      />
      <input
        value={propertyValue}
        onChange={(e) => setPropertyValue(e.target.value)}
        placeholder="Estimated property value ($)"
        inputMode="decimal"
        className="w-full mb-3 px-3 py-2 rounded-lg text-[13.5px]"
        style={{ border: "1px solid #E0E8D3" }}
      />

      {error && <div className="text-[12px] mb-2" style={{ color: STATUS_COLOR.red }}>{error}</div>}

      <button
        onClick={handleSubmit}
        className="w-full py-2.5 rounded-lg text-[13.5px] font-semibold"
        style={{ background: PRIMARY, color: "white" }}
      >
        Save changes
      </button>
    </div>
  );
}
