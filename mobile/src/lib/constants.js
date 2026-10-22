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
