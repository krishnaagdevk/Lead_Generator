const getGeoKey = () =>
  process.env.GOOGLE_GEOCODING_API_KEY ||
  process.env.GOOGLE_PLACES_API_KEY ||
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ||
  "";

export async function cityToLatLng(city: string, country = "US"): Promise<[number, number] | null> {
  const key = getGeoKey();
  if (!key || !city?.trim()) return null;

  try {
    const address = country ? `${city.trim()}, ${country.trim()}` : city.trim();
    const params = new URLSearchParams({ address, key });
    const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params}`);
    if (!res.ok) return null;
    const data = (await res.json()) as {
      results?: Array<{ geometry: { location: { lat: number; lng: number } } }>;
      status?: string;
    };
    const loc = data.results?.[0]?.geometry?.location;
    return loc ? [loc.lat, loc.lng] : null;
  } catch (err) {
    console.warn(`Geocoding failed for ${city}:`, err);
    return null;
  }
}

export function pointInPolygon(lat: number, lng: number, polygon: Array<{ lat: number; lng: number }>): boolean {
  let inside = false;
  let j = polygon.length - 1;
  for (let i = 0; i < polygon.length; i++) {
    const xi = polygon[i].lng, yi = polygon[i].lat;
    const xj = polygon[j].lng, yj = polygon[j].lat;
    if ((yi > lat) !== (yj > lat) && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
    j = i;
  }
  return inside;
}
