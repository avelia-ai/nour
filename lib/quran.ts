import AsyncStorage from '@react-native-async-storage/async-storage';

export const QURAN_API = 'https://api.alquran.cloud/v1';

export const ARABIC_EDITION = 'quran-uthmani';
export const FRENCH_EDITION = 'fr.hamidullah';

export type Surah = {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
};

export type Ayah = {
  number: number;
  numberInSurah: number;
  text: string;
  juz: number;
  page: number;
};

export type SurahContent = Surah & {
  ayahs: Ayah[];
  translations: Ayah[];
};

export type ReadingPosition = {
  surahNumber: number;
  ayahNumber: number;
  savedAt: string;
};

export type VerseSearchResult = {
  number: number;
  numberInSurah: number;
  text: string;
  surah: {
    number: number;
    name: string;
    englishName: string;
    englishNameTranslation: string;
  };
};

type ApiResponse<T> = {
  code: number;
  status: string;
  data: T;
};

type EditionSurah = Surah & {
  ayahs: Ayah[];
};

const READING_KEY = '@nour/quran-reading';

async function request<T>(url: string): Promise<T> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Le serveur Coran a répondu ${response.status}.`);
  }

  const json = (await response.json()) as ApiResponse<T>;

  if (json.code !== 200 || !json.data) {
    throw new Error('Réponse invalide du service Coran.');
  }

  return json.data;
}

export async function getSurahs(): Promise<Surah[]> {
  return request<Surah[]>(`${QURAN_API}/surah`);
}

export async function getSurah(
  surahNumber: number
): Promise<SurahContent> {
  const editions = await request<EditionSurah[]>(
    `${QURAN_API}/surah/${surahNumber}/editions/${ARABIC_EDITION},${FRENCH_EDITION}`
  );

  const arabic = editions.find(
    (edition) => edition.ayahs?.[0]?.text
  );

  const french = editions.find(
    (edition) =>
      edition.ayahs?.[0]?.number === arabic?.ayahs?.[0]?.number &&
      edition.ayahs?.[0]?.text !== arabic?.ayahs?.[0]?.text
  );

  if (!arabic) {
    throw new Error('Le texte arabe de cette sourate est indisponible.');
  }

  if (!french) {
    throw new Error(
      'La traduction française de cette sourate est indisponible.'
    );
  }

  return {
    ...arabic,
    ayahs: arabic.ayahs,
    translations: french.ayahs,
  };
}

export async function searchVerses(
  query: string
): Promise<VerseSearchResult[]> {
  const value = query.trim();

  if (!value) {
    return [];
  }

  const data = await request<{
    count: number;
    matches: VerseSearchResult[];
  }>(
    `${QURAN_API}/search/${encodeURIComponent(value)}/all/fr`
  );

  return Array.isArray(data.matches) ? data.matches : [];
}

export async function getReadingPosition(): Promise<ReadingPosition | null> {
  const value = await AsyncStorage.getItem(READING_KEY);

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as ReadingPosition;
  } catch {
    return null;
  }
}

export async function saveReadingPosition(
  surahNumber: number,
  ayahNumber: number
): Promise<ReadingPosition> {
  const position: ReadingPosition = {
    surahNumber,
    ayahNumber,
    savedAt: new Date().toISOString(),
  };

  await AsyncStorage.setItem(
    READING_KEY,
    JSON.stringify(position)
  );

  return position;
}
