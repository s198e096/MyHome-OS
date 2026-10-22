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

// True only when every required field is still blank — most systems will
// always be missing a few optional details, so "completely unfilled" is a
// more useful threshold for nudging the user than "missing anything at all".
export function isSystemEmpty(sys) {
  return missingSystemInfo(sys).length === REQUIRED_FIELDS.length;
}
