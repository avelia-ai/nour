import React, { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { NourBackground } from '@/components/NourBackground';
import { PremiumCard } from '@/components/PremiumCard';
import { useNour } from './_layout';

import {
  getNourLevel,
  getNourProgress,
  type NourProgress,
} from '@/lib/nour-progress';

type PathNode = {
  title: string;
  subtitle: string;
  minXp: number;
  icon: keyof typeof Ionicons.glyphMap;
};

const PATH_BY_GOAL: Record<
  'read' | 'memorize' | 'recitation' | 'arabic' | 'understand' | 'everything',
  PathNode[]
> = {
  read: [
    { title: 'Fondations', subtitle: 'Installer une routine simple avec le Coran', minXp: 0, icon: 'home-outline' },
    { title: 'Lecture', subtitle: 'Lire avec plus de fluidité et de régularité', minXp: 500, icon: 'book-outline' },
    { title: 'Fluidité', subtitle: 'Renforcer la continuité et le rythme de lecture', minXp: 1500, icon: 'swap-horizontal-outline' },
    { title: 'Petites sourates', subtitle: 'Découvrir et lire régulièrement les courtes sourates', minXp: 3000, icon: 'bookmark-outline' },
    { title: 'Régularité', subtitle: 'Construire une habitude durable', minXp: 5000, icon: 'calendar-outline' },
    { title: 'Maîtrise de lecture', subtitle: 'Lire avec confiance et constance', minXp: 7500, icon: 'star-outline' },
  ],
  memorize: [
    { title: 'Premiers versets', subtitle: 'Commencer à ancrer de courts passages', minXp: 0, icon: 'bookmark-outline' },
    { title: 'Premières sourates', subtitle: 'Construire les premières mémorisations', minXp: 500, icon: 'book-outline' },
    { title: 'Mémorisation', subtitle: 'Ajouter de nouveaux versets progressivement', minXp: 1500, icon: 'layers-outline' },
    { title: 'Révision', subtitle: 'Renforcer les versets déjà appris', minXp: 3000, icon: 'refresh-outline' },
    { title: 'Consolidation', subtitle: 'Stabiliser les sourates dans la mémoire', minXp: 5000, icon: 'shield-checkmark-outline' },
    { title: 'Hifz', subtitle: 'Avancer vers une mémorisation durable', minXp: 7500, icon: 'trophy-outline' },
  ],
  recitation: [
    { title: 'Lecture', subtitle: 'Poser une base de lecture stable', minXp: 0, icon: 'book-outline' },
    { title: 'Premiers tajwid', subtitle: 'Découvrir les règles essentielles', minXp: 500, icon: 'mic-outline' },
    { title: 'Articulation', subtitle: 'Améliorer la précision de la récitation', minXp: 1500, icon: 'volume-high-outline' },
    { title: 'Règles avancées', subtitle: 'Approfondir les règles de tajwid', minXp: 3000, icon: 'school-outline' },
    { title: 'Récitation', subtitle: 'Mettre les règles en pratique', minXp: 5000, icon: 'radio-outline' },
    { title: 'Maîtrise', subtitle: 'Réciter avec précision et confiance', minXp: 7500, icon: 'star-outline' },
  ],
  arabic: [
    { title: 'Alphabet', subtitle: 'Reconnaître et lire les lettres arabes', minXp: 0, icon: 'school-outline' },
    { title: 'Harakat', subtitle: 'Comprendre les voyelles courtes', minXp: 500, icon: 'create-outline' },
    { title: 'Assemblage', subtitle: 'Lire les lettres dans les mots', minXp: 1500, icon: 'construct-outline' },
    { title: 'Premiers mots', subtitle: 'Reconnaître le vocabulaire coranique fréquent', minXp: 3000, icon: 'text-outline' },
    { title: 'Lecture coranique', subtitle: 'Lire des passages avec plus d’autonomie', minXp: 5000, icon: 'book-outline' },
    { title: 'Compréhension', subtitle: 'Relier les mots au sens des versets', minXp: 7500, icon: 'bulb-outline' },
  ],
  understand: [
    { title: 'Lecture', subtitle: 'Lire attentivement et prendre le temps', minXp: 0, icon: 'book-outline' },
    { title: 'Vocabulaire', subtitle: 'Comprendre les mots coraniques essentiels', minXp: 500, icon: 'text-outline' },
    { title: 'Contexte', subtitle: 'Relier les passages à leur contexte', minXp: 1500, icon: 'information-circle-outline' },
    { title: 'Compréhension', subtitle: 'Identifier le sens principal des versets', minXp: 3000, icon: 'bulb-outline' },
    { title: 'Réflexion', subtitle: 'Approfondir ce que tu lis', minXp: 5000, icon: 'chatbubble-ellipses-outline' },
    { title: 'Maîtrise', subtitle: 'Lire avec une compréhension plus profonde', minXp: 7500, icon: 'star-outline' },
  ],
  everything: [
    { title: 'Fondations', subtitle: 'Construire des bases solides', minXp: 0, icon: 'school-outline' },
    { title: 'Lecture', subtitle: 'Développer une lecture régulière', minXp: 500, icon: 'book-outline' },
    { title: 'Tajwid', subtitle: 'Améliorer la qualité de récitation', minXp: 1500, icon: 'mic-outline' },
    { title: 'Compréhension', subtitle: 'Donner du sens à ce que tu récites', minXp: 3000, icon: 'bulb-outline' },
    { title: 'Mémorisation', subtitle: 'Ancrer progressivement les versets', minXp: 5000, icon: 'bookmark-outline' },
    { title: 'Révision', subtitle: 'Consolider les acquis', minXp: 7500, icon: 'refresh-outline' },
    { title: 'Juz Amma', subtitle: 'Construire une maîtrise plus large', minXp: 10500, icon: 'moon-outline' },
    { title: 'Hifz', subtitle: 'Avancer vers une mémorisation solide', minXp: 14000, icon: 'trophy-outline' },
    { title: 'Maîtrise', subtitle: 'Unifier lecture, mémoire et compréhension', minXp: 18000, icon: 'star-outline' },
    { title: 'Maître du parcours', subtitle: 'Un parcours construit dans la durée', minXp: 22500, icon: 'ribbon-outline' },
  ],
};

export default function Parcours() {

  const { theme } = useNour();
  const [progress, setProgress] = useState<NourProgress | null>(null);

  useEffect(() => {
    getNourProgress().then(setProgress).catch(() => setProgress(null));
  }, []);

  const xp = progress?.xp ?? 0;
  const level = getNourLevel(xp);
  const goal = progress?.goal ?? 'everything';
  const PATH = PATH_BY_GOAL[goal];

  const startingIndex =
    progress?.learningLevel === 'advanced'
      ? Math.min(2, PATH.length - 1)
      : progress?.learningLevel === 'intermediate'
        ? Math.min(1, PATH.length - 1)
        : 0;

  const xpIndex = Math.max(
    0,
    PATH.findIndex((node, index) => {
      const next = PATH[index + 1];
      return xp >= node.minXp && (!next || xp < next.minXp);
    }),
  );

  const currentIndex = Math.max(startingIndex, xpIndex);
  const current = PATH[currentIndex];
  const next = PATH[currentIndex + 1] ?? null;

  const trackedVerses = progress?.verses ?? [];

  const dueVerseCount = trackedVerses.filter((verse) => {
    if (!verse.nextReviewAt) return true;

    const timestamp = Date.parse(verse.nextReviewAt);
    return !Number.isFinite(timestamp) || timestamp <= Date.now();
  }).length;

  const averageVerseScore =
    trackedVerses.length > 0
      ? Math.round(
          trackedVerses.reduce((total, verse) => total + verse.score, 0) /
            trackedVerses.length,
        )
      : null;

  const isReviewDue = (verse: (typeof trackedVerses)[number]) => {
    if (!verse.nextReviewAt) return true;

    const dueAt = Date.parse(verse.nextReviewAt);
    return !Number.isFinite(dueAt) || dueAt <= Date.now();
  };

  const reviewHistory = [...trackedVerses]
    .sort((a, b) => {
      const aDue = isReviewDue(a);
      const bDue = isReviewDue(b);

      if (aDue !== bDue) return aDue ? -1 : 1;
      if (aDue && bDue) return a.score - b.score;

      return (
        Date.parse(a.nextReviewAt ?? '9999-12-31') -
        Date.parse(b.nextReviewAt ?? '9999-12-31')
      );
    })
    .slice(0, 8);


  const currentProgress = next
    ? Math.max(
        0,
        Math.min(
          100,
          Math.round(
            ((xp - current.minXp) /
              Math.max(1, next.minXp - current.minXp)) *
              100,
          ),
        ),
      )
    : 100;

  return (
    <NourBackground theme={theme}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Pressable
            onPress={() => router.back()}
            style={styles.back}
            accessibilityRole="button"
            accessibilityLabel="Retour"
          >
            <Ionicons name="chevron-back" size={21} color={theme.ink} />
            <Text style={[styles.backText, { color: theme.ink }]}>
              Retour
            </Text>
          </Pressable>

          <Text style={[styles.eyebrow, { color: theme.gold }]}>
            PARCOURS NOUR
          </Text>

          <Text style={[styles.title, { color: theme.ink }]}>
            Ta route, étape après étape.
          </Text>

          <Text style={[styles.subtitle, { color: theme.muted }]}>
            Nour transforme ta régularité en progression visible.
          </Text>

          <Pressable
            onPress={() => router.push('/onboarding')}
            style={styles.editProfile}
          >
            <Ionicons name="person-outline" size={15} color={theme.gold} />
            <Text style={[styles.editProfileText, { color: theme.gold }]}>
              Modifier mon profil d’apprentissage
            </Text>
          </Pressable>

          <PremiumCard theme={theme} style={styles.hero}>
            <View style={styles.heroTop}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.heroKicker, { color: theme.gold }]}>
                  TON NIVEAU
                </Text>
                <Text style={[styles.heroTitle, { color: theme.ink }]}>
                  {level.name}
                </Text>
                <Text style={[styles.heroMeta, { color: theme.muted }]}>
                  Niveau {level.level} · {xp} XP
                </Text>
              </View>

              <View
                style={[
                  styles.levelBadge,
                  { backgroundColor: theme.card2, borderColor: theme.line },
                ]}
              >
                <Text style={[styles.levelNumber, { color: theme.gold }]}>
                  {level.level}
                </Text>
              </View>
            </View>

            {next ? (
              <>
                <View
                  style={[
                    styles.progressTrack,
                    { backgroundColor: theme.line },
                  ]}
                >
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${currentProgress}%`,
                        backgroundColor: theme.gold,
                      },
                    ]}
                  />
                </View>

                <Text style={[styles.nextText, { color: theme.muted }]}>
                  Prochaine étape : <Text style={{ color: theme.ink, fontWeight: '800' }}>{next.title}</Text>
                </Text>
              </>
            ) : (
              <Text style={[styles.nextText, { color: theme.gold }]}>
                Parcours actuel au niveau maximum.
              </Text>
            )}
          </PremiumCard>

          <PremiumCard theme={theme} style={styles.memoryCard}>
            <View style={styles.memoryHeader}>
              <Ionicons name="time-outline" size={17} color={theme.gold} />
              <Text style={[styles.memoryKicker, { color: theme.gold }]}>
                MÉMOIRE DES VERSETS
              </Text>
            </View>

            <View style={styles.memoryMetrics}>
              <View style={styles.memoryMetric}>
                <Text style={[styles.memoryValue, { color: theme.ink }]}>
                  {dueVerseCount}
                </Text>
                <Text style={[styles.memoryLabel, { color: theme.muted }]}>
                  À revoir
                </Text>
              </View>

              <View style={[styles.memorySeparator, { backgroundColor: theme.line }]} />

              <View style={styles.memoryMetric}>
                <Text style={[styles.memoryValue, { color: theme.ink }]}>
                  {trackedVerses.length}
                </Text>
                <Text style={[styles.memoryLabel, { color: theme.muted }]}>
                  Versets suivis
                </Text>
              </View>

              <View style={[styles.memorySeparator, { backgroundColor: theme.line }]} />

              <View style={styles.memoryMetric}>
                <Text style={[styles.memoryValue, { color: theme.ink }]}>
                  {averageVerseScore === null ? '—' : `${averageVerseScore}%`}
                </Text>
                <Text style={[styles.memoryLabel, { color: theme.muted }]}>
                  Score de suivi
                </Text>
              </View>
            </View>

            <Text style={[styles.memoryFootnote, { color: theme.muted }]}>
              {trackedVerses.length === 0
                ? 'Tes premières pratiques permettront à Nour de commencer le suivi de tes versets.'
                : 'Les révisions sont planifiées selon le score de suivi et la date de dernière pratique. Ce score ne mesure pas encore une récitation vérifiée.'}
            </Text>
          </PremiumCard>

          <Text style={[styles.sectionTitle, { color: theme.ink }]}>
            HISTORIQUE DES VERSETS
          </Text>

          {reviewHistory.length === 0 ? (
            <PremiumCard theme={theme} style={styles.historyEmptyCard}>
              <Text style={[styles.historyVerse, { color: theme.ink }]}>
                Ton historique commence ici.
              </Text>
              <Text style={[styles.historyMeta, { color: theme.muted }]}>
                Après tes premières pratiques, Nour affichera ici les versets
                suivis et leurs prochaines dates de révision.
              </Text>
            </PremiumCard>
          ) : (
            <PremiumCard theme={theme} style={styles.historyCard}>
              {reviewHistory.map((verse, index) => {
                const due = isReviewDue(verse);
                const dueAt = verse.nextReviewAt
                  ? Date.parse(verse.nextReviewAt)
                  : NaN;

                const dateLabel =
                  due || !Number.isFinite(dueAt)
                    ? 'À réviser maintenant'
                    : `Prochaine révision · ${new Date(dueAt).toLocaleDateString(
                        'fr-FR',
                        { day: 'numeric', month: 'short' },
                      )}`;

                return (
                  <Pressable
                    key={`${verse.surahNumber}:${verse.ayahNumber}`}
                    onPress={() =>
                      router.push({
                        pathname: '/quran',
                        params: {
                          surah: String(verse.surahNumber),
                          ayah: String(verse.ayahNumber),
                        },
                      })
                    }
                    accessibilityRole="button"
                    accessibilityLabel={`Ouvrir le verset ${verse.ayahNumber} de la sourate ${verse.surahNumber}`}
                    style={({ pressed }) => [
                      styles.historyRow,
                      index > 0 && {
                        borderTopWidth: 1,
                        borderTopColor: theme.line,
                      },
                      { opacity: pressed ? 0.65 : 1 },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.historyVerse, { color: theme.ink }]}>
                        Sourate {verse.surahNumber} · verset {verse.ayahNumber}
                      </Text>
                      <Text style={[styles.historyMeta, { color: theme.muted }]}>
                        Suivi : {verse.score}% · {verse.reviewCount} révision(s)
                      </Text>
                    </View>

                    <Text
                      style={[
                        styles.historyStatus,
                        { color: due ? theme.gold : theme.muted },
                      ]}
                    >
                      {dateLabel}
                    </Text>
                  </Pressable>
                );
              })}
            </PremiumCard>
          )}

          <Text style={[styles.sectionTitle, { color: theme.ink }]}>
            TON CHEMIN
          </Text>

          <View style={styles.path}>
            {PATH.map((node, index) => {
              const completed = index < xpIndex;
              const skippedAtStart =
                index < startingIndex && !completed;
              const unlocked =
                xp >= node.minXp || index <= startingIndex;
              const active = index === currentIndex;
              const isLast = index === PATH.length - 1;

              return (
                <View key={node.title} style={styles.nodeRow}>
                  <View style={styles.timeline}>
                    <View
                      style={[
                        styles.node,
                        {
                          backgroundColor:
                            completed || active
                              ? theme.emerald
                              : theme.card2,
                          borderColor:
                            active || completed
                              ? theme.emerald
                              : theme.line,
                        },
                      ]}
                    >
                      <Ionicons
                        name={node.icon}
                        size={20}
                        color={
                          completed || active ? theme.white : theme.muted
                        }
                      />
                    </View>

                    {!isLast ? (
                      <View
                        style={[
                          styles.connector,
                          {
                            backgroundColor:
                              index < currentIndex
                                ? theme.emerald
                                : theme.line,
                          },
                        ]}
                      />
                    ) : null}
                  </View>

                  <PremiumCard
                    theme={theme}
                    style={[
                      styles.nodeCard,
                      active && {
                        borderColor: theme.gold,
                        borderWidth: 1,
                      },
                    ]}
                  >
                    <View style={styles.nodeHeader}>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.nodeTitle,
                            {
                              color: unlocked ? theme.ink : theme.muted,
                            },
                          ]}
                        >
                          {node.title}
                        </Text>
                        <Text
                          style={[styles.nodeSubtitle, { color: theme.muted }]}
                        >
                          {node.subtitle}
                        </Text>
                      </View>

                      <Text
                        style={[
                          styles.nodeStatus,
                          {
                            color: completed
                              ? theme.emerald
                              : active
                                ? theme.gold
                                : theme.muted,
                          },
                        ]}
                      >
                        {completed
                          ? 'ACCOMPLI'
                          : skippedAtStart
                            ? 'BASES PASSÉES'
                            : active
                              ? 'ICI'
                              : `${node.minXp} XP`}
                      </Text>
                    </View>

                    {active && next ? (
                      <Pressable
                        onPress={() => router.push('/quran')}
                        style={[
                          styles.cta,
                          { backgroundColor: theme.emerald },
                        ]}
                      >
                        <Text style={[styles.ctaText, { color: theme.white }]}>
                          Continuer mon parcours
                        </Text>
                        <Ionicons
                          name="arrow-forward"
                          size={17}
                          color={theme.white}
                        />
                      </Pressable>
                    ) : null}
                  </PremiumCard>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>
    </NourBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 120,
  },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 28,
  },
  backText: {
    fontSize: 13,
    fontWeight: '800',
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.8,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '900',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    maxWidth: 340,
  },
  editProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
  },
  editProfileText: {
    fontSize: 11,
    fontWeight: '800',
  },
  memoryCard: {
    marginTop: 18,
    padding: 16,
  },
  memoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  memoryKicker: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.3,
  },
  memoryMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
  },
  memoryMetric: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  memoryValue: {
    fontSize: 21,
    fontWeight: '900',
  },
  memoryLabel: {
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
  memorySeparator: {
    width: 1,
    height: 34,
  },
  memoryFootnote: {
    marginTop: 15,
    fontSize: 11,
    lineHeight: 17,
  },
  historyCard: {
    paddingHorizontal: 14,
    paddingVertical: 2,
  },
  historyEmptyCard: {
    padding: 15,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },
  historyVerse: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '900',
  },
  historyMeta: {
    marginTop: 4,
    fontSize: 10,
    lineHeight: 15,
  },
  historyStatus: {
    maxWidth: 125,
    fontSize: 10,
    lineHeight: 15,
    fontWeight: '800',
    textAlign: 'right',
  },
  hero: {
    marginTop: 22,
    padding: 18,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroKicker: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  heroTitle: {
    marginTop: 4,
    fontSize: 23,
    fontWeight: '900',
  },
  heroMeta: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '700',
  },
  levelBadge: {
    width: 58,
    height: 58,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelNumber: {
    fontSize: 24,
    fontWeight: '900',
  },
  progressTrack: {
    height: 8,
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 19,
  },
  progressFill: {
    height: '100%',
    borderRadius: 8,
  },
  nextText: {
    marginTop: 11,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
  },
  sectionTitle: {
    marginTop: 28,
    marginBottom: 14,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  path: {
    gap: 0,
  },
  nodeRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    minHeight: 116,
  },
  timeline: {
    width: 48,
    alignItems: 'center',
  },
  node: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connector: {
    width: 2,
    flex: 1,
    minHeight: 44,
    marginVertical: 5,
  },
  nodeCard: {
    flex: 1,
    padding: 15,
    marginBottom: 12,
  },
  nodeHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  nodeTitle: {
    fontSize: 16,
    fontWeight: '900',
  },
  nodeSubtitle: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 17,
  },
  nodeStatus: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  cta: {
    minHeight: 44,
    borderRadius: 13,
    marginTop: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ctaText: {
    fontSize: 12,
    fontWeight: '900',
  },
});
