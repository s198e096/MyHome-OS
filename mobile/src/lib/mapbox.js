const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;

export async function autocompleteAddress(query) {
  if (!query.trim()) return [];

  const params = new URLSearchParams({
    q: query,
    autocomplete: "true",
    types: "address",
    limit: "5",
    access_token: MAPBOX_TOKEN,
  });
  const response = await fetch(`https://api.mapbox.com/search/geocode/v6/forward?${params}`);
  if (!response.ok) throw new Error("Mapbox autocomplete request failed");

  const data = await response.json();
  return (data.features || []).map((f, i) => ({
    id: f.id || `${i}-${f.properties.full_address}`,
    formattedAddress: f.properties.full_address,
  }));
}
