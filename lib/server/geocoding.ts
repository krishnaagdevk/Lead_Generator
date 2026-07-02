const GEO_KEY = process.env.GOOGLE_GEOCODING_API_KEY || "";

export async function cityToLatLng(city: string, country = "US"): Promise<[number, number] | null> {
  const params = new URLSearchParams({ address: `${city}, ${country}`, key: GEO_KEY });
  const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params}`);
  const data = await res.json() as { results?: Array<{ geometry: { location: { lat: number; lng: number } } }> };
  const loc = data.results?.[0]?.geometry.location;
  return loc ? [loc.lat, loc.lng] : null;
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
