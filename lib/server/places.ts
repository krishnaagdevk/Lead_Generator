import { getPlacesCache, setPlacesCache } from "./cache";

const PLACES_KEY = process.env.GOOGLE_PLACES_API_KEY || "";
const SERPAPI_KEY = process.env.SERPAPI_KEY || "";
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

export async function searchNearbySerpAPI(
  businessType: string,
  lat: number,
  lng: number
): Promise<unknown[]> {
  if (!SERPAPI_KEY) {
    console.warn("No SERPAPI_KEY configured for fallback.");
    return [];
  }

  try {
    const params = new URLSearchParams({
      engine: "google_maps",
      q: businessType,
      ll: `@${lat},${lng},14z`,
      type: "search",
      api_key: SERPAPI_KEY,
    });

    const res = await fetch(`https://serpapi.com/search.json?${params}`);
    if (!res.ok) {
      throw new Error(`SerpAPI error: ${res.statusText}`);
    }

    const data = await res.json() as { local_results?: any[] };
    const localResults = data.local_results ?? [];

    return localResults.map((item) => ({
      place_id: item.gps_coordinates ? `serp:${item.gps_coordinates.latitude},${item.gps_coordinates.longitude}` : `serp:${item.title}`,
      name: item.title,
      types: [item.type].filter(Boolean),
      vicinity: item.address,
      formatted_address: item.address,
      formatted_phone_number: item.phone,
      website: item.website,
      rating: item.rating,
      user_ratings_total: item.reviews,
      geometry: {
        location: {
          lat: item.gps_coordinates?.latitude ?? lat,
          lng: item.gps_coordinates?.longitude ?? lng,
        },
      },
    }));
  } catch (err) {
    console.error("Failed to fetch from SerpAPI fallback:", err);
    return [];
  }
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

  let results: unknown[] = [];
  try {
    if (!PLACES_KEY) throw new Error("Google Places key not set");
    results = await fetchPages(`${BASE}/nearbysearch/json`, {
      keyword: businessType,
      location: `${lat},${lng}`,
      radius: String(radiusM),
    });
  } catch (err) {
    console.warn(`Google Places search failed, falling back to SerpAPI:`, err);
    results = await searchNearbySerpAPI(businessType, lat, lng);
  }

  if (results.length > 0) {
    await setPlacesCache(cacheKey, results);
  }
  return results;
}

export async function searchTextSerpAPI(businessType: string, location: string): Promise<unknown[]> {
  if (!SERPAPI_KEY) {
    console.warn("No SERPAPI_KEY configured for fallback.");
    return [];
  }

  try {
    const params = new URLSearchParams({
      engine: "google_maps",
      q: `${businessType} in ${location}`,
      type: "search",
      api_key: SERPAPI_KEY,
    });

    const res = await fetch(`https://serpapi.com/search.json?${params}`);
    if (!res.ok) {
      throw new Error(`SerpAPI error: ${res.statusText}`);
    }

    const data = await res.json() as { local_results?: any[] };
    const localResults = data.local_results ?? [];

    return localResults.map((item) => ({
      place_id: item.gps_coordinates ? `serp:${item.gps_coordinates.latitude},${item.gps_coordinates.longitude}` : `serp:${item.title}`,
      name: item.title,
      types: [item.type].filter(Boolean),
      vicinity: item.address,
      formatted_address: item.address,
      formatted_phone_number: item.phone,
      website: item.website,
      rating: item.rating,
      user_ratings_total: item.reviews,
      geometry: {
        location: {
          lat: item.gps_coordinates?.latitude ?? 0,
          lng: item.gps_coordinates?.longitude ?? 0,
        },
      },
    }));
  } catch (err) {
    console.error("Failed to fetch from SerpAPI text search fallback:", err);
    return [];
  }
}

export async function searchText(businessType: string, location: string): Promise<unknown[]> {
  const cacheKey = `text:${businessType.toLowerCase().trim()}:${location.toLowerCase().trim()}`;
  const cached = await getPlacesCache(cacheKey);
  if (cached && Array.isArray(cached)) {
    return cached;
  }

  let results: unknown[] = [];
  try {
    if (!PLACES_KEY) throw new Error("Google Places key not set");
    results = await fetchPages(`${BASE}/textsearch/json`, {
      query: `${businessType} in ${location}`,
    });
  } catch (err) {
    console.warn(`Google Places text search failed, falling back to SerpAPI:`, err);
    results = await searchTextSerpAPI(businessType, location);
  }

  if (results.length > 0) {
    await setPlacesCache(cacheKey, results);
  }
  return results;
}

export async function getPlaceDetails(placeId: string): Promise<Record<string, unknown> | null> {
  if (placeId.startsWith("serp:")) {
    return {};
  }

  const cacheKey = `details:${placeId}`;
  const cached = await getPlacesCache(cacheKey);
  if (cached) {
    return cached as Record<string, unknown>;
  }

  const p = new URLSearchParams({
    place_id: placeId,
    fields: "formatted_phone_number,website",
    key: PLACES_KEY,
  });

  try {
    const res = await fetch(`${BASE}/details/json?${p}`);
    const data = (await res.json()) as { result?: Record<string, unknown> };
    const result = data.result ?? null;
    if (result) {
      await setPlacesCache(cacheKey, result);
    }
    return result;
  } catch (err) {
    console.error(`Failed to fetch place details for ${placeId}:`, err);
    return null;
  }
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
