// Details the system form requires but onboarding's quick-add leaves empty.
// Warranty, serial number, photo and filter size are optional, so they are
// never flagged as missing.
const blank = (v) => v == null || (typeof v === "string" && !v.trim());

const REQUIRED_FIELDS = [
  { label: "Brand", key: "brand" },
  { label: "Model", key: "model" },
  { label: "Location", key: "location" },
  { label: "Date installed", key: "purchaseDate" },
  { label: "Purchase price", key: "purchasePrice" },
  { label: "Expected life", key: "expectedLifeYears" },
  { label: "Replacement cost", key: "replacementCost" },
];

export function missingSystemInfo(sys) {
  return REQUIRED_FIELDS.filter((f) => blank(sys[f.key])).map((f) => f.label);
}
