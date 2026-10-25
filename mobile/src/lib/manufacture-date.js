// Turns the manufacture date the label scan read ("2019", "2019-03" or
// "2019-03-12" — exactly as precise as the label states it) into the full
// YYYY-MM-DD the "Date installed" field stores. Returns null for anything
// unusable, so a bad read never pre-fills the field.
//
// A missing day becomes the 15th and a missing month becomes June, not the
// 1st: date-only strings are parsed as UTC midnight across the app, so a date
// on the 1st displays as the previous month in US time zones ("03/2019"
// would show as Feb 2019). The 15th is safe from that shift.

export const MANUFACTURE_DATE_NOTE =
  "Filled in from the manufacture date on the label — change it if the system was installed later.";

const MIN_YEAR = 1950;
const pad = (n) => String(n).padStart(2, "0");

export function manufactureDateToInstalled(raw, today = new Date()) {
  if (typeof raw !== "string") return null;
  const m = raw.trim().match(/^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/);
  if (!m) return null;

  const year = Number(m[1]);
  const month = m[2] ? Number(m[2]) : null;
  const day = m[3] ? Number(m[3]) : null;
  if (year < MIN_YEAR) return null;
  if (month !== null && (month < 1 || month > 12)) return null;
  if (day !== null && (day < 1 || day > 31)) return null;

  const filledMonth = month ?? 6;
  const filledDay = day ?? 15;

  // Reject impossible calendar dates like Feb 30 (Date rolls them over).
  if (new Date(Date.UTC(year, filledMonth - 1, filledDay)).getUTCDate() !== filledDay) return null;

  const iso = `${year}-${pad(filledMonth)}-${pad(filledDay)}`;
  // A manufacture date in the future means the label was misread.
  if (iso > today.toISOString().slice(0, 10)) return null;
  return iso;
}
