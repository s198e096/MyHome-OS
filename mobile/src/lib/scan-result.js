// The model number alone from a label scan. The scan reports the manufacturer
// and the model as separate values, but the model can still come back with
// the manufacturer's name in front ("LG LDFN454HT"); strip that so the Model
// field only ever holds the model number ("LDFN454HT").
//
// Only a brand followed by whitespace or a colon is removed, so a model that
// genuinely starts with the same letters ("LGS123", "LG-123") is left alone,
// and a model is never stripped down to nothing.

const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function scannedModelNumber(brand, model) {
  if (typeof model !== "string") return "";
  const trimmed = model.trim();
  if (!trimmed) return "";
  if (typeof brand === "string" && brand.trim()) {
    const withoutBrand = trimmed.replace(new RegExp(`^${escapeRegExp(brand.trim())}[\\s:]+`, "i"), "");
    if (withoutBrand) return withoutBrand;
  }
  return trimmed;
}
