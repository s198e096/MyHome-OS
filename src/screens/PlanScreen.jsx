import { ChevronLeft, Check } from "lucide-react";
import { PRIMARY, STATUS_COLOR, ACCENT_YELLOW, PLANS } from "../lib/constants.js";

export default function PlanScreen({ currentPlan, onBack, onSelectPlan }) {
  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1 mb-3 text-[13px] text-stone-500">
        <ChevronLeft size={16} /> Account
      </button>

      <div className="text-[17px] font-semibold text-stone-900 mb-1">Choose your plan</div>
      <div className="text-[12.5px] text-stone-500 mb-4">Switch or cancel anytime.</div>

      <div className="flex flex-col gap-3">
        {PLANS.map((plan) => {
          const isCurrent = currentPlan === plan.id;
          return (
            <div
              key={plan.id}
              className="rounded-xl p-3.5"
              style={{
                background: plan.highlight ? ACCENT_YELLOW : "white",
                border: plan.highlight ? "none" : "1px solid #E0E8D3",
              }}
            >
              <div className="flex items-baseline justify-between mb-1">
                <div className="text-[15px] font-bold text-stone-900">{plan.name}</div>
                {plan.highlight && (
                  <div
                    className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: PRIMARY, color: "white" }}
                  >
                    Best value
                  </div>
                )}
              </div>

              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-[22px] font-bold" style={{ color: PRIMARY }}>{plan.price}</span>
                {plan.period && <span className="text-[12px] text-stone-500">{plan.period}</span>}
              </div>

              <div className="flex flex-col gap-1 mb-3">
                {plan.features.map((f) => (
                  <div key={f} className="flex items-center gap-1.5">
                    <Check size={13} color={STATUS_COLOR.green} />
                    <span className="text-[12.5px] text-stone-700">{f}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => onSelectPlan(plan.id)}
                disabled={isCurrent}
                className="w-full py-2 rounded-lg text-[13px] font-semibold"
                style={
                  isCurrent
                    ? { background: "#EFEDE6", color: "#9C978C" }
                    : { background: PRIMARY, color: "white" }
                }
              >
                {isCurrent ? "Current plan" : "Choose plan"}
              </button>
            </div>
          );
        })}
      </div>

      <div className="text-[11px] text-stone-400 text-center mt-4">
        This is a preview — no payment is processed yet.
      </div>
    </div>
  );
}
