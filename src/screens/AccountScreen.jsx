import { Pencil, ChevronRight } from "lucide-react";
import { PRIMARY, STATUS_COLOR, PLANS } from "../lib/constants.js";
import { money } from "../lib/forecast.js";
import LedgerRow from "../components/LedgerRow.jsx";

export default function AccountScreen({ profile, onEdit, onManagePlan, onSignOut }) {
  const planName = PLANS.find((p) => p.id === profile.plan)?.name || "Free";

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="text-[17px] font-semibold text-stone-900">Account</div>
        <button onClick={onEdit} className="flex items-center gap-1 text-[13px] font-semibold" style={{ color: PRIMARY }}>
          <Pencil size={14} /> Edit
        </button>
      </div>

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
        <div className="py-2.5" style={{ borderBottom: "1px solid #E7EEDB" }}>
          <div className="text-[13.5px] text-stone-800">Address</div>
          <div className="text-[12px] text-stone-500 mt-0.5">{profile.address}</div>
        </div>
        {profile.propertyValue != null && (
          <LedgerRow
            label="Home value"
            sub={profile.propertyValueSource ? `Source: ${profile.propertyValueSource}` : undefined}
            value={money(profile.propertyValue)}
          />
        )}
        <button
          onClick={onManagePlan}
          className="w-full flex items-center justify-between py-2.5 text-left"
          style={{ borderBottom: "1px solid #E7EEDB" }}
        >
          <div className="text-[13.5px] text-stone-800">Plan</div>
          <div className="flex items-center gap-1">
            <span className="text-[13.5px] tabular-nums font-semibold" style={{ color: PRIMARY }}>{planName}</span>
            <ChevronRight size={15} color="#B8B4A8" />
          </div>
        </button>
      </div>

      <button
        onClick={onSignOut}
        className="w-full py-2.5 rounded-lg text-[13.5px] font-semibold"
        style={{ border: "1px solid #E0E8D3", color: STATUS_COLOR.red }}
      >
        Sign out
      </button>
    </div>
  );
}
