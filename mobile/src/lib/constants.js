import { Home, Wind, Droplet, Zap, Wrench } from "lucide-react-native";

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
  electrical: { label: "Electrical", icon: Zap },
  appliance: { label: "Appliance", icon: Wrench },
};

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
