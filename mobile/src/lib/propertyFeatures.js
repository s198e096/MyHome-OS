// Short, human-readable chips summarizing a property's construction/feature
// details (accepts either the raw fetchPropertyDetails() result or a saved
// profile — same field names either way).
export function buildFeatureSummary(d) {
  const chips = [];
  if (d.bathrooms != null) chips.push(`${d.bathrooms} bath`);
  if (d.squareFootage != null) chips.push(`${d.squareFootage.toLocaleString()} sqft`);
  if (d.lotSize != null) chips.push(`${d.lotSize.toLocaleString()} sqft lot`);
  if (d.propertyType) chips.push(d.propertyType);
  if (d.roofType) chips.push(`${d.roofType} roof`);
  if (d.heatingType) chips.push(`${d.heatingType} heat`);
  if (d.coolingType) chips.push(`${d.coolingType} air`);
  if (d.foundationType) chips.push(`${d.foundationType} foundation`);
  if (d.exteriorType) chips.push(`${d.exteriorType} exterior`);
  if (d.hasGarage) chips.push(d.garageSpaces ? `${d.garageSpaces}-car garage` : "Garage");
  if (d.hasPool) chips.push(d.poolType ? `${d.poolType} pool` : "Pool");
  if (d.hasFireplace) chips.push("Fireplace");
  if (d.hoaFee) chips.push(`HOA $${d.hoaFee}/mo`);
  return chips;
}
