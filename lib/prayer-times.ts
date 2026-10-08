import * as Location from 'expo-location';
import {
  CalculationMethod,
  Coordinates,
  Madhab,
  PrayerTimes,
  Qibla,
} from 'adhan';

export type PrayerKey =
  | 'fajr'
  | 'dhuhr'
  | 'asr'
  | 'maghrib'
  | 'isha';

export type PrayerItem = {
  key: PrayerKey;
  name: string;
  time: Date;
  status: 'past' | 'next' | 'upcoming';
};

export type PrayerSnapshot = {
  prayers: PrayerItem[];
  nextPrayer: PrayerItem;
  remainingMs: number;
  qibla: number;
  latitude: number;
  longitude: number;
  timezone: string;
};

const PRAYERS: {
  key: PrayerKey;
  name: string;
  get: (times: PrayerTimes) => Date;
}[] = [
  { key: 'fajr', name: 'Fajr', get: (t) => t.fajr },
  { key: 'dhuhr', name: 'Dhuhr', get: (t) => t.dhuhr },
  { key: 'asr', name: 'Asr', get: (t) => t.asr },
  { key: 'maghrib', name: 'Maghrib', get: (t) => t.maghrib },
  { key: 'isha', name: 'Isha', get: (t) => t.isha },
];

export async function requestCurrentCoordinates() {
  const permission = await Location.requestForegroundPermissionsAsync();

  if (!permission.granted) {
    throw new Error(
      'La localisation est nécessaire pour calculer vos horaires de prière.'
    );
  }

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  return position.coords;
}

function buildPrayerTimes(
  latitude: number,
  longitude: number,
  date: Date
) {
  const coordinates = new Coordinates(latitude, longitude);
  const params = CalculationMethod.MuslimWorldLeague();
  params.madhab = Madhab.Shafi;

  return new PrayerTimes(coordinates, date, params);
}

export function formatPrayerTime(
  value: Date,
  timezone: string
) {
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: timezone,
  }).format(value);
}

export function formatRemaining(milliseconds: number) {
  const totalMinutes = Math.max(
    0,
    Math.floor(milliseconds / 60000)
  );

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return `${hours} h ${String(minutes).padStart(2, '0')}`;
  }

  return `${minutes} min`;
}

export function calculatePrayerSnapshot(
  latitude: number,
  longitude: number,
  now = new Date()
): PrayerSnapshot {
  const timezone =
    Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Paris';

  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  const todayTimes = buildPrayerTimes(latitude, longitude, today);
  const coordinates = new Coordinates(latitude, longitude);

  const prayerItems = PRAYERS.map((prayer) => ({
    key: prayer.key,
    name: prayer.name,
    time: prayer.get(todayTimes),
    status: 'upcoming' as PrayerItem['status'],
  }));

  let nextPrayer = prayerItems.find(
    (prayer) => prayer.time.getTime() > now.getTime()
  );

  if (!nextPrayer) {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const tomorrowTimes = buildPrayerTimes(
      latitude,
      longitude,
      tomorrow
    );

    nextPrayer = {
      key: 'fajr',
      name: 'Fajr',
      time: tomorrowTimes.fajr,
      status: 'next',
    };
  }

  const prayers: PrayerItem[] = prayerItems.map((prayer) => ({
    ...prayer,
    status:
      prayer.key === nextPrayer!.key &&
      prayer.time.getTime() === nextPrayer!.time.getTime()
        ? 'next'
        : prayer.time.getTime() < now.getTime()
          ? 'past'
          : 'upcoming',
  }));

  return {
    prayers,
    nextPrayer,
    remainingMs: nextPrayer.time.getTime() - now.getTime(),
    qibla: Math.round(Qibla(coordinates)),
    latitude,
    longitude,
    timezone,
  };
}
