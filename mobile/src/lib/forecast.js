// Today's local calendar date, parsed the same way every other date string
// in this app is (new Date("YYYY-MM-DD"), which JS treats as UTC midnight)
// so day-based comparisons against dueDate/purchaseDate/etc. line up
// without a timezone-offset skew at day boundaries.
const now = new Date();
export const TODAY = new Date(new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10));

export function daysUntil(dateStr) {
  const d = new Date(dateStr);
  return Math.round((d - TODAY) / 86400000);
}

const RECURRENCE_STEP = {
  weekly: { days: 7 },
  monthly: { months: 1 },
  quarterly: { months: 3 },
  semiannually: { months: 6 },
  annually: { months: 12 },
};

// The due date `steps` repeats after `dateStr` (default: the next one).
// Calendar-based (not a fixed day count) for anything monthly or longer, and
// clamped to the target month's length, so a Jan 31 due date lands on Feb 28
// rather than spilling into March. Counting `steps` from the original date,
// instead of chaining one repeat at a time, stops that clamping from drifting
// the later dates. Pure date arithmetic, so no time-zone shifts.
export function advanceDueDate(dateStr, recurrence, steps = 1) {
  const step = RECURRENCE_STEP[recurrence];
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateStr || "");
  if (!step || !m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  if (step.days) return new Date(Date.UTC(y, mo, d + step.days * steps)).toISOString().slice(0, 10);

  const total = mo + step.months * steps;
  const ty = y + Math.floor(total / 12);
  const tm = ((total % 12) + 12) % 12;
  const lastDay = new Date(Date.UTC(ty, tm + 1, 0)).getUTCDate();
  return `${ty}-${String(tm + 1).padStart(2, "0")}-${String(Math.min(d, lastDay)).padStart(2, "0")}`;
}

// The dates a repeating task falls on after its current due date, up to and
// including `endKey` ("YYYY-MM-DD"). Used by the calendar, so a task that
// repeats shows up on every one of its dates and not only the next one. The
// current due date itself is not included (it is the task's own date).
export function futureOccurrences(dueDate, recurrence, endKey, maxCount = 400) {
  const dates = [];
  for (let n = 1; n <= maxCount; n++) {
    const next = advanceDueDate(dueDate, recurrence, n);
    if (!next || next > endKey) break;
    dates.push(next);
  }
  return dates;
}

export function money(n) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

// Year the system would wear out: purchase date + expected life.
export function estimatedReplacementYear(sys) {
  return new Date(sys.purchaseDate).getFullYear() + sys.expectedLifeYears;
}

// How much to set aside each month to cover replacementCost by the estimated
// replacement date (purchase date + expected life). Returns null when there
// isn't enough information to calculate.
export function replacementPlan(sys) {
  if (sys.replacementCost == null) return null;

  if (sys.purchaseDate && sys.expectedLifeYears != null) {
    const year = estimatedReplacementYear(sys);
    const months = Math.max(1, (year - TODAY.getFullYear()) * 12 - TODAY.getMonth());
    return { year, months, monthly: Math.round(sys.replacementCost / months) };
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

export function systemStatus(sys, tasks) {
  const relevant = tasks.filter((t) => t.systemId === sys.id && !t.completed);
  if (relevant.length === 0) return "green";
  const soonest = Math.min(...relevant.map((t) => daysUntil(t.dueDate)));
  if (soonest < 0) return "red";
  if (soonest <= 30) return "yellow";
  return "green";
}

// Years that have at least one expense, newest first — populates the year
// picker above the per-system breakdown charts.
export function expenseYears(expenses) {
  return [...new Set(expenses.map((e) => new Date(e.date).getFullYear()))].sort((a, b) => b - a);
}

// One chosen year's expenses, grouped by system ("general" for none) and
// summed, highest first — the pie chart's slices.
export function expensesBySystemForYear(expenses, year) {
  const totals = {};
  for (const e of expenses) {
    if (new Date(e.date).getFullYear() !== year) continue;
    const key = e.systemId || "general";
    totals[key] = (totals[key] || 0) + e.amount;
  }
  return Object.entries(totals)
    .map(([key, amount]) => ({ key, value: amount }))
    .sort((a, b) => b.value - a.value);
}

// Same breakdown, but DIY hours logged on completed tasks instead of $.
export function timeSpentBySystemForYear(expenses, year) {
  const totals = {};
  for (const e of expenses) {
    if (!e.timeSpentHours || new Date(e.date).getFullYear() !== year) continue;
    const key = e.systemId || "general";
    totals[key] = (totals[key] || 0) + e.timeSpentHours;
  }
  return Object.entries(totals)
    .map(([key, hours]) => ({ key, value: hours }))
    .sort((a, b) => b.value - a.value);
}

export function computeForecast(systems, expenses) {
  const currentYear = TODAY.getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear + i);

  const totalsByYear = {};
  for (const e of expenses) {
    const y = new Date(e.date).getFullYear();
    totalsByYear[y] = (totalsByYear[y] || 0) + e.amount;
  }

  // Baseline for future years: the average of actual past years' spending,
  // so it reflects this home's real upkeep costs rather than a guess. No
  // history yet (e.g. a brand-new home) means no baseline, not a made-up
  // number.
  const pastYears = Object.keys(totalsByYear).map(Number).filter((y) => y < currentYear);
  const averageAnnualSpend = pastYears.length
    ? pastYears.reduce((s, y) => s + totalsByYear[y], 0) / pastYears.length
    : 0;

  return years.map((y) => {
    const replacing = systems.filter((s) => estimatedReplacementYear(s) === y);
    const base = y === currentYear ? totalsByYear[y] || 0 : averageAnnualSpend;
    const big = replacing.reduce((s, sys) => s + sys.replacementCost, 0);
    return { year: y, amount: base + big, systems: replacing };
  });
}
