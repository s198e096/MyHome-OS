import { TODAY } from "./forecast.js";

export const HVAC_FAIL_AGE_YEARS = 13; // typical risk window is 12-15 years
export const WATER_HEATER_FAIL_AGE_YEARS = 9; // typical risk window is 8-10 years

// Maps every checklist key (self-reported or automatic) to the maintenance
// task title created when that check fails.
export const FAIL_TASK_TITLES = {
  thermostat: "Install a programmable or smart thermostat",
  door_window_gaps: "Seal gaps around doors and windows",
  attic_insulation: "Add or upgrade attic insulation",
  water_heater_temp: "Lower water heater temperature to 120°F or below",
  led_bulbs: "Replace remaining incandescent bulbs with LED",
  duct_leaks: "Seal duct leaks",
  hvac_age: "Schedule HVAC system replacement or inspection",
  water_heater_age: "Schedule water heater replacement or inspection",
};

function systemAgeYears(sys) {
  return (TODAY - new Date(sys.purchaseDate)) / (365.25 * 86400000);
}

function oldestSystem(systems, category) {
  const matches = systems.filter((s) => s.category === category && s.purchaseDate);
  if (matches.length === 0) return null;
  return matches.reduce((oldest, s) => (systemAgeYears(s) > systemAgeYears(oldest) ? s : oldest));
}

function ageContext(sys) {
  if (!sys) return "No system logged yet";
  const years = Math.floor(systemAgeYears(sys));
  return `Installed ${new Date(sys.purchaseDate).getFullYear()} · ${years} year${years === 1 ? "" : "s"} old`;
}

export function computeAutoChecks(systems) {
  const hvac = oldestSystem(systems, "hvac");
  const waterHeater = oldestSystem(systems, "water_heater");

  return [
    {
      key: "hvac_age",
      label: "HVAC system age",
      status: hvac ? (systemAgeYears(hvac) > HVAC_FAIL_AGE_YEARS ? "fail" : "pass") : "unknown",
      context: ageContext(hvac),
      failTask: FAIL_TASK_TITLES.hvac_age,
    },
    {
      key: "water_heater_age",
      label: "Water heater age",
      status: waterHeater ? (systemAgeYears(waterHeater) > WATER_HEATER_FAIL_AGE_YEARS ? "fail" : "pass") : "unknown",
      context: ageContext(waterHeater),
      failTask: FAIL_TASK_TITLES.water_heater_age,
    },
  ];
}

export function computeEnergyScore(autoChecks, selfChecks) {
  const passed = [...autoChecks, ...selfChecks].filter((c) => c.status === "pass").length;
  return { passed, total: autoChecks.length + selfChecks.length };
}
