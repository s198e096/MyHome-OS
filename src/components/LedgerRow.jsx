import { PRIMARY } from "../lib/constants.js";

export default function LedgerRow({ label, sub, value, valueColor, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-baseline justify-between py-2.5 text-left"
      style={{ borderBottom: "1px solid #E7EEDB" }}
    >
      <div className="min-w-0">
        <div className="text-[13.5px] text-stone-800 truncate">{label}</div>
        {sub && <div className="text-[11.5px] text-stone-400">{sub}</div>}
      </div>
      <div
        className="text-[13.5px] tabular-nums flex-shrink-0 pl-2"
        style={{ color: valueColor || PRIMARY, fontWeight: 600 }}
      >
        {value}
      </div>
    </button>
  );
}
