// Flags expense amounts that look wrong (usually a stray extra zero) when the
// user types a maintenance cost. It only warns: anything up to MAX_EXPENSE can
// still be saved, because a roof replacement really can cost $40,000. Pure
// functions with no React Native imports, so they can be tested anywhere.

import { money } from "./forecast.js";

// Above this, a single home expense is a typo, not a cost: saving is blocked.
export const MAX_EXPENSE = 1000000;

// Per category: [higher than usual, very likely a typo], in dollars.
const LIMITS = {
  Maintenance: [1000, 5000],
  Inspection: [1500, 5000],
  Repair: [8000, 25000],
  Upgrade: [30000, 100000],
  Replacement: [30000, 100000],
  Other: [10000, 50000],
};
const BILL_LIMITS = [1000, 5000];
const DEFAULT_LIMITS = LIMITS.Other;

// What the amount is for, worded to read after "high for ...".
const WHAT = {
  Maintenance: "routine maintenance",
  Inspection: "an inspection",
  Repair: "a repair",
  Upgrade: "an upgrade",
  Replacement: "a replacement",
  Other: "a single expense",
};

const RANK = { check: 1, extreme: 2 };
const isBill = (category) => /bill/i.test(category || "");

// Returns null when the amount looks fine (or isn't a positive number yet), else
// { level: "check" | "extreme" | "blocked", message }.
//   amount          the number typed
//   category        "Maintenance", "Repair", ...
//   systemName      the system it's for, if any (names it in the message)
//   replacementCost that system's estimated replacement cost, if known
//   label           how to refer to the amount (default "$1,234")
export function checkExpense({ amount, category, systemName, replacementCost, label }) {
  const n = Number(amount);
  if (!Number.isFinite(n) || n <= 0) return null;

  if (n > MAX_EXPENSE) return { level: "blocked", message: `That's over ${money(MAX_EXPENSE)}. Enter a smaller amount.` };

  const lead = label || money(n);
  const bill = isBill(category);
  const [checkAt, extremeAt] = bill ? BILL_LIMITS : LIMITS[category] || DEFAULT_LIMITS;
  const what = bill ? "a monthly bill" : WHAT[category] || WHAT.Other;

  let general = null;
  if (n > extremeAt) general = { level: "extreme", message: `${lead} is very high for ${what}. Did an extra zero slip in?` };
  else if (n > checkAt) general = { level: "check", message: `${lead} is higher than usual for ${what}. Double-check the amount.` };

  // Upkeep that costs more than replacing the whole system is almost surely a typo.
  let aboutSystem = null;
  const upkeep = !bill && category !== "Replacement" && category !== "Upgrade";
  if (upkeep && replacementCost > 0 && n > replacementCost) {
    aboutSystem = {
      level: "check",
      message: `${lead} is more than ${systemName || "this system"}'s estimated replacement cost (${money(replacementCost)}). Double-check the amount.`,
    };
  }

  if (!general) return aboutSystem;
  if (!aboutSystem) return general;
  // Keep the stronger level; on a tie the system-specific message says more.
  return RANK[general.level] > RANK[aboutSystem.level] ? general : { ...aboutSystem, level: general.level };
}
