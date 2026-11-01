// Flags an "expected life" (in years) that looks wrong for the kind of system,
// usually a stray digit (150 for 15). Like checkExpense it only warns: a slate
// roof really can last 100 years, so anything up to MAX_LIFE_YEARS can still be
// saved. Pure functions with no React Native imports, so they can be tested anywhere.

// Above this, an expected life is a typo, not a lifespan: saving is blocked.
export const MAX_LIFE_YEARS = 200;

// Used when the system has no known typical life (e.g. an appliance that hasn't
// been named yet), so a wild number is still caught.
const FALLBACK_TYPICAL_YEARS = 15;

const years = (n) => `${n} ${n === 1 ? "year" : "years"}`;

// Returns null when the field is empty or looks fine, else
// { level: "check" | "extreme" | "blocked", message }.
//   value          the text typed into the field
//   typicalYears   the default life for this kind of system, if known
export function checkLifeYears({ value, typicalYears }) {
  const text = String(value ?? "").trim();
  if (!text) return null;

  const n = parseInt(text, 10);
  if (Number.isNaN(n)) return { level: "blocked", message: "Enter expected life as a number of years." };
  if (n < 1) return { level: "blocked", message: "Expected life must be at least 1 year." };
  if (n > MAX_LIFE_YEARS) return { level: "blocked", message: `That's over ${years(MAX_LIFE_YEARS)}. Enter a smaller number.` };

  const known = typicalYears > 0;
  const typical = known ? typicalYears : FALLBACK_TYPICAL_YEARS;
  const note = known
    ? `This type of system typically lasts about ${years(typical)}.`
    : "Most systems and appliances last 10 to 20 years.";

  if (n > typical * 4) return { level: "extreme", message: `${years(n)} is far longer than usual. ${note} Did an extra digit slip in?` };
  if (n > typical * 2) return { level: "check", message: `${years(n)} is longer than usual. ${note} Double-check the number.` };
  if (n < typical / 6) return { level: "extreme", message: `${years(n)} is far shorter than usual. ${note} Did a digit go missing?` };
  if (n < typical / 3) return { level: "check", message: `${years(n)} is shorter than usual. ${note} Double-check the number.` };
  return null;
}
