import {
  Home, Wind, Droplet, Droplets, Zap, Wrench, AppWindow, PaintBucket, DoorOpen, Grid2x2, Trees, Toilet, Faucet, PlugZap, Sun, EvCharger,
  Refrigerator, WashingMachine, Microwave, Flame, Snowflake, Trash2, Fan, UtensilsCrossed,
} from "lucide-react-native";

export const PRIMARY = "#16240F";
export const HERO_BG_TOP = "#D3ECBC";
export const HERO_BG_BOTTOM = "#BEE1A5";
export const ACCENT_YELLOW = "#F3EA6B";

export const TAB_ORDER = ["home", "furniture", "systems", "tasks", "costs", "docs", "account"];

export const FREE_SYSTEM_LIMIT = 10;

export const ROOMS = ["Living Room", "Dining Room", "Kitchen", "Bedroom", "Bathroom", "Office", "Garage", "Other"];

// Household bills, previously offered as expense categories. No longer
// shown when adding a new expense, but kept so an expense already logged
// under one of these (and the reports feature, which separates bills from
// system costs) still work.
const BILL_CATEGORIES = ["Electricity bill", "Water bill", "Gas bill", "Other bills"];
export const isBillCategory = (category) => BILL_CATEGORIES.includes(category);

export const EXPENSE_CATEGORIES = ["Maintenance", "Repair", "Replacement", "Inspection", "Upgrade", "Other"];

export const CATEGORY_META = {
  hvac: { label: "HVAC", icon: Wind },
  hvac_indoor: { label: "HVAC - Indoor Unit", icon: Wind },
  hvac_outdoor: { label: "HVAC - Outdoor Unit", icon: Wind },
  water_heater: { label: "Water heater", icon: Droplet },
  roof: { label: "Roof", icon: Home },
  plumbing: { label: "Plumbing", icon: Droplet },
  toilet: { label: "Toilet", icon: Toilet },
  faucet: { label: "Faucet", icon: Faucet },
  sink: { label: "Sink", icon: Droplet },
  electrical: { label: "Electrical", icon: Zap },
  generator: { label: "Backup Generator", icon: PlugZap },
  solar: { label: "Solar Panels", icon: Sun },
  ev_charger: { label: "EV Charger", icon: EvCharger },
  appliance: { label: "Appliance", icon: Wrench },
  windows: { label: "Windows", icon: AppWindow },
  exterior: { label: "Exterior / Paint", icon: PaintBucket },
  balcony: { label: "Balcony", icon: DoorOpen },
  deck: { label: "Deck", icon: Grid2x2 },
  garden: { label: "Garden / Backyard", icon: Trees },
};

// Display name for a system. Onboarding can create systems with only a
// category (brand/model empty), so fall back to the category label.
export function systemName(sys) {
  const name = [sys.brand, sys.model].filter(Boolean).join(" ");
  return name || CATEGORY_META[sys.category]?.label || "System";
}

// Short label for list rows — brand (or the category label if there's no
// brand) without the model, since brand+model can run long enough to wrap
// and clutter a list. The full name still shows on the system's own page.
export function systemShortName(sys) {
  return sys.brand || CATEGORY_META[sys.category]?.label || "System";
}

// Default "expected life" years per category, sourced from InterNACHI's
// home component life expectancy table (nachi.org/life-expectancy.htm).
// Where the source gives a range, this uses the midpoint, rounded to the
// nearest year. A few categories aren't covered by that table at all
// (ev_charger, balcony, garden) — those are this app's own best-effort
// estimate, not sourced from NACHI.
export const DEFAULT_LIFE_YEARS = {
  hvac_indoor: 20, // Furnace: 15-25 years
  hvac_outdoor: 14, // Condenser: 8-20 years
  water_heater: 9, // Water Heater (conventional): 6-12 years
  roof: 30, // Asphalt Shingles (architectural): 30 years
  plumbing: 50, // Water Line (copper/plastic): 50 years
  toilet: 100, // Toilets, Bidets and Urinals: 100+ years
  faucet: 18, // Faucets and Spray Hose: 15-20 years
  sink: 8, // Enameled Steel Kitchen Sink: 5-10+ years
  electrical: 60, // Service Panel: 60 years
  generator: 12, // Residential Propane Backup Generators: 12 years
  solar: 25, // Solar Panels: 20-30 years
  ev_charger: 10, // not in the NACHI table — this app's own estimate
  windows: 14, // Double-Pane: 8-20 years
  exterior: 9, // Paint (exterior): 7-10 years
  balcony: 20, // not in the NACHI table — using Deck's "Structural Wood" as an analog
  deck: 20, // Structural Wood: 10-30 years
  garden: 20, // not in the NACHI table — using Wood Fencing as a proxy
};

// Same idea, but per-appliance-name, since "appliance" is one shared
// category — matched the same way APPLIANCE_ICON_RULES matches an icon.
const DEFAULT_APPLIANCE_LIFE_YEARS_RULES = [
  [/range hood/i, 14], // Range/Oven Hood: 14 years
  [/garbage disposal|disposal/i, 12], // Disposal (food waste): 12 years
  [/refrigerator|fridge/i, 11], // Refrigerator: 9-13 years
  [/dishwasher/i, 9], // Dishwasher: 9 years
  [/washing machine|washer/i, 10], // Washing Machine: 5-15 years
  [/dryer/i, 13], // Dryer (clothes): 13 years
  [/microwave/i, 9], // Microwave Oven: 9 years
  [/oven|\brange\b/i, 14], // Gas Oven: 10-18 years / Electric Range: 13-15 years
  [/freezer/i, 15], // Freezer: 10-20 years
  [/water softener|softener/i, 20], // Water Softener: 20 years
];
const DEFAULT_APPLIANCE_LIFE_YEARS_FALLBACK = 10;

// Best-guess default "expected life" for a system, used to pre-fill the
// field rather than leaving it blank or always defaulting to the same
// flat number regardless of what kind of system this is.
export function defaultExpectedLifeYears(category, brand) {
  if (category === "appliance") {
    if (!brand) return null;
    return DEFAULT_APPLIANCE_LIFE_YEARS_RULES.find(([pattern]) => pattern.test(brand))?.[1] ?? DEFAULT_APPLIANCE_LIFE_YEARS_FALLBACK;
  }
  return DEFAULT_LIFE_YEARS[category] ?? null;
}

// Every "appliance" system shares one generic category, so CATEGORY_META
// alone can't tell a fridge from a dryer — match on the name instead
// (brand holds the appliance name for this category, e.g. "Refrigerator",
// "Dishwasher 2"). Most specific patterns first, since "Range Hood" would
// otherwise also match the bare "range" rule for Oven/Range.
const APPLIANCE_ICON_RULES = [
  [/range hood/i, Fan],
  [/garbage disposal|disposal/i, Trash2],
  [/refrigerator|fridge/i, Refrigerator],
  [/dishwasher/i, UtensilsCrossed],
  [/washing machine|washer/i, WashingMachine],
  [/dryer/i, Wind],
  [/microwave/i, Microwave],
  [/oven|\brange\b/i, Flame],
  [/freezer/i, Snowflake],
  [/water softener|softener/i, Droplets],
];

function applianceIcon(name) {
  if (!name) return Wrench;
  return APPLIANCE_ICON_RULES.find(([pattern]) => pattern.test(name))?.[1] || Wrench;
}

// Icon for a system row — same as its category icon, except "appliance"
// systems get a name-specific icon so a fridge doesn't look like a dryer.
export function systemIcon(sys) {
  if (sys.category === "appliance") return applianceIcon(sys.brand);
  return CATEGORY_META[sys.category]?.icon || Wrench;
}

export const RECURRENCE_OPTIONS = [
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
  { key: "quarterly", label: "Quarterly" },
  { key: "semiannually", label: "Semi-annually" },
  { key: "annually", label: "Annually" },
];

const RECURRENCE_LABEL = Object.fromEntries(RECURRENCE_OPTIONS.map((r) => [r.key, r.label]));

// Suggested maintenance tasks per system category, with how often each
// typically needs doing — offered when importing tasks for a system rather
// than typing them in one at a time.
export const COMMON_SYSTEM_TASKS = {
  hvac_indoor: [
    { title: "Replace air filter", recurrence: "quarterly" },
    { title: "Professional HVAC tune-up", recurrence: "annually" },
    { title: "Clean indoor coil", recurrence: "annually" },
  ],
  hvac_outdoor: [
    { title: "Clean outdoor condenser coil", recurrence: "semiannually" },
    { title: "Clear debris around unit", recurrence: "quarterly" },
    { title: "Check refrigerant lines", recurrence: "annually" },
  ],
  water_heater: [
    { title: "Flush water heater tank", recurrence: "annually" },
    { title: "Test temperature & pressure relief valve", recurrence: "annually" },
  ],
  roof: [
    { title: "Inspect roof for damage", recurrence: "annually" },
    { title: "Clean gutters", recurrence: "semiannually" },
  ],
  plumbing: [
    { title: "Inspect for leaks", recurrence: "semiannually" },
    { title: "Check water pressure", recurrence: "annually" },
  ],
  toilet: [{ title: "Check for leaks & running water", recurrence: "semiannually" }],
  faucet: [{ title: "Check for drips & clean aerator", recurrence: "semiannually" }],
  sink: [{ title: "Check for leaks under sink", recurrence: "semiannually" }],
  electrical: [
    { title: "Test smoke & CO detectors", recurrence: "monthly" },
    { title: "Test GFCI outlets", recurrence: "semiannually" },
    { title: "Inspect electrical panel", recurrence: "annually" },
  ],
  generator: [
    { title: "Run generator self-test", recurrence: "monthly" },
    { title: "Change oil & filter", recurrence: "annually" },
  ],
  solar: [
    { title: "Clean solar panels", recurrence: "semiannually" },
    { title: "Inspect panels & wiring", recurrence: "annually" },
  ],
  ev_charger: [{ title: "Inspect charging cable & connector", recurrence: "semiannually" }],
  appliance: [
    { title: "Clean filter/coils", recurrence: "quarterly" },
    { title: "Deep clean", recurrence: "semiannually" },
  ],
  windows: [{ title: "Inspect seals & caulking", recurrence: "annually" }],
  exterior: [{ title: "Inspect exterior paint/siding", recurrence: "annually" }],
  balcony: [{ title: "Inspect structure & railing", recurrence: "annually" }],
  deck: [
    { title: "Inspect boards & railing", recurrence: "semiannually" },
    { title: "Reseal/stain deck", recurrence: "annually" },
  ],
  garden: [{ title: "Trim trees & shrubs away from house", recurrence: "semiannually" }],
};

export function recurrenceLabel(key) {
  return RECURRENCE_LABEL[key] || key;
}

// Which categories each onboarding step offers, and in which order they're
// walked through after the property step.
export const ONBOARDING_SYSTEM_CATEGORIES = ["hvac_indoor", "hvac_outdoor", "water_heater", "plumbing", "electrical"];
export const ONBOARDING_STRUCTURE_CATEGORIES = ["roof", "windows", "exterior", "balcony", "deck", "garden"];
export const ONBOARDING_FIXTURE_CATEGORIES = ["toilet", "faucet", "sink"];

export const FILTER_OPTIONS = [
  { key: "1in", label: '1" filter', days: 60 },
  { key: "4in", label: '4" media filter', days: 180 },
  { key: "5in", label: '5" media filter', days: 270 },
  { key: "unsure", label: "Not sure", days: 90 },
];

export const STATUS_COLOR = {
  green: "#3B6D11",
  yellow: "#BA7517",
  red: "#A32D2D",
};

export const STATUS_BG = {
  green: "#EAF3DE",
  yellow: "#FAEEDA",
  red: "#FCEBEB",
};

export const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "",
    features: ["1 property", "10 appliances/systems", "Basic maintenance"],
  },
  {
    id: "plus",
    name: "Plus",
    price: "$4.99",
    period: "/month",
    features: ["Unlimited systems", "Unlimited documents", "Cost forecasting", "Advanced reminders", "Cloud backup"],
  },
  {
    id: "premium",
    name: "Premium",
    price: "$49.99",
    period: "/year",
    features: ["Everything in Plus", "Billed annually — about 2 months free vs. monthly"],
    highlight: true,
  },
  {
    id: "lifetime",
    name: "Lifetime",
    price: "$79.99",
    period: " once",
    features: ["Everything in Premium", "One-time payment, no recurring billing"],
  },
];
