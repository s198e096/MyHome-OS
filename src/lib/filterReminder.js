import { FILTER_OPTIONS } from "./constants.js";

export const FILTER_TASK_TITLE = "Replace HVAC air filter";
const DEFAULT_FILTER_DAYS = 90;

// The filter lives in the indoor unit, so prefer it. A generic "HVAC" system
// (entered before the indoor/outdoor split) also counts; an outdoor unit alone doesn't.
export function findFilterUnit(systems) {
  for (const category of ["hvac_indoor", "hvac"]) {
    const matches = systems.filter((s) => s.category === category);
    if (matches.length) return matches.find((s) => s.filterSize) || matches[0];
  }
  return null;
}

export function filterReminderInfo(unit) {
  const option = FILTER_OPTIONS.find((f) => f.key === unit.filterSize);
  return {
    days: option?.days ?? DEFAULT_FILTER_DAYS,
    label: option && option.key !== "unsure" ? option.label : "air filter",
  };
}

const icsDate = (d) => d.toISOString().slice(0, 10).replace(/-/g, "");
const icsEscape = (s) => String(s).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

// A repeating all-day calendar event with alarms at 9am the day before and the
// day of, so the phone's own notification system does the reminding. firstDate
// is the due date of the in-app task (YYYY-MM-DD).
export function buildFilterReminderIcs({ systemId, brand, model, filterLabel, days, firstDate }) {
  const start = new Date(`${firstDate}T00:00:00Z`);
  const end = new Date(start.getTime() + 86400000);
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const description = `Time to replace the ${filterLabel} in your ${brand} ${model}. Repeats every ${days} days.`;

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//MyHome OS//Filter Reminder//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:filter-reminder-${systemId}@myhome-os`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${icsDate(start)}`,
    `DTEND;VALUE=DATE:${icsDate(end)}`,
    `RRULE:FREQ=DAILY;INTERVAL=${days}`,
    `SUMMARY:${icsEscape(FILTER_TASK_TITLE)}`,
    `DESCRIPTION:${icsEscape(description)}`,
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${icsEscape(FILTER_TASK_TITLE)}`,
    "TRIGGER:-PT15H",
    "END:VALARM",
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${icsEscape(FILTER_TASK_TITLE)}`,
    "TRIGGER:PT9H",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export function downloadIcs(filename, content) {
  const url = URL.createObjectURL(new Blob([content], { type: "text/calendar;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
