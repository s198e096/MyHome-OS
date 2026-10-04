export const TODAY = new Date("2026-09-14");

export function daysUntil(dateStr) {
  const d = new Date(dateStr);
  return Math.round((d - TODAY) / 86400000);
}

export function money(n) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

// Year the system would wear out: purchase date + expected life.
export function estimatedReplacementYear(sys) {
  return new Date(sys.purchaseDate).getFullYear() + sys.expectedLifeYears;
}

// Year the owner will actually replace it: their planned date if they set one,
// otherwise the estimate above. Drives the 5-year forecast.
export function replacementYear(sys) {
  if (sys.plannedReplacementDate) return Number(sys.plannedReplacementDate.slice(0, 4));
  return estimatedReplacementYear(sys);
}

// How much to set aside each month to cover replacementCost by the replacement
// date. A planned date is used on its own (expected life and purchase date are
// ignored); with no plan it falls back to the expected-life estimate.
// Returns null when there isn't enough information to calculate.
export function replacementPlan(sys) {
  if (sys.replacementCost == null) return null;

  if (sys.plannedReplacementDate) {
    const [year, month] = sys.plannedReplacementDate.split("-").map(Number);
    const months = Math.max(1, (year - TODAY.getFullYear()) * 12 + (month - 1 - TODAY.getMonth()));
    return { source: "plan", year, month, months, monthly: Math.round(sys.replacementCost / months) };
  }

  if (sys.purchaseDate && sys.expectedLifeYears != null) {
    const year = estimatedReplacementYear(sys);
    const months = Math.max(1, (year - TODAY.getFullYear()) * 12 - TODAY.getMonth());
    return { source: "life", year, months, monthly: Math.round(sys.replacementCost / months) };
  }

  return null;
}

// "15 years, 1 month" / "8 months"
export function formatMonths(months) {
  const years = Math.floor(months / 12);
  const rest = months % 12;
  const parts = [];
  if (years) parts.push(`${years} ${years === 1 ? "year" : "years"}`);
  if (rest) parts.push(`${rest} ${rest === 1 ? "month" : "months"}`);
  return parts.join(", ");
}

// Date `years` from today, as YYYY-MM-DD, for the planner's quick picks.
export function yearsFromToday(years) {
  const iso = TODAY.toISOString().slice(0, 10);
  return `${Number(iso.slice(0, 4)) + years}${iso.slice(4)}`;
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
