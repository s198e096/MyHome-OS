import { TODAY } from "./forecast.js";

export function findFilterUnit(systems) {
  const indoorUnits = systems.filter((s) => s.category === "hvac_indoor");
  return indoorUnits.find((s) => s.filterSize) || indoorUnits[0] || null;
}

const icsDate = (d) => d.toISOString().slice(0, 10).replace(/-/g, "");
const icsEscape = (s) => String(s).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

// A repeating all-day calendar event with two alarms (9am the day before and
// 9am the day of), so the phone's own notification system does the reminding.
// The first date matches the due date of the in-app "Replace HVAC air filter" task.
export function buildFilterReminderIcs({ systemId, brand, model, filterLabel, days }) {
  const start = new Date(TODAY.getTime() + days * 86400000);
  const end = new Date(start.getTime() + 86400000);
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const title = "Replace HVAC air filter";
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
    `SUMMARY:${icsEscape(title)}`,
    `DESCRIPTION:${icsEscape(description)}`,
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${icsEscape(title)}`,
    "TRIGGER:-PT15H",
    "END:VALARM",
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${icsEscape(title)}`,
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
