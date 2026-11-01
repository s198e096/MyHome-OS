import { parseIso } from "./reports/format.js";

// Today's local calendar date, parsed the same way every other date string
// in this app is (new Date("YYYY-MM-DD"), which JS treats as UTC midnight)
// so day-based comparisons against dueDate/purchaseDate/etc. line up
// without a timezone-offset skew at day boundaries.
const now = new Date();
export const TODAY = new Date(new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10));

// This year's and month's numbers (month is 0-11). Read from TODAY's UTC
// fields: its local-time ones are a day behind in US time zones, since TODAY is
// UTC midnight, so on the 1st of a month they still say the previous month.
export const CURRENT_YEAR = TODAY.getUTCFullYear();
export const CURRENT_MONTH = TODAY.getUTCMonth();

// The calendar year of a stored "YYYY-MM-DD" date, read from the text rather
// than through new Date(), which would land a Jan 1 date in the previous year
// in US time zones.
export function yearOf(dateStr) {
  return parseIso(dateStr)?.y;
}

export function daysUntil(dateStr) {
  const d = new Date(dateStr);
  return Math.round((d - TODAY) / 86400000);
}

const RECURRENCE_STEP = {
  daily: { days: 1 },
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

// The due date of the repeat that follows completing a task. Normally one
// period after the task's own due date. A daily task is the exception: if it
// was completed late, "one day after the old due date" would already be in the
// past and the new one would show up overdue, so it lands the day after it was
// completed instead. (`completedOn` is a "YYYY-MM-DD" string.)
export function nextDueAfterCompletion(dueDate, recurrence, completedOn) {
  const next = advanceDueDate(dueDate, recurrence);
  if (next && recurrence === "daily" && completedOn && next <= completedOn) return advanceDueDate(completedOn, "daily");
  return next;
}

// The dates a repeating task falls on after its current due date, from
// `startKey` (default: right after the due date) up to and including `endKey`
// ("YYYY-MM-DD"). Used by the calendar, so a task that repeats shows up on
// every one of its dates and not only the next one. The current due date itself
// is not included (it is the task's own date). Passing the first day of the
// month being viewed as `startKey` skips straight there, so a daily task still
// shows years ahead instead of running out of `maxCount` first.
export function futureOccurrences(dueDate, recurrence, endKey, startKey = "", maxCount = 400) {
  const step = RECURRENCE_STEP[recurrence];
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(dueDate || "");
  const dates = [];
  if (!step || !m) return dates;

  // First repeat to look at: an estimate that never overshoots the start.
  let n = 1;
  const s = /^(\d{4})-(\d{2})-(\d{2})/.exec(startKey || "");
  if (s && startKey > dueDate) {
    if (step.days) {
      const gapDays = Math.round((Date.UTC(+s[1], +s[2] - 1, +s[3]) - Date.UTC(+m[1], +m[2] - 1, +m[3])) / 86400000);
      n = Math.max(1, Math.floor(gapDays / step.days) - 1);
    } else {
      const gapMonths = (+s[1] - +m[1]) * 12 + (+s[2] - +m[2]);
      n = Math.max(1, Math.floor(gapMonths / step.months) - 1);
    }
  }

  for (let count = 0; count < maxCount; count++, n++) {
    const next = advanceDueDate(dueDate, recurrence, n);
    if (!next || next > endKey) break;
    if (!startKey || next >= startKey) dates.push(next);
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
    const months = Math.max(1, (year - CURRENT_YEAR) * 12 - CURRENT_MONTH);
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
  return [...new Set(expenses.map((e) => yearOf(e.date)))].sort((a, b) => b - a);
}

// One chosen year's expenses, grouped by system ("general" for none) and
// summed, highest first — the pie chart's slices.
export function expensesBySystemForYear(expenses, year) {
  const totals = {};
  for (const e of expenses) {
    if (yearOf(e.date) !== year) continue;
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
    if (!e.timeSpentHours || yearOf(e.date) !== year) continue;
    const key = e.systemId || "general";
    totals[key] = (totals[key] || 0) + e.timeSpentHours;
  }
  return Object.entries(totals)
    .map(([key, hours]) => ({ key, value: hours }))
    .sort((a, b) => b.value - a.value);
}

export function computeForecast(systems, expenses) {
  const currentYear = CURRENT_YEAR;
  const years = Array.from({ length: 5 }, (_, i) => currentYear + i);

  const totalsByYear = {};
  for (const e of expenses) {
    const y = yearOf(e.date);
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
