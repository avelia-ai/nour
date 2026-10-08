import AsyncStorage from '@react-native-async-storage/async-storage';

export type NourGoal =
  | 'read'
  | 'memorize'
  | 'recitation'
  | 'arabic'
  | 'understand'
  | 'everything';

export type VerseProgress = {
  surahNumber: number;
  ayahNumber: number;
  score: number;
  lastPracticedAt?: string;
  readCount: number;
  reviewCount: number;
};

export type NourProgress = {
  xp: number;
  currentStreak: number;
  bestStreak: number;
  lastActiveDate: string | null;
  goal: NourGoal | null;
  verses: VerseProgress[];
  completedMissions: string[];
};

export type NourLevel = {
  level: number;
  name: string;
  minXp: number;
  nextXp: number | null;
  progress: number;
};

export const NOUR_LEVELS = [
  { level: 1, name: 'Débutant', minXp: 0 },
  { level: 2, name: 'Apprenti', minXp: 500 },
  { level: 3, name: 'Lecteur', minXp: 1500 },
  { level: 4, name: 'Régulier', minXp: 3000 },
  { level: 5, name: 'Assidu', minXp: 5000 },
  { level: 6, name: 'Lecteur confirmé', minXp: 7500 },
  { level: 7, name: 'Étudiant du Coran', minXp: 10500 },
  { level: 8, name: 'Mémorisateur', minXp: 14000 },
  { level: 9, name: 'Maîtrise', minXp: 18000 },
  { level: 10, name: 'Maître du parcours', minXp: 22500 },
] as const;

const STORAGE_KEY = '@nour/progress';

export const XP_REWARDS = {
  read: 20,
  learnVerse: 30,
  review: 25,
  quiz: 50,
  correction: 15,
  lesson: 40,
  dailyMission: 100,
} as const;

const EMPTY_PROGRESS: NourProgress = {
  xp: 0,
  currentStreak: 0,
  bestStreak: 0,
  lastActiveDate: null,
  goal: null,
  verses: [],
  completedMissions: [],
};

export async function getNourProgress(): Promise<NourProgress> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return EMPTY_PROGRESS;
    }

    const parsed = JSON.parse(raw) as Partial<NourProgress>;

    return {
      ...EMPTY_PROGRESS,
      ...parsed,
      verses: Array.isArray(parsed.verses) ? parsed.verses : [],
      completedMissions: Array.isArray(parsed.completedMissions)
        ? parsed.completedMissions
        : [],
    };
  } catch {
    return EMPTY_PROGRESS;
  }
}

export async function saveNourProgress(
  progress: NourProgress,
): Promise<NourProgress> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  return progress;
}

export function getNourLevel(xp: number): NourLevel {
  let current: (typeof NOUR_LEVELS)[number] = NOUR_LEVELS[0];
  let next: (typeof NOUR_LEVELS)[number] | null = NOUR_LEVELS[1] ?? null;

  for (let index = 0; index < NOUR_LEVELS.length; index += 1) {
    const level = NOUR_LEVELS[index];

    if (xp >= level.minXp) {
      current = level;
      next = NOUR_LEVELS[index + 1] ?? null;
    } else {
      break;
    }
  }

  const progress = next
    ? Math.min(
        100,
        Math.round(
          ((xp - current.minXp) / (next.minXp - current.minXp)) * 100,
        ),
      )
    : 100;

  return {
    level: current.level,
    name: current.name,
    minXp: current.minXp,
    nextXp: next?.minXp ?? null,
    progress,
  };
}

export function getXpToNextLevel(xp: number): number {
  const level = getNourLevel(xp);

  if (level.nextXp === null) {
    return 0;
  }

  return Math.max(0, level.nextXp - xp);
}

function dateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getDailyMissionReward(missionId: string): number {
  const kind = missionId.split(':')[1];

  switch (kind) {
    case 'read':
      return XP_REWARDS.read;
    case 'review':
      return XP_REWARDS.review;
    case 'learn':
      return XP_REWARDS.learnVerse;
    default:
      return 0;
  }
}

function daysBetween(from: string, to: string): number {
  const first = new Date(`${from}T00:00:00`);
  const second = new Date(`${to}T00:00:00`);

  return Math.round(
    (second.getTime() - first.getTime()) / (1000 * 60 * 60 * 24),
  );
}

export function updateStreak(progress: NourProgress): NourProgress {
  const today = dateKey();

  if (progress.lastActiveDate === today) {
    return progress;
  }

  if (!progress.lastActiveDate) {
    return {
      ...progress,
      currentStreak: 1,
      bestStreak: Math.max(progress.bestStreak, 1),
      lastActiveDate: today,
    };
  }

  const difference = daysBetween(progress.lastActiveDate, today);

  if (difference === 1) {
    const currentStreak = progress.currentStreak + 1;

    return {
      ...progress,
      currentStreak,
      bestStreak: Math.max(progress.bestStreak, currentStreak),
      lastActiveDate: today,
    };
  }

  return {
    ...progress,
    currentStreak: 1,
    bestStreak: Math.max(progress.bestStreak, 1),
    lastActiveDate: today,
  };
}

export async function awardXp(
  amount: number,
): Promise<{
  progress: NourProgress;
  previousLevel: NourLevel;
  newLevel: NourLevel;
  levelUp: boolean;
}> {
  const current = await getNourProgress();
  const previousLevel = getNourLevel(current.xp);

  let next = updateStreak(current);

  next = {
    ...next,
    xp: Math.max(0, next.xp + amount),
  };

  const newLevel = getNourLevel(next.xp);

  await saveNourProgress(next);

  return {
    progress: next,
    previousLevel,
    newLevel,
    levelUp: newLevel.level > previousLevel.level,
  };
}

export async function setNourGoal(goal: NourGoal): Promise<NourProgress> {
  const progress = await getNourProgress();

  return saveNourProgress({
    ...progress,
    goal,
  });
}

export async function recordVersePractice(
  surahNumber: number,
  ayahNumber: number,
  mode: 'read' | 'review' | 'learn' = 'read',
): Promise<NourProgress> {
  const progress = updateStreak(await getNourProgress());

  const existing = progress.verses.find(
    (verse) =>
      verse.surahNumber === surahNumber &&
      verse.ayahNumber === ayahNumber,
  );

  const now = new Date().toISOString();

  const updatedVerse: VerseProgress = existing
    ? {
        ...existing,
        score: Math.min(
          100,
          existing.score +
            (mode === 'review' ? 8 : mode === 'learn' ? 5 : 2),
        ),
        lastPracticedAt: now,
        readCount: existing.readCount + 1,
        reviewCount:
          existing.reviewCount + (mode === 'review' ? 1 : 0),
      }
    : {
        surahNumber,
        ayahNumber,
        score: mode === 'learn' ? 15 : 5,
        lastPracticedAt: now,
        readCount: 1,
        reviewCount: mode === 'review' ? 1 : 0,
      };

  const verses = existing
    ? progress.verses.map((verse) =>
        verse.surahNumber === surahNumber &&
        verse.ayahNumber === ayahNumber
          ? updatedVerse
          : verse,
      )
    : [...progress.verses, updatedVerse];

  return saveNourProgress({
    ...progress,
    verses,
  });
}

export async function completeDailyMission(
  missionId: string,
): Promise<{
  progress: NourProgress;
  alreadyCompleted: boolean;
  levelUp: boolean;
}> {
  const current = await getNourProgress();

  if (current.completedMissions.includes(missionId)) {
    return {
      progress: current,
      alreadyCompleted: true,
      levelUp: false,
    };
  }

  const reward = getDailyMissionReward(missionId);

  if (reward <= 0) {
    throw new Error('Mission quotidienne invalide.');
  }

  const previousLevel = getNourLevel(current.xp);

  let next = updateStreak(current);

  next = {
    ...next,
    xp: next.xp + reward,
    completedMissions: [...next.completedMissions, missionId],
  };

  const newLevel = getNourLevel(next.xp);

  await saveNourProgress(next);

  return {
    progress: next,
    alreadyCompleted: false,
    levelUp: newLevel.level > previousLevel.level,
  };
}

export function getWeakVerses(
  progress: NourProgress,
  limit = 5,
): VerseProgress[] {
  return [...progress.verses]
    .filter((verse) => verse.score < 80)
    .sort((a, b) => a.score - b.score)
    .slice(0, limit);
}

export function getMasteredVerses(progress: NourProgress): VerseProgress[] {
  return progress.verses.filter((verse) => verse.score >= 90);
}

export function getGoalLabel(goal: NourGoal | null): string {
  switch (goal) {
    case 'read':
      return 'Lire régulièrement';
    case 'memorize':
      return 'Mémoriser le Coran';
    case 'recitation':
      return 'Améliorer ma récitation';
    case 'arabic':
      return "Apprendre l'arabe coranique";
    case 'understand':
      return 'Comprendre le Coran';
    case 'everything':
      return 'Tout apprendre';
    default:
      return 'Construire mon parcours';
  }
}
