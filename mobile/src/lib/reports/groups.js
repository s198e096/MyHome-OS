// How systems are grouped in the reports. Everything stored in the app falls
// into one of these buckets, in the order they are printed.

const MAJOR = new Set(["hvac", "hvac_indoor", "hvac_outdoor", "water_heater", "roof", "plumbing", "electrical", "generator", "solar", "ev_charger"]);
const STRUCTURE = new Set(["windows", "exterior", "balcony", "deck", "garden"]);
const FIXTURES = new Set(["toilet", "faucet", "sink"]);

export const GROUP_ORDER = ["Major systems", "Structure & exterior", "Plumbing fixtures", "Appliances"];

export function systemGroup(sys) {
  if (sys.category === "appliance") return "Appliances";
  if (MAJOR.has(sys.category)) return "Major systems";
  if (STRUCTURE.has(sys.category)) return "Structure & exterior";
  if (FIXTURES.has(sys.category)) return "Plumbing fixtures";
  return "Major systems";
}

// [{ group, items }] in print order, skipping empty groups.
export function groupSystems(systems) {
  return GROUP_ORDER.map((group) => ({ group, items: systems.filter((s) => systemGroup(s) === group) })).filter((g) => g.items.length > 0);
}

// What to call a system in a report row, as two parts: the item itself and its
// make/model. For an appliance, `brand` holds the appliance's own name
// ("Dishwasher") and `model` the maker and model number; for everything else
// `brand` is the manufacturer and the item is its system type. A brand that is
// just the type label repeated (the placeholder onboarding writes) is ignored.
export function describeSystem(sys, categoryLabel) {
  const label = categoryLabel(sys);
  if (sys.category === "appliance") {
    return { item: sys.brand || label, makeModel: sys.model || "" };
  }
  const brand = sys.brand && sys.brand !== label ? sys.brand : "";
  return { item: label, makeModel: [brand, sys.model].filter(Boolean).join(" ") };
}
