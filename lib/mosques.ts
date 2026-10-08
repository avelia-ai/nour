import * as Linking from 'expo-linking';
import { requestCurrentCoordinates } from '@/lib/prayer-times';

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const SEARCH_RADIUS_METERS = 5000;

export type Mosque = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  distanceMeters: number;
  address?: string;
  openingHours?: string;
  serviceTimes?: string;
  website?: string;
};

type OverpassElement = {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: {
    lat: number;
    lon: number;
  };
  tags?: Record<string, string>;
};

type OverpassResponse = {
  elements: OverpassElement[];
};

function distanceInMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const earthRadius = 6371000;
  const toRadians = (value: number) => (value * Math.PI) / 180;

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) ** 2;

  return 2 * earthRadius * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getCoordinates(element: OverpassElement) {
  if (
    typeof element.lat === 'number' &&
    typeof element.lon === 'number'
  ) {
    return {
      latitude: element.lat,
      longitude: element.lon,
    };
  }

  if (element.center) {
    return {
      latitude: element.center.lat,
      longitude: element.center.lon,
    };
  }

  return null;
}

function buildAddress(tags: Record<string, string>) {
  const parts = [
    tags['addr:housenumber'],
    tags['addr:street'],
    tags['addr:postcode'],
    tags['addr:city'],
  ].filter(Boolean);

  return parts.length ? parts.join(' ') : undefined;
}

export async function getNearbyMosques(): Promise<{
  mosques: Mosque[];
  latitude: number;
  longitude: number;
}> {
  const coords = await requestCurrentCoordinates();

  const query = `
[out:json][timeout:20];
(
  nwr["amenity"="place_of_worship"]["religion"="muslim"](around:${SEARCH_RADIUS_METERS},${coords.latitude},${coords.longitude});
  nwr["building"="mosque"](around:${SEARCH_RADIUS_METERS},${coords.latitude},${coords.longitude});
  nwr["amenity"="place_of_worship"]["place_of_worship"="mosque"](around:${SEARCH_RADIUS_METERS},${coords.latitude},${coords.longitude});
);
out center tags;
`;

  const response = await fetch(OVERPASS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `data=${encodeURIComponent(query)}`,
  });

  if (!response.ok) {
    throw new Error(
      `Le service de recherche des mosquées est indisponible (${response.status}).`
    );
  }

  const data = (await response.json()) as OverpassResponse;

  const seen = new Set<string>();
  const mosques: Mosque[] = [];

  for (const element of data.elements) {
    const coordinates = getCoordinates(element);

    if (!coordinates) {
      continue;
    }

    const tags = element.tags ?? {};

    const name =
      tags.name?.trim() ||
      tags['name:fr']?.trim() ||
      'Mosquée sans nom';

    const key = `${element.type}-${element.id}`;

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);

    mosques.push({
      id: key,
      name,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      distanceMeters: distanceInMeters(
        coords.latitude,
        coords.longitude,
        coordinates.latitude,
        coordinates.longitude
      ),
      address: buildAddress(tags),
      openingHours: tags.opening_hours,
      serviceTimes: tags.service_times,
      website: tags.website,
    });
  }

  mosques.sort(
    (a, b) => a.distanceMeters - b.distanceMeters
  );

  return {
    mosques: mosques.slice(0, 30),
    latitude: coords.latitude,
    longitude: coords.longitude,
  };
}

export function formatDistance(distanceMeters: number) {
  if (distanceMeters < 1000) {
    return `${Math.round(distanceMeters)} m`;
  }

  return `${(distanceMeters / 1000).toFixed(1).replace('.', ',')} km`;
}

export async function openMosqueDirections(
  latitude: number,
  longitude: number
) {
  const url =
    `https://www.google.com/maps/dir/?api=1` +
    `&destination=${encodeURIComponent(`${latitude},${longitude}`)}`;

  await Linking.openURL(url);
}
