import { PRIMARY, STATUS_COLOR } from "../lib/constants.js";
import LedgerRow from "../components/LedgerRow.jsx";

export default function AccountScreen({ profile, onEdit }) {
  return (
    <div>
      <div className="text-[17px] font-semibold text-stone-900 mb-4">Account</div>

      <div className="flex flex-col items-center mb-5">
        <div
          className="rounded-full flex items-center justify-center mb-2"
          style={{ width: 64, height: 64, background: PRIMARY, color: "white", fontSize: 24, fontWeight: 700 }}
        >
          {profile.name.charAt(0).toUpperCase()}
        </div>
        <div className="text-[15px] font-semibold text-stone-900">{profile.name}</div>
        <div className="text-[12.5px] text-stone-400">{profile.email}</div>
      </div>

      <div className="text-[12px] font-semibold text-stone-500 mb-1">Home</div>
      <div className="rounded-xl bg-white px-3 mb-4" style={{ border: "1px solid #E0E8D3" }}>
        <LedgerRow label="Address" value={profile.address} />
        <LedgerRow label="Plan" value="Free" />
      </div>

      <button
        onClick={onEdit}
        className="w-full py-2.5 rounded-lg text-[13.5px] font-semibold mb-2"
        style={{ background: PRIMARY, color: "white" }}
      >
        Edit profile
      </button>
      <button
        className="w-full py-2.5 rounded-lg text-[13.5px] font-semibold"
        style={{ border: "1px solid #E0E8D3", color: STATUS_COLOR.red }}
      >
        Sign out
      </button>
    </div>
  );
}
