export const TODAY = new Date("2026-09-14");

export function daysUntil(dateStr) {
  const d = new Date(dateStr);
  return Math.round((d - TODAY) / 86400000);
}

export function money(n) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export function replacementYear(sys) {
  return new Date(sys.purchaseDate).getFullYear() + sys.expectedLifeYears;
}

export function systemStatus(sys, tasks) {
  const relevant = tasks.filter((t) => t.systemId === sys.id && !t.completed);
  if (relevant.length === 0) return "green";
  const soonest = Math.min(...relevant.map((t) => daysUntil(t.dueDate)));
  if (soonest < 0) return "red";
  if (soonest <= 30) return "yellow";
  return "green";
}

export function computeForecast(systems, spentThisYear) {
  const years = [2026, 2027, 2028, 2029, 2030];
  return years.map((y) => {
    const replacing = systems.filter((s) => replacementYear(s) === y);
    const base = y === TODAY.getFullYear() ? spentThisYear : 550;
    const big = replacing.reduce((s, sys) => s + sys.replacementCost, 0);
    return { year: y, amount: base + big, systems: replacing };
  });
}
