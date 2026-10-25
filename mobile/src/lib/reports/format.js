// Formatting helpers shared by the PDF report builders. Pure functions with no
// app or React Native imports, so the reports can be built (and tested) anywhere.
//
// Dates are stored as date-only ISO strings ("2019-03-12"). They are parsed by
// hand here instead of through `new Date(...)`, which reads them as UTC midnight
// and can print the previous day (or month) in US time zones.

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function parseIso(value) {
  const m = typeof value === "string" ? value.match(/^(\d{4})-(\d{2})-(\d{2})/) : null;
  return m ? { y: Number(m[1]), m: Number(m[2]), d: Number(m[3]) } : null;
}

export function fmtDate(value) {
  const p = parseIso(value);
  return p ? `${MONTHS[p.m - 1]} ${p.d}, ${p.y}` : "—";
}

export function fmtMonthYear(value) {
  const p = parseIso(value);
  return p ? `${MONTHS[p.m - 1]} ${p.y}` : "—";
}

export function fmtYear(value) {
  const p = parseIso(value);
  return p ? String(p.y) : "—";
}

// "October 25, 2026" for the "prepared on" line (a real Date, local calendar day).
export function fmtLongDate(date) {
  return `${MONTHS_LONG[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

// Whole calendar days from a stored ISO date to `today` (negative = in the future).
export function daysSince(value, today) {
  const p = parseIso(value);
  if (!p) return null;
  const then = Date.UTC(p.y, p.m - 1, p.d);
  const now = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((now - then) / 86400000);
}

export function yearsSince(value, today) {
  const days = daysSince(value, today);
  return days == null ? null : Math.max(0, days / 365.25);
}

export function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

export function fmtMoney(n) {
  if (n == null || n === "" || Number.isNaN(Number(n))) return "—";
  return Number(n).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export const sum = (items, pick) => items.reduce((total, item) => total + (Number(pick(item)) || 0), 0);

export const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

export const yesNo = (flag) => (flag ? "Yes" : "No");

// --- addresses ---
//
// Addresses often arrive in lower case with no commas ("1814 ashborough rd se
// marietta ga 30067"), which looks careless on a document handed to an insurer
// or a buyer. An address that already has any capital letter was typed on
// purpose and is left exactly as written; an all-lower-case one is capitalized,
// and when it has no commas they are added between street, city and state.

const STATE_CODES = new Set(
  "al ak az ar ca co ct de dc fl ga hi id il in ia ks ky la me md ma mi mn ms mo mt ne nv nh nj nm ny nc nd oh ok or pa ri sc sd tn tx ut vt va wa wv wi wy".split(" ")
);
const STREET_SUFFIXES = new Set(
  "st street rd road ave avenue blvd boulevard dr drive ln lane ct court cir circle way pl place pkwy parkway hwy highway ter terrace trl trail sq square loop".split(" ")
);
const DIRECTIONS = new Set(["n", "s", "e", "w", "ne", "nw", "se", "sw"]);
const UNIT_WORDS = new Set(["apt", "unit", "ste", "suite", "bldg", "fl"]);
const ORDINAL = /^\d+(st|nd|rd|th)$/;
const ZIP = /^\d{5}(-\d{4})?$/;

function capitalizeWord(w) {
  if (DIRECTIONS.has(w) || w === "po") return w.toUpperCase();
  if (ORDINAL.test(w)) return w;
  if (/\d/.test(w)) return w.toUpperCase(); // 4b -> 4B
  return w.replace(/(^|[-'’/])([a-z])/g, (_, lead, ch) => lead + ch.toUpperCase()).replace(/^Mc([a-z])/, (_, ch) => "Mc" + ch.toUpperCase());
}

export function fmtAddress(raw) {
  const text = String(raw ?? "").trim().replace(/\s+/g, " ");
  if (!text || text !== text.toLowerCase()) return text;

  const hadCommas = text.includes(",");
  const words = text.split(" ").map((token) => ({ w: token.replace(/,+$/, ""), comma: token.endsWith(",") }));
  const lower = words.map((x) => x.w);

  // State = the word before a trailing ZIP (or the last word when there is no ZIP).
  const last = lower.length - 1;
  const hasZip = last >= 1 && ZIP.test(lower[last]);
  const stateIdx = hasZip ? last - 1 : last;
  const hasState = stateIdx >= 1 && STATE_CODES.has(lower[stateIdx]);

  words.forEach((x, i) => {
    x.w = hasState && i === stateIdx ? x.w.toUpperCase() : capitalizeWord(x.w);
  });

  if (!hadCommas && hasState) {
    // Street ends at the first street-type word after the house number and a
    // name (plus a following direction like SE, and a unit like "apt 4b").
    let end = -1;
    for (let i = 2; i < stateIdx; i++) {
      if (STREET_SUFFIXES.has(lower[i])) {
        end = i;
        break;
      }
    }
    if (end !== -1) {
      if (end + 1 < stateIdx && DIRECTIONS.has(lower[end + 1])) end += 1;
      if (end + 2 < stateIdx && (UNIT_WORDS.has(lower[end + 1]) || lower[end + 1].startsWith("#"))) end += UNIT_WORDS.has(lower[end + 1]) ? 2 : 1;
      if (end + 1 < stateIdx) {
        words[end].comma = true; // street,
        words[stateIdx - 1].comma = true; // city,
      }
    }
  }

  return words.map((x) => x.w + (x.comma ? "," : "")).join(" ");
}

// A property nickname typed in all lower case ("main") reads better as "Main".
export function fmtPropertyName(raw) {
  const text = String(raw ?? "").trim();
  return text && text === text.toLowerCase() ? text.replace(/(^|[\s-])([a-z])/g, (_, lead, ch) => lead + ch.toUpperCase()) : text;
}
