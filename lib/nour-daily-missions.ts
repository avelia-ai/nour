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
  return [...progress.verses]
    .filter((verse) => verse.score < 90)
    .sort((a, b) => a.score - b.score)[0];
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
        : 'Commencer une révision',
      description: weakVerse
        ? `Renforce un verset encore fragile · maîtrise actuelle ${weakVerse.score} %.`
        : 'Commence à construire ta mémoire en relisant attentivement un verset.',
      duration: '4 min',
      xp: XP_REWARDS.review,
      locked: false,
      completed: progress.completedMissions.includes(id),
      target: weakVerse
        ? {
            surahNumber: weakVerse.surahNumber,
            ayahNumber: weakVerse.ayahNumber,
          }
        : undefined,
    };
  }

  if (kind === 'learn') {
    return {
      id,
      kind,
      title: nextVerse
        ? `Approfondir le verset ${nextVerse.ayahNumber + 1}`
        : 'Apprendre ton premier verset',
      description:
        'Lis, écoute et répète un nouveau verset avec attention.',
      duration: '6 min',
      xp: XP_REWARDS.learnVerse,
      locked,
      completed: progress.completedMissions.includes(id),
      target: nextVerse
        ? {
            surahNumber: nextVerse.surahNumber,
            ayahNumber: nextVerse.ayahNumber + 1,
          }
        : undefined,
    };
  }

  return {
    id,
    kind,
    title: 'Lire dans le Coran',
    description:
      'Prends quelques minutes pour poursuivre ta lecture là où tu t’es arrêté.',
    duration: '5 min',
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

  return order.map((kind, index) => {
    if (index === 0) {
      return buildMission(
        dateKey,
        kind,
        index,
        progress,
        false,
      );
    }

    const previousMissionId =
      `${dateKey}:${order[index - 1]}:${index - 1}`;

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
