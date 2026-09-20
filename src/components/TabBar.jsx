import { Home, Wrench, CalendarCheck, Banknote, FileText, User } from "lucide-react";
import { PRIMARY } from "../lib/constants.js";

export default function TabBar({ active, onChange }) {
  const tabs = [
    { id: "home", label: "Home", icon: Home },
    { id: "systems", label: "Systems", icon: Wrench },
    { id: "tasks", label: "Tasks", icon: CalendarCheck },
    { id: "costs", label: "Costs", icon: Banknote },
    { id: "docs", label: "Docs", icon: FileText },
    { id: "account", label: "Account", icon: User },
  ];
  return (
    <div
      className="flex border-t border-stone-200 bg-white"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {tabs.map((t) => {
        const Icon = t.icon;
        const isActive = active === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className="flex-1 flex flex-col items-center gap-1 py-3.5"
          >
            <Icon size={20} strokeWidth={isActive ? 2.4 : 1.7} color={isActive ? PRIMARY : "#9C978C"} />
            <span
              className="text-[10px]"
              style={{ color: isActive ? PRIMARY : "#9C978C", fontWeight: isActive ? 600 : 400 }}
            >
              {t.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
