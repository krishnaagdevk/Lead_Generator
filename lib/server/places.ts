import { getPlacesCache, setPlacesCache } from "./cache";

const PLACES_KEY = process.env.GOOGLE_PLACES_API_KEY || "";
const BASE = "https://maps.googleapis.com/maps/api/place";

async function fetchPages(url: string, params: Record<string, string>): Promise<unknown[]> {
  const results: unknown[] = [];
  let token: string | undefined;

  for (let page = 0; page < 3; page++) {
    const p = new URLSearchParams({ ...params, key: PLACES_KEY });
    if (token) {
      await new Promise((r) => setTimeout(r, 2000)); // required delay for next_page_token
      p.set("pagetoken", token);
    }
    const res = await fetch(`${url}?${p}`);
    const data = (await res.json()) as { results?: unknown[]; next_page_token?: string };
    results.push(...(data.results ?? []));
    token = data.next_page_token;
    if (!token) break;
  }
  return results;
}

export async function searchNearby(
  businessType: string,
  lat: number,
  lng: number,
  radiusM: number
): Promise<unknown[]> {
  const cacheKey = `nearby:${businessType.toLowerCase().trim()}:${lat.toFixed(6)}:${lng.toFixed(6)}:${radiusM}`;
  const cached = await getPlacesCache(cacheKey);
  if (cached && Array.isArray(cached)) {
    return cached;
  }

  const results = await fetchPages(`${BASE}/nearbysearch/json`, {
    keyword: businessType,
    location: `${lat},${lng}`,
    radius: String(radiusM),
  });

  await setPlacesCache(cacheKey, results);
  return results;
}

export async function searchText(businessType: string, location: string): Promise<unknown[]> {
  const cacheKey = `text:${businessType.toLowerCase().trim()}:${location.toLowerCase().trim()}`;
  const cached = await getPlacesCache(cacheKey);
  if (cached && Array.isArray(cached)) {
    return cached;
  }

  const results = await fetchPages(`${BASE}/textsearch/json`, {
    query: `${businessType} in ${location}`,
  });

  await setPlacesCache(cacheKey, results);
  return results;
}

export function normalizePlace(place: Record<string, unknown>): Record<string, unknown> {
  const types = (place.types as string[]) ?? [];
  const category =
    types.find((t) => !["point_of_interest", "establishment"].includes(t))
      ?.replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase()) ?? null;

  const loc = (place.geometry as { location?: { lat: number; lng: number } })?.location;

  return {
    placeId: place.place_id ?? "",
    name: place.name ?? "",
    category,
    address: place.vicinity ?? place.formatted_address ?? null,
    phone: place.formatted_phone_number ?? null,
    websiteUrl: place.website ?? null,
    rating: place.rating ?? null,
    reviewCount: place.user_ratings_total ?? null,
    mapsUrl: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
    _lat: loc?.lat,
    _lng: loc?.lng,
  };
}
