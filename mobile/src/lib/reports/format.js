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

// Address and property-name display helpers live in lib/address-format.js (shared with the app screens).
export { fmtAddress, fmtPropertyName } from "../address-format.js";
