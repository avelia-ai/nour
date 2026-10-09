import {
  type NourProgress,
  XP_REWARDS,
} from './nour-progress';

export type DailyMissionKind = 'review' | 'learn' | 'read';

export type DailyMission = {
  id: string;
  kind: DailyMissionKind;
  title: string;
  description: string;
  duration: string;
  xp: number;
  locked: boolean;
  completed: boolean;
  target?: {
    surahNumber: number;
    ayahNumber: number;
  };
};

function todayKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getWeakestVerse(progress: NourProgress) {
  const now = Date.now();

  return [...progress.verses]
    .filter((verse) => {
      if (!verse.nextReviewAt) return true;

      const dueAt = Date.parse(verse.nextReviewAt);
      return !Number.isFinite(dueAt) || dueAt <= now;
    })
    .sort((a, b) => {
      if (a.score !== b.score) {
        return a.score - b.score;
      }

      const aDate = a.nextReviewAt
        ? Date.parse(a.nextReviewAt)
        : Number.NEGATIVE_INFINITY;

      const bDate = b.nextReviewAt
        ? Date.parse(b.nextReviewAt)
        : Number.NEGATIVE_INFINITY;

      return aDate - bDate;
    })[0];
}
function getNextVerse(progress: NourProgress) {
  if (progress.verses.length === 0) {
    return null;
  }

  return [...progress.verses]
    .sort((a, b) => {
      if (a.surahNumber !== b.surahNumber) {
        return a.surahNumber - b.surahNumber;
      }

      return a.ayahNumber - b.ayahNumber;
    })
    .at(-1);
}

function buildMission(
  date: string,
  kind: DailyMissionKind,
  index: number,
  progress: NourProgress,
  locked: boolean,
): DailyMission {
  const id = `${date}:${kind}:${index}`;

  const weakVerse = getWeakestVerse(progress);
  const nextVerse = getNextVerse(progress);

  if (kind === 'review') {
    return {
      id,
      kind,
      title: weakVerse
        ? `Réviser le verset ${weakVerse.ayahNumber}`
        : 'Révision guidée du premier verset',
      description: weakVerse
        ? `Renforce un verset encore fragile · maîtrise actuelle ${weakVerse.score} %.`
        : 'Commence par une révision guidée du verset de départ.',
      duration:
        progress.dailyMinutes && progress.dailyMinutes <= 5
          ? '3 min'
          : '4 min',
      xp: XP_REWARDS.review,
      locked: false,
      completed: progress.completedMissions.includes(id),
      target: weakVerse
        ? {
            surahNumber: weakVerse.surahNumber,
            ayahNumber: weakVerse.ayahNumber,
          }
        : {
            surahNumber: 1,
            ayahNumber: 1,
          },
    };
  }

  if (kind === 'learn') {
    const target = nextVerse
      ? {
          surahNumber: nextVerse.surahNumber,
          ayahNumber: nextVerse.ayahNumber + 1,
        }
      : {
          surahNumber: 1,
          ayahNumber: 1,
        };

    return {
      id,
      kind,
      title: nextVerse
        ? `Approfondir le verset ${nextVerse.ayahNumber + 1}`
        : 'Apprendre ton premier verset',
      description:
        progress.learningLevel === 'advanced'
          ? 'Approfondis un nouveau verset avec attention.'
          : progress.learningLevel === 'intermediate'
            ? 'Travaille un nouveau verset et consolide ta lecture.'
            : 'Découvre un premier verset avec une progression guidée.',
      duration:
        progress.dailyMinutes && progress.dailyMinutes <= 5
          ? '5 min'
          : progress.dailyMinutes && progress.dailyMinutes >= 20
            ? '8 min'
            : '6 min',
      xp: XP_REWARDS.learnVerse,
      locked,
      completed: progress.completedMissions.includes(id),
      target,
    };
  }

  const readTitle =
    progress.goal === 'understand'
      ? 'Lire pour comprendre'
      : progress.goal === 'memorize'
        ? 'Lire et consolider'
        : progress.goal === 'recitation'
          ? 'Lire avec attention'
          : progress.goal === 'arabic'
            ? 'Explorer les mots coraniques'
            : 'Poursuivre la lecture';

  const readDescription =
    progress.learningLevel === 'beginner'
      ? 'Avance tranquillement, verset par verset, pour construire une habitude solide.'
      : progress.learningLevel === 'intermediate'
        ? 'Poursuis ta lecture à un rythme confortable et régulier.'
        : progress.goal === 'understand'
          ? 'Lis attentivement et concentre-toi sur le sens de la traduction.'
          : 'Entretiens ta fluidité tout en restant attentif au texte.';

  const dailyMinutes = progress.dailyMinutes ?? 10;
  const readDuration =
    dailyMinutes <= 5
      ? '2 min'
      : dailyMinutes <= 10
        ? '3 min'
        : dailyMinutes <= 20
          ? '6 min'
          : '8 min';

  return {
    id,
    kind,
    title: readTitle,
    description: readDescription,
    duration: readDuration,
    xp: XP_REWARDS.read,
    locked,
    completed: progress.completedMissions.includes(id),
  };
}

export function getDailyMissions(
  progress: NourProgress,
  date = new Date(),
): DailyMission[] {
  const dateKey = todayKey(date);

  let order: DailyMissionKind[];

  switch (progress.goal) {
    case 'memorize':
      order = ['review', 'learn', 'read'];
      break;

    case 'recitation':
      order = ['review', 'read', 'learn'];
      break;

    case 'understand':
      order = ['read', 'learn', 'review'];
      break;

    case 'arabic':
      order = ['learn', 'read', 'review'];
      break;

    case 'everything':
      order = ['review', 'learn', 'read'];
      break;

    case 'read':
    default:
      order = ['read', 'review', 'learn'];
      break;
  }

  const scheduledMissions = order
    .map((kind, index) => ({ kind, index }))
    .filter(
      ({ kind }) =>
        kind !== 'review' || Boolean(getWeakestVerse(progress)),
    );

  return scheduledMissions.map(({ kind, index }, displayIndex) => {
    if (displayIndex === 0) {
      return buildMission(
        dateKey,
        kind,
        index,
        progress,
        false,
      );
    }

    const previous = scheduledMissions[displayIndex - 1];
    const previousMissionId =
      `${dateKey}:${previous.kind}:${previous.index}`;

    const locked =
      !progress.completedMissions.includes(previousMissionId);

    return buildMission(
      dateKey,
      kind,
      index,
      progress,
      locked,
    );
  });
}

export function getMissionProgress(missions: DailyMission[]) {
  const completed = missions.filter((mission) => mission.completed).length;

  return {
    completed,
    total: missions.length,
    percentage:
      missions.length === 0
        ? 0
        : Math.round((completed / missions.length) * 100),
  };
}

export function getNextAvailableMission(missions: DailyMission[]) {
  return missions.find((mission) => !mission.completed && !mission.locked) ?? null;
}
