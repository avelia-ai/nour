import React, { useCallback, useEffect, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';

import { NourBackground } from '@/components/NourBackground';
import { TopBar } from '@/components/TopBar';
import { PremiumCard, Eyebrow, Arabic } from '@/components/PremiumCard';
import { useNour } from '../_layout';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getNourLevel,
  getNourProgress,
  type NourProgress,
} from '@/lib/nour-progress';
import {
  getDailyMissions,
  getMissionProgress,
  type DailyMission,
} from '@/lib/nour-daily-missions';
import { getReadingPosition, type ReadingPosition } from '@/lib/quran';

type ShortcutProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  caption: string;
  onPress: () => void;
  theme: ReturnType<typeof useNour>['theme'];
};

function Shortcut({
  icon,
  label,
  caption,
  onPress,
  theme,
}: ShortcutProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.shortcut,
        {
          backgroundColor: theme.card,
          borderColor: theme.line,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      <View
        style={[
          styles.shortcutIcon,
          {
            backgroundColor: theme.card2,
          },
        ]}
      >
        <Ionicons name={icon} size={19} color={theme.emerald} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={[styles.shortcutLabel, { color: theme.ink }]}>
          {label}
        </Text>
        <Text style={[styles.shortcutCaption, { color: theme.muted }]}>
          {caption}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={16} color={theme.muted} />
    </Pressable>
  );
}

function OrientalDivider({
  theme,
}: {
  theme: ReturnType<typeof useNour>['theme'];
}) {
  return (
    <View style={styles.sectionDivider}>
      <View
        style={[
          styles.sectionDividerLine,
          { backgroundColor: theme.line },
        ]}
      />

      <View
        style={[
          styles.sectionDividerOrnament,
          {
            backgroundColor: theme.card,
            borderColor: theme.line,
          },
        ]}
      >
        <Text
          style={[
            styles.sectionDividerDot,
            { color: theme.muted },
          ]}
        >
          ·
        </Text>

        <Text
          style={[
            styles.sectionDividerSymbol,
            { color: theme.gold },
          ]}
        >
          ۞
        </Text>

        <Text
          style={[
            styles.sectionDividerDot,
            { color: theme.muted },
          ]}
        >
          ·
        </Text>
      </View>

      <View
        style={[
          styles.sectionDividerLine,
          { backgroundColor: theme.line },
        ]}
      />
    </View>
  );
}

export default function Home() {
  const { theme, toggleTheme } = useNour();
  const { width } = useWindowDimensions();
  const compact = width < 390;

  const [progress, setProgress] = useState<NourProgress | null>(null);
  const [reading, setReading] = useState<ReadingPosition | null>(null);
  const [firstName, setFirstName] = useState('');

  useEffect(() => {
    let mounted = true;

    const loadHomeData = async () => {
      try {
        const [progressData, readingData, storedName] = await Promise.all([
          getNourProgress(),
          getReadingPosition(),
          AsyncStorage.getItem('@nour/profile-name'),
        ]);

        if (!mounted) return;

        setProgress(progressData);
        setReading(readingData);
        setFirstName(storedName?.trim() || '');
      } catch {
        if (!mounted) return;

        setProgress(null);
        setReading(null);
      }
    };

    loadHomeData();

    return () => {
      mounted = false;
    };
  }, []);

  const currentXp = progress?.xp ?? 0;
  const currentLevel = getNourLevel(currentXp);
  const currentStreak = progress?.currentStreak ?? 0;
  const practicedVerses = progress?.verses.length ?? 0;
  const masteredVerses =
    progress?.verses.filter((verse) => verse.score >= 90).length ?? 0;

  const xpLabel =
    currentLevel.nextXp === null
      ? `${currentXp} XP`
      : `${currentXp} / ${currentLevel.nextXp} XP`;

  const readingLabel = reading
    ? `Sourate ${reading.surahNumber} · verset ${reading.ayahNumber}`
    : 'Commencer votre première lecture';

  const missions = progress ? getDailyMissions(progress) : [];
  const missionProgress = getMissionProgress(missions);

  async function startMission(mission: DailyMission) {
    const params: Record<string, string> = {
      missionId: mission.id,
      missionKind: mission.kind,
    };

    if (mission.target) {
      params.surah = String(mission.target.surahNumber);
      params.ayah = String(mission.target.ayahNumber);
    } else if (mission.kind === 'read') {
      params.surah = String(reading?.surahNumber ?? 1);
      params.ayah = String(reading?.ayahNumber ?? 1);
    }

    router.push({
      pathname: '/quran',
      params,
    });
  }

  useFocusEffect(
    useCallback(() => {
      let active = true;

      Promise.all([
        getNourProgress(),
        getReadingPosition(),
      ]).then(([progressData, readingData]) => {
        if (!active) return;

        if (
          !progressData.goal ||
          !progressData.learningLevel ||
          !progressData.dailyMinutes
        ) {
          router.replace('/onboarding');
          return;
        }

        setProgress(progressData);
        setReading(readingData);
      }).catch((error) => {
        console.error('Impossible de charger le profil NOUR.', error);
      });

      return () => {
        active = false;
      };
    }, []),
  );

  return (
    <NourBackground theme={theme}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <TopBar
            theme={theme}
            title="NOUR"
            arabic="نور"
            onTheme={toggleTheme}
          />

          <OrientalDivider theme={theme} />

          <View style={styles.eyebrowRow}>
            <View
              style={[
                styles.liveDot,
                {
                  backgroundColor: theme.gold,
                },
              ]}
            />
            <Text style={[styles.dayLabel, { color: theme.muted }]}>
              Votre espace du jour
            </Text>
          </View>

          <View
            style={[
              styles.hero,
              {
                backgroundColor: theme.emerald,
                minHeight: compact ? 270 : 292,
              },
            ]}
          >
            <View
              pointerEvents="none"
              style={[
                styles.heroOrbLarge,
                {
                  backgroundColor: theme.goldSoft,
                },
              ]}
            />

            <View
              pointerEvents="none"
              style={[
                styles.heroOrbSmall,
                {
                  backgroundColor: theme.white,
                },
              ]}
            />

            <View style={styles.heroContent}>
              <Text style={[styles.heroArabic, { color: theme.goldSoft }]}>
                أَهْلًا وَسَهْلًا
              </Text>

              <Text style={styles.heroTitle}>Assalamu{'\n'}alaykum</Text>

              <Text style={styles.heroText}>
                Un espace pour avancer, apprendre et nourrir ce qui compte.
              </Text>

              <View style={styles.heroBottom}>
                <View>
                  <Text style={[styles.heroMeta, { color: 'rgba(255,252,246,.62)' }]}>
                    MOMENT DU JOUR
                  </Text>
                  <Text style={styles.heroMoment}>Revenir à l’essentiel</Text>
                </View>

                <Pressable
                  onPress={() => router.push('/quran')}
                  style={({ pressed }) => [
                    styles.heroAction,
                    {
                      backgroundColor: theme.goldSoft,
                      transform: [{ scale: pressed ? 0.96 : 1 }],
                    },
                  ]}
                >
                  <Ionicons
                    name="arrow-forward"
                    size={18}
                    color={theme.emerald}
                  />
                </Pressable>
              </View>
            </View>
          </View>

          <OrientalDivider theme={theme} />

          <View style={styles.introRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sectionKicker, { color: theme.gold }]}>
                AUJOURD’HUI
              </Text>
              <Text style={[styles.sectionTitle, { color: theme.ink }]}>
                Prenez un instant pour vous.
              </Text>
            </View>

            <View
              style={[
                styles.miniSeal,
                {
                  borderColor: theme.line,
                  backgroundColor: theme.card,
                },
              ]}
            >
              <Text style={[styles.miniSealStar, { color: theme.gold }]}>✦</Text>
            </View>
          </View>

          <View style={styles.shortcutGrid}>
            <Shortcut
              theme={theme}
              icon="book-outline"
              label="Coran"
              caption="Reprendre votre lecture"
              onPress={() => router.push('/quran')}
            />

            <Shortcut
              theme={theme}
              icon="time-outline"
              label="Prière"
              caption="Voir les horaires"
              onPress={() => router.push('/prayer')}
            />

            <Shortcut
              theme={theme}
              icon="location-outline"
              label="Mosquées"
              caption="Explorer autour de vous"
              onPress={() => router.push('/mosques')}
            />

            <Shortcut
              theme={theme}
              icon="person-outline"
              label="Mon espace"
              caption="Votre progression"
              onPress={() => router.push('/profile')}
            />
          </View>

          <OrientalDivider theme={theme} />

          <View style={styles.sectionHead}>
            <View>
              <Text style={[styles.sectionKicker, { color: theme.gold }]}>
                VOTRE MOMENT
              </Text>
              <Text style={[styles.sectionTitle, { color: theme.ink }]}>
                Là où vous vous êtes arrêté
              </Text>
            </View>
          </View>

          <PremiumCard
            theme={theme}
            style={[
              styles.quranCard,
              {
                backgroundColor: theme.card,
              },
            ]}
          >
            <View style={styles.quranTop}>
              <View
                style={[
                  styles.quranIcon,
                  {
                    backgroundColor: theme.emerald,
                  },
                ]}
              >
                <Ionicons name="book" size={20} color={theme.goldSoft} />
              </View>

              <View style={{ flex: 1 }}>
                <Eyebrow theme={theme}>Lecture du jour</Eyebrow>
                <Text style={[styles.quranTitle, { color: theme.ink }]}>
                  Al-Mulk
                </Text>
              </View>

              <Text style={[styles.quranPercent, { color: theme.gold }]}>
                35%
              </Text>
            </View>

            <View style={styles.quranMiddle}>
              <Arabic theme={theme}>الْمُلْكُ</Arabic>
              <Text style={[styles.quranVerse, { color: theme.muted }]}>
                Versets 1–5 · reprendre la lecture
              </Text>
            </View>

            <View style={styles.progressRow}>
              <Text style={[styles.tiny, { color: theme.muted }]}>
                Progression
              </Text>
              <Text style={[styles.tinyStrong, { color: theme.gold }]}>
                7 sur 20 versets
              </Text>
            </View>

            <View
              style={[
                styles.bar,
                {
                  backgroundColor: theme.line,
                },
              ]}
            >
              <View
                style={[
                  styles.fill,
                  {
                    backgroundColor: theme.gold,
                    width: '35%',
                  },
                ]}
              />
            </View>

            <Pressable
              onPress={() => router.push('/quran')}
              style={({ pressed }) => [
                styles.primaryButton,
                {
                  backgroundColor: theme.emerald,
                  opacity: pressed ? 0.88 : 1,
                },
              ]}
            >
              <Ionicons name="play" size={14} color={theme.white} />
              <Text style={styles.primaryButtonText}>Continuer la lecture</Text>
            </Pressable>
          </PremiumCard>

          <View style={styles.dualRow}>
            <View
              style={[
                styles.prayerCard,
                {
                  backgroundColor: theme.emerald,
                },
              ]}
            >
              <Text style={[styles.cardTiny, { color: theme.goldSoft }]}>
                PROCHAINE PRIÈRE
              </Text>

              <Text style={styles.prayerName}>Asr</Text>

              <View style={styles.prayerBottom}>
                <Text style={styles.prayerTime}>16:48</Text>
                <View style={styles.countPill}>
                  <Text style={[styles.countText, { color: theme.goldSoft }]}>
                    1 h 12
                  </Text>
                </View>
              </View>
            </View>

            <View
              style={[
                styles.streakCard,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.line,
                },
              ]}
            >
              <View
                style={[
                  styles.streakIcon,
                  {
                    backgroundColor: theme.card2,
                  },
                ]}
              >
                <Ionicons name="flame" size={17} color={theme.gold} />
              </View>

              <Text style={[styles.streakNumber, { color: theme.ink }]}>
                {currentStreak}
              </Text>
              <Text style={[styles.streakLabel, { color: theme.muted }]}>
                jours de régularité
              </Text>

              <View style={styles.streakDots}>
                {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                  <View
                    key={day}
                    style={[
                      styles.streakDot,
                      {
                        backgroundColor:
                          day < 7 ? theme.gold : theme.line,
                      },
                    ]}
                  />
                ))}
              </View>
            </View>
          </View>

          <View style={styles.sectionHead}>
            <View>
              <Text style={[styles.sectionKicker, { color: theme.gold }]}>
          <OrientalDivider theme={theme} />

                PETITE HABITUDE
              </Text>
              <Text style={[styles.sectionTitle, { color: theme.ink }]}>
                Votre intention du jour
              </Text>
            </View>
          </View>

          <PremiumCard
            theme={theme}
            style={[
              styles.goalCard,
              {
                backgroundColor: theme.card,
              },
            ]}
          >
            <View style={styles.goalHeader}>
              <View
                style={[
                  styles.goalIcon,
                  {
                    backgroundColor: theme.card2,
                  },
                ]}
              >
                <Ionicons name="moon-outline" size={19} color={theme.emerald} />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={[styles.goalTitle, { color: theme.ink }]}>
                  10 min de Coran
                </Text>
                <Text style={[styles.goalSubtitle, { color: theme.muted }]}>
                  7 / 10 min · presque atteint
                </Text>
              </View>

              <Text style={[styles.goalPercent, { color: theme.gold }]}>
                70%
              </Text>
            </View>

            <View
              style={[
                styles.bar,
                {
                  backgroundColor: theme.line,
                  marginTop: 17,
                },
              ]}
            >
              <View
                style={[
                  styles.fill,
                  {
                    backgroundColor: theme.gold,
                    width: '70%',
                  },
                ]}
              />
            </View>

            <Text style={[styles.goalQuote, { color: theme.muted }]}>
              Une petite constance vaut mieux qu’un grand effort isolé.
            </Text>
          </PremiumCard>

          <OrientalDivider theme={theme} />

          <View style={styles.sectionHead}>
            <View>
              <Text style={[styles.sectionKicker, { color: theme.gold }]}>
                VOTRE PARCOURS
              </Text>
              <Text style={[styles.sectionTitle, { color: theme.ink }]}>
                Aujourd’hui, simplement.
              </Text>
            </View>

            <Pressable
              onPress={() => router.push('/parcours')}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 7,
                paddingHorizontal: 12,
                paddingVertical: 9,
                borderRadius: 12,
                backgroundColor: theme.card2,
                borderWidth: 1,
                borderColor: theme.line,
              }}
            >
              <Text
                style={[
                  styles.tinyStrong,
                  { color: theme.gold, fontSize: 11 },
                ]}
              >
                Parcours Nour
              </Text>
              <Ionicons name="arrow-forward" size={14} color={theme.gold} />
            </Pressable>
          </View>

          <Pressable
            onPress={() => router.push('/parcours')}
            accessibilityRole="button"
            accessibilityLabel="Ouvrir mon Parcours Nour"
            style={{
              minHeight: 54,
              marginTop: 12,
              marginBottom: 12,
              paddingHorizontal: 17,
              borderRadius: 16,
              backgroundColor: theme.emerald,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11 }}>
              <Ionicons name="map-outline" size={21} color={theme.white} />
              <View>
                <Text style={{ color: theme.white, fontSize: 13, fontWeight: '900' }}>
                  Ouvrir mon Parcours Nour
                </Text>
                <Text style={{ color: theme.white, fontSize: 10, opacity: 0.8, marginTop: 2 }}>
                  Mes étapes et ma progression
                </Text>
              </View>
            </View>
            <Ionicons name="arrow-forward" size={19} color={theme.white} />
          </Pressable>

          <PremiumCard theme={theme} style={styles.programCard}>
            {missions.map((mission, i) => (
              <Pressable
                key={mission.id}
                disabled={mission.locked || mission.completed}
                onPress={() => startMission(mission)}
                style={({ pressed }) => [
                  styles.task,
                  i > 0 && {
                    borderTopWidth: 1,
                    borderTopColor: theme.line,
                  },
                  {
                    opacity: pressed ? 0.72 : 1,
                  },
                ]}
              >
                <View
                  style={[
                    styles.taskNumber,
                    {
                      backgroundColor: mission.completed
                        ? theme.emerald
                        : mission.locked
                          ? theme.card2
                          : theme.card2,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: mission.completed
                        ? theme.white
                        : theme.emerald,
                      fontSize: 11,
                      fontWeight: '800',
                    }}
                  >
                    {mission.completed
                      ? '✓'
                      : String(i + 1).padStart(2, '0')}
                  </Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={[styles.taskTitle, { color: theme.ink }]}>
                    {mission.title}
                  </Text>

                  <Text
                    style={[
                      styles.tiny,
                      {
                        color: theme.muted,
                        marginTop: 3,
                      },
                    ]}
                  >
                    {mission.completed
                      ? `${mission.duration} · +${mission.xp} XP gagné`
                      : mission.locked
                        ? `${mission.duration} · verrouillée`
                        : `${mission.description}`}
                  </Text>

                  {!mission.completed && !mission.locked ? (
                    <Text
                      style={[
                        styles.tiny,
                        {
                          color: theme.gold,
                          marginTop: 4,
                          fontWeight: '800',
                        },
                      ]}
                    >
                      +{mission.xp} XP · Commencer
                    </Text>
                  ) : null}
                </View>

                <Ionicons
                  name={
                    mission.completed
                      ? 'checkmark-circle'
                      : mission.locked
                        ? 'lock-closed-outline'
                        : 'arrow-forward-circle-outline'
                  }
                  size={21}
                  color={
                    mission.completed
                      ? theme.gold
                      : mission.locked
                        ? theme.muted
                        : theme.emerald
                  }
                />
              </Pressable>
            ))}
          </PremiumCard>

          <OrientalDivider theme={theme} />

          <View
            style={[
              styles.levelSummary,
              {
                backgroundColor: theme.card,
                borderColor: theme.line,
              },
            ]}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.sectionKicker, { color: theme.gold }]}>
                VOTRE PARCOURS
              </Text>
              <Text style={[styles.levelTitle, { color: theme.ink }]}>
                Niveau {currentLevel.level} · {currentLevel.name}
              </Text>
              <Text style={[styles.tiny, { color: theme.muted }]}>
                {xpLabel}
                {currentLevel.nextXp !== null
                  ? ` · encore ${currentLevel.nextXp - currentXp} XP`
                  : ' · niveau maximum actuel'}
              </Text>
            </View>

            <View style={styles.levelCircle}>
              <Text style={[styles.levelCircleText, { color: theme.gold }]}>
                {currentLevel.progress}%
              </Text>
            </View>
          </View>

          <OrientalDivider theme={theme} />

          <View style={styles.bottomPhrase}>
            <Text style={[styles.bottomArabic, { color: theme.gold }]}>
              نُورٌ عَلَى نُورٍ
            </Text>
            <Text style={[styles.bottomText, { color: theme.muted }]}>
              Une lumière sur une lumière.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </NourBackground>
  );
}

const styles = StyleSheet.create({
  sectionDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 32,
    paddingHorizontal: 8,
  },

  sectionDividerLine: {
    flex: 1,
    height: 1,
    opacity: 0.75,
  },

  sectionDividerOrnament: {
    minWidth: 78,
    height: 30,
    marginHorizontal: 12,
    borderWidth: 1,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingHorizontal: 8,
  },

  sectionDividerSymbol: {
    fontSize: 17,
    lineHeight: 20,
    fontWeight: '500',
  },

  sectionDividerDot: {
    fontSize: 13,
    lineHeight: 16,
    marginHorizontal: 4,
  },

  content: {
    paddingHorizontal: 18,
    paddingBottom: 124,
    maxWidth: 760,
    width: '100%',
    alignSelf: 'center',
  },

  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
    marginBottom: 10,
  },

  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 99,
  },

  dayLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.7,
  },

  hero: {
    borderRadius: 34,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 25,
  },

  heroContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 23,
    justifyContent: 'space-between',
  },

  heroArabic: {
    fontSize: 19,
    opacity: 0.95,
  },

  heroTitle: {
    color: '#FFFCF6',
    fontFamily: 'Georgia',
    fontSize: 44,
    lineHeight: 43,
    fontWeight: '500',
    letterSpacing: -1.2,
    marginTop: 25,
  },

  heroText: {
    color: 'rgba(255,252,246,.72)',
    fontSize: 14,
    lineHeight: 21,
    maxWidth: 330,
    marginTop: 14,
  },

  heroBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 28,
  },

  heroMeta: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.8,
  },

  heroMoment: {
    color: '#FFFCF6',
    fontFamily: 'Georgia',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 5,
  },

  heroAction: {
    width: 50,
    height: 50,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  heroOrbLarge: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 240,
    right: -70,
    top: -85,
    opacity: 0.11,
  },

  heroOrbSmall: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 110,
    right: 34,
    bottom: -46,
    opacity: 0.045,
  },

  introRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 14,
  },

  sectionKicker: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.7,
    marginBottom: 5,
  },

  sectionTitle: {
    fontFamily: 'Georgia',
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '700',
  },

  miniSeal: {
    width: 40,
    height: 40,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  miniSealStar: {
    fontSize: 17,
  },

  shortcutGrid: {
    gap: 10,
    marginBottom: 27,
  },

  shortcut: {
    minHeight: 68,
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    gap: 11,
    shadowColor: '#000',
    shadowOpacity: 0.045,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 1,
  },

  shortcutIcon: {
    width: 41,
    height: 41,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },

  shortcutLabel: {
    fontSize: 13,
    fontWeight: '800',
  },

  shortcutCaption: {
    fontSize: 10,
    marginTop: 2,
  },

  sectionHead: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 3,
    marginBottom: 12,
  },

  quranCard: {
    overflow: 'hidden',
  },

  quranTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  quranIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  quranTitle: {
    fontFamily: 'Georgia',
    fontSize: 28,
    fontWeight: '700',
    marginTop: 4,
  },

  quranPercent: {
    fontFamily: 'Georgia',
    fontSize: 27,
    fontWeight: '700',
  },

  quranMiddle: {
    alignItems: 'center',
    paddingVertical: 20,
  },

  quranVerse: {
    fontSize: 12,
    marginTop: 7,
  },

  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },

  tiny: {
    fontSize: 10,
  },

  tinyStrong: {
    fontSize: 10,
    fontWeight: '800',
  },

  bar: {
    height: 6,
    borderRadius: 6,
    overflow: 'hidden',
    marginTop: 8,
  },

  fill: {
    height: '100%',
    borderRadius: 6,
  },

  primaryButton: {
    height: 48,
    borderRadius: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 19,
  },

  primaryButtonText: {
    color: '#FFFCF6',
    fontSize: 12,
    fontWeight: '800',
  },

  dualRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },

  prayerCard: {
    flex: 1,
    minHeight: 154,
    padding: 18,
    borderRadius: 28,
    overflow: 'hidden',
  },

  cardTiny: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.6,
  },

  prayerName: {
    color: '#FFFCF6',
    fontFamily: 'Georgia',
    fontSize: 31,
    fontWeight: '700',
    marginTop: 18,
  },

  prayerBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },

  prayerTime: {
    color: '#FFFCF6',
    fontSize: 17,
    fontWeight: '700',
  },

  countPill: {
    borderWidth: 1,
    borderColor: 'rgba(214,189,138,.26)',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 12,
  },

  countText: {
    fontSize: 9,
    fontWeight: '800',
  },

  streakCard: {
    flex: 1,
    minHeight: 154,
    borderRadius: 28,
    borderWidth: 1,
    padding: 18,
  },

  streakIcon: {
    width: 36,
    height: 36,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },

  streakNumber: {
    fontFamily: 'Georgia',
    fontSize: 34,
    fontWeight: '700',
  },

  streakLabel: {
    fontSize: 10,
    lineHeight: 14,
    marginTop: 1,
  },

  streakDots: {
    flexDirection: 'row',
    gap: 5,
    marginTop: 15,
  },

  streakDot: {
    width: 6,
    height: 6,
    borderRadius: 10,
  },

  goalCard: {
    paddingBottom: 17,
  },

  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },

  goalIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },

  goalTitle: {
    fontFamily: 'Georgia',
    fontSize: 18,
    fontWeight: '700',
  },

  goalSubtitle: {
    fontSize: 10,
    marginTop: 3,
  },

  goalPercent: {
    fontFamily: 'Georgia',
    fontSize: 27,
    fontWeight: '700',
  },

  goalQuote: {
    fontSize: 10,
    lineHeight: 15,
    marginTop: 13,
    fontStyle: 'italic',
  },

  programCard: {
    paddingVertical: 6,
  },

  task: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingVertical: 13,
  },

  taskNumber: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  taskTitle: {
    fontSize: 12,
    fontWeight: '800',
  },

  levelSummary: {
    marginTop: 14,
    borderWidth: 1,
    borderRadius: 22,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  levelTitle: {
    fontFamily: 'Georgia',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 5,
  },
  levelCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  levelCircleText: {
    fontFamily: 'Georgia',
    fontSize: 15,
    fontWeight: '700',
  },
  bottomPhrase: {
    alignItems: 'center',
    paddingTop: 28,
    paddingBottom: 12,
  },

  bottomArabic: {
    fontSize: 20,
    opacity: 0.9,
  },

  bottomText: {
    fontFamily: 'Georgia',
    fontSize: 13,
    marginTop: 6,
  },
});
