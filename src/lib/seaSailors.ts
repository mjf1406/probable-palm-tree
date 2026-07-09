export type SeaOcean = "Pacific" | "Atlantic" | "Indian" | "Arctic" | "Southern";

export type SeaCityId = string;

export type SeaCity = {
  id: SeaCityId;
  name: string;
  ocean: SeaOcean;
  lat: number;
  lon: number;
};

const SEA_OCEANS: SeaOcean[] = [
  "Pacific",
  "Atlantic",
  "Indian",
  "Arctic",
  "Southern",
];

// Curated “everyone knows” major coastal cities.
// Note: Ocean assignment is an approximation for gameplay purposes.
const SEA_CITIES: SeaCity[] = [
  // Pacific
  { id: "san_francisco", name: "San Francisco", ocean: "Pacific", lat: 37.7749, lon: -122.4194 },
  { id: "los_angeles", name: "Los Angeles", ocean: "Pacific", lat: 34.0522, lon: -118.2437 },
  { id: "vancouver", name: "Vancouver", ocean: "Pacific", lat: 49.2827, lon: -123.1207 },
  { id: "seattle", name: "Seattle", ocean: "Pacific", lat: 47.6062, lon: -122.3321 },
  { id: "honolulu", name: "Honolulu", ocean: "Pacific", lat: 21.3069, lon: -157.8583 },
  { id: "tokyo", name: "Tokyo", ocean: "Pacific", lat: 35.6762, lon: 139.6503 },
  { id: "manila", name: "Manila", ocean: "Pacific", lat: 14.5995, lon: 120.9842 },
  { id: "sydney", name: "Sydney", ocean: "Pacific", lat: -33.8688, lon: 151.2093 },

  // Atlantic
  { id: "new_york", name: "New York", ocean: "Atlantic", lat: 40.7128, lon: -74.006 },
  { id: "boston", name: "Boston", ocean: "Atlantic", lat: 42.3601, lon: -71.0589 },
  { id: "london", name: "London", ocean: "Atlantic", lat: 51.5074, lon: -0.1278 },
  { id: "lisbon", name: "Lisbon", ocean: "Atlantic", lat: 38.7223, lon: -9.1393 },
  { id: "dakar", name: "Dakar", ocean: "Atlantic", lat: 14.7167, lon: -17.4677 },
  { id: "rio", name: "Rio de Janeiro", ocean: "Atlantic", lat: -22.9068, lon: -43.1729 },
  { id: "buenos_aires", name: "Buenos Aires", ocean: "Atlantic", lat: -34.6037, lon: -58.3816 },

  // Indian
  { id: "mumbai", name: "Mumbai", ocean: "Indian", lat: 19.076, lon: 72.8777 },
  { id: "chennai", name: "Chennai", ocean: "Indian", lat: 13.0827, lon: 80.2707 },
  { id: "colombo", name: "Colombo", ocean: "Indian", lat: 6.9271, lon: 79.8612 },
  { id: "dubai", name: "Dubai", ocean: "Indian", lat: 25.2048, lon: 55.2708 },
  { id: "cape_town", name: "Cape Town", ocean: "Indian", lat: -33.9249, lon: 18.4241 },
  { id: "perth", name: "Perth", ocean: "Indian", lat: -31.9523, lon: 115.8613 },

  // Arctic
  { id: "anchorage", name: "Anchorage", ocean: "Arctic", lat: 61.2181, lon: -149.9003 },
  { id: "murmansk", name: "Murmansk", ocean: "Arctic", lat: 68.9694, lon: 33.0824 },
  { id: "reykjavik", name: "Reykjavik", ocean: "Arctic", lat: 64.1466, lon: -21.9426 },
  { id: "nuuk", name: "Nuuk", ocean: "Arctic", lat: 64.1835, lon: -51.7216 },
  { id: "tromso", name: "Tromso", ocean: "Arctic", lat: 69.6492, lon: 18.956 },

  // Southern (often treated as subarctic/Antarctic coastal ports)
  { id: "ushuaia", name: "Ushuaia", ocean: "Southern", lat: -54.8019, lon: -68.303 },
  { id: "punta_delgada", name: "Punta Arenas", ocean: "Southern", lat: -53.1638, lon: -70.9174 },
  { id: "hobart", name: "Hobart", ocean: "Southern", lat: -42.8821, lon: 147.3272 },
];

export function getSeaOceans(): SeaOcean[] {
  return [...SEA_OCEANS];
}

export function getSeaCitiesForOcean(ocean: SeaOcean): SeaCity[] {
  return SEA_CITIES.filter((city) => city.ocean === ocean);
}

export function getSeaCityById(cityId: SeaCityId): SeaCity | null {
  return SEA_CITIES.find((c) => c.id === cityId) ?? null;
}

export function computeGreatCircleDistanceMeters(a: SeaCity, b: SeaCity): number {
  // Haversine formula: distance between two lat/lon points on a sphere.
  const R = 6371e3; // Earth radius in meters.
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const phi1 = toRad(a.lat);
  const phi2 = toRad(b.lat);
  const dPhi = toRad(b.lat - a.lat);
  const dLambda = toRad(b.lon - a.lon);

  const sinDphi2 = Math.sin(dPhi / 2);
  const sinDlambda2 = Math.sin(dLambda / 2);
  const h =
    sinDphi2 * sinDphi2 +
    Math.cos(phi1) * Math.cos(phi2) * sinDlambda2 * sinDlambda2;

  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return Math.round(R * c);
}

export function seaRouteKey(ocean: SeaOcean, fromCityId: SeaCityId, toCityId: SeaCityId): string {
  return `${ocean}::${fromCityId}::${toCityId}`;
}

export function seaRouteLabel(ocean: SeaOcean, from: SeaCity, to: SeaCity): string {
  return `${from.name} → ${to.name} (${ocean})`;
}

export function clampSeaRoute(
  ocean: SeaOcean,
  fromCityId: SeaCityId,
  toCityId: SeaCityId,
): { fromCityId: SeaCityId; toCityId: SeaCityId } {
  const cities = getSeaCitiesForOcean(ocean);
  if (cities.length === 0) {
    return { fromCityId, toCityId };
  }

  const fromStillInOcean = cities.some((city) => city.id === fromCityId);
  const toStillInOcean = cities.some((city) => city.id === toCityId);

  const nextFrom = fromStillInOcean ? fromCityId : cities[0]!.id;
  let nextTo = toStillInOcean
    ? toCityId
    : (cities[1]?.id ?? cities[0]!.id);

  if (nextFrom === nextTo) {
    const alternative = cities.find((city) => city.id !== nextFrom);
    if (alternative) {
      nextTo = alternative.id;
    }
  }

  return { fromCityId: nextFrom, toCityId: nextTo };
}

export function getDefaultSeaRoute() {
  // For UI defaults we use a famous route and mirror the original plan’s goal baseline.
  const ocean: SeaOcean = "Pacific";
  const fromCityId: SeaCityId = "san_francisco";
  const toCityId: SeaCityId = "honolulu";
  const from = getSeaCityById(fromCityId);
  const to = getSeaCityById(toCityId);
  if (!from || !to) {
    throw new Error("Default Sea Sailors cities missing");
  }
  const distanceMeters = computeGreatCircleDistanceMeters(from, to);
  return {
    ocean,
    fromCityId,
    toCityId,
    distanceMeters,
    routeKey: seaRouteKey(ocean, fromCityId, toCityId),
  };
}

