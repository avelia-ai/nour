import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';

import { NourBackground } from '@/components/NourBackground';
import { TopBar } from '@/components/TopBar';
import { PremiumCard, Eyebrow } from '@/components/PremiumCard';
import { useNour } from '../_layout';

import {
  getReadingPosition,
  getSurah,
  getSurahs,
  searchVerses,
  saveReadingPosition,
  type Ayah,
  type ReadingPosition,
  type Surah,
  type SurahContent,
  type VerseSearchResult,
} from '@/lib/quran';

import {
  completeDailyMission,
  getNourProgress,
  recordVersePractice,
} from '@/lib/nour-progress';

export default function Quran() {
  const { theme, toggleTheme } = useNour();

  const {
    missionId: rawMissionId,
    missionKind: rawMissionKind,
    surah: rawMissionSurah,
    ayah: rawMissionAyah,
  } = useLocalSearchParams<{
    missionId?: string;
    missionKind?: string;
    surah?: string;
    ayah?: string;
  }>();

  const missionId =
    typeof rawMissionId === 'string'
      ? rawMissionId
      : rawMissionId?.[0] ?? '';

  const missionKind =
    typeof rawMissionKind === 'string'
      ? rawMissionKind
      : rawMissionKind?.[0] ?? '';

  const missionSurah =
    typeof rawMissionSurah === 'string'
      ? rawMissionSurah
      : rawMissionSurah?.[0] ?? '';

  const missionAyah =
    typeof rawMissionAyah === 'string'
      ? rawMissionAyah
      : rawMissionAyah?.[0] ?? '';

  const missionSurahNumber = Number(missionSurah);
  const missionAyahNumber = Number(missionAyah);

  const [missionReady, setMissionReady] = useState(false);
  const [missionSubmitting, setMissionSubmitting] = useState(false);
  const [missionCompleted, setMissionCompleted] = useState(false);

  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [selected, setSelected] = useState<SurahContent | null>(null);
  const [reading, setReading] = useState<ReadingPosition | null>(null);

  const [query, setQuery] = useState('');
  const [verseResults, setVerseResults] = useState<VerseSearchResult[]>(
    []
  );

  const [loadingList, setLoadingList] = useState(true);
  const [loadingSurah, setLoadingSurah] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');

  const [pendingAyah, setPendingAyah] = useState<number | null>(null);

  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    async function loadInitialData() {
      try {
        setError('');

        const [list, position] = await Promise.all([
          getSurahs(),
          getReadingPosition(),
        ]);

        setSurahs(list);
        setReading(position);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Impossible de charger le Coran.'
        );
      } finally {
        setLoadingList(false);
      }
    }

    loadInitialData();
  }, []);

  useEffect(() => {
    const value = query.trim();

    if (!value || selected) {
      setVerseResults([]);
      return;
    }

    let cancelled = false;

    const timer = setTimeout(async () => {
      try {
        setSearching(true);

        const results = await searchVerses(value);

        if (!cancelled) {
          setVerseResults(results.slice(0, 20));
        }
      } catch {
        if (!cancelled) {
          setVerseResults([]);
        }
      } finally {
        if (!cancelled) {
          setSearching(false);
        }
      }
    }, 450);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, selected]);

  async function openSurah(
    surahNumber: number,
    ayahNumber?: number
  ) {
    try {
      setLoadingSurah(true);
      setError('');
      setPendingAyah(ayahNumber ?? null);

      const content = await getSurah(surahNumber);

      setSelected(content);

      setTimeout(() => {
        if (ayahNumber) {
          const estimatedY = Math.max(
            0,
            ayahNumber * 235
          );

          scrollRef.current?.scrollTo({
            y: estimatedY,
            animated: true,
          });
        } else {
          scrollRef.current?.scrollTo({
            y: 0,
            animated: false,
          });
        }
      }, 150);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Impossible de charger cette sourate.'
      );
    } finally {
      setLoadingSurah(false);
    }
  }

  async function keepMyPlace(
    surahNumber: number,
    ayahNumber: number
  ) {
    try {
      const position = await saveReadingPosition(
        surahNumber,
        ayahNumber
      );

      setReading(position);
      setPendingAyah(null);
    } catch {
      setError(
        'Impossible d’enregistrer votre position sur cet appareil.'
      );
    }
  }

  function closeSurah() {
    setSelected(null);
    setPendingAyah(null);
  }

  useEffect(() => {
    if (!missionId) {
      setMissionCompleted(false);
      return;
    }

    getNourProgress().then((progress) => {
      setMissionCompleted(
        progress.completedMissions.includes(missionId),
      );
    });
  }, [missionId]);

  useEffect(() => {
    const hasExplicitTarget =
      missionSurahNumber > 0 && missionAyahNumber > 0;

    if ((!missionId && !hasExplicitTarget) || selected || loadingSurah) {
      return;
    }

    const targetSurah =
      Number.isFinite(missionSurahNumber) &&
      missionSurahNumber > 0
        ? missionSurahNumber
        : reading?.surahNumber ?? 1;

    const targetAyah =
      Number.isFinite(missionAyahNumber) &&
      missionAyahNumber > 0
        ? missionAyahNumber
        : reading?.ayahNumber ?? 1;

    openSurah(targetSurah, targetAyah);
  }, [
    missionId,
    selected,
    loadingSurah,
    reading,
    missionSurahNumber,
    missionAyahNumber,
  ]);

  useEffect(() => {
    setMissionReady(false);
  }, [missionId, missionCompleted, selected, pendingAyah]);

  async function validateMission() {
    if (
      !missionId ||
      missionCompleted ||
      !missionReady ||
      missionSubmitting ||
      !selected
    ) {
      return;
    }

    try {
      setMissionSubmitting(true);
      setError('');

      const surahNumber =
        Number.isFinite(missionSurahNumber) &&
        missionSurahNumber > 0
          ? missionSurahNumber
          : selected.number;

      const fallbackAyah =
        selected.ayahs[0]?.numberInSurah ?? 1;

      const ayahNumber =
        Number.isFinite(missionAyahNumber) &&
        missionAyahNumber > 0
          ? missionAyahNumber
          : pendingAyah ?? reading?.ayahNumber ?? fallbackAyah;

      const mode =
        missionKind === 'review'
          ? 'review'
          : missionKind === 'learn'
            ? 'learn'
            : 'read';

      await recordVersePractice(
        surahNumber,
        ayahNumber,
        mode,
      );

      const result = await completeDailyMission(missionId);

      if (!result.alreadyCompleted) {
        setMissionCompleted(true);
      }

      setMissionSubmitting(false);
      router.back();
    } catch (err) {
      setMissionSubmitting(false);
      setError(
        err instanceof Error
          ? err.message
          : 'Impossible de valider cette mission.',
      );
    }
  }

  if (loadingList) {
    return (
      <NourBackground theme={theme}>
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          <TopBar
            theme={theme}
            title="CORAN"
            arabic="القرآن"
            onTheme={toggleTheme}
          />

          <View style={styles.center}>
            <ActivityIndicator color={theme.gold} />
            <Text
              style={[
                styles.centerText,
                { color: theme.muted },
              ]}
            >
              Chargement des sourates…
            </Text>
          </View>
        </SafeAreaView>
      </NourBackground>
    );
  }

  if (selected) {
    return (
      <NourBackground theme={theme}>
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <TopBar
              theme={theme}
              title="CORAN"
              arabic="القرآن"
              onTheme={toggleTheme}
            />

            <Pressable
              onPress={closeSurah}
              style={[
                styles.back,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.line,
                },
              ]}
            >
              <Ionicons
                name="arrow-back"
                size={16}
                color={theme.emerald}
              />
              <Text
                style={[
                  styles.backText,
                  { color: theme.emerald },
                ]}
              >
                Retour aux sourates
              </Text>
            </Pressable>

            <View
              style={[
                styles.hero,
                { backgroundColor: theme.emerald },
              ]}
            >
              <Text
                style={[
                  styles.heroEyebrow,
                  { color: theme.goldSoft },
                ]}
              >
                SOURATE {selected.number}
              </Text>

              <Text style={styles.heroArabic}>
                {selected.name}
              </Text>

              <Text style={styles.heroTitle}>
                {selected.englishName}
              </Text>

              <Text style={styles.heroTranslation}>
                {selected.englishNameTranslation}
              </Text>

              <View style={styles.heroMeta}>
                <Text style={styles.heroMetaText}>
                  {selected.numberOfAyahs} versets
                </Text>
                <Text style={styles.heroMetaText}>
                  {selected.revelationType === 'Meccan'
                    ? 'Mecquoise'
                    : 'Médinoise'}
                </Text>
              </View>
            </View>

            {loadingSurah ? (
              <ActivityIndicator
                style={{ marginTop: 16 }}
                color={theme.gold}
              />
            ) : null}

            {reading?.surahNumber === selected.number ? (
              <PremiumCard
                theme={theme}
                style={styles.savedCard}
              >
                <Eyebrow theme={theme}>
                  VOTRE DERNIÈRE POSITION
                </Eyebrow>

                <View style={styles.savedRow}>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.savedTitle,
                        { color: theme.ink },
                      ]}
                    >
                      Verset {reading.ayahNumber}
                    </Text>

                    <Text
                      style={[
                        styles.savedText,
                        { color: theme.muted },
                      ]}
                    >
                      Votre place est enregistrée sur cet
                      appareil.
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.savedPercent,
                      { color: theme.gold },
                    ]}
                  >
                    {Math.round(
                      (reading.ayahNumber /
                        selected.numberOfAyahs) *
                        100
                    )}
                    %
                  </Text>
                </View>
              </PremiumCard>
            ) : null}

            <View style={styles.sectionHeader}>
              <View>
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: theme.ink },
                  ]}
                >
                  Lecture
                </Text>

                <Text
                  style={[
                    styles.sectionSubtitle,
                    { color: theme.muted },
                  ]}
                >
                  Arabe et traduction française
                </Text>
              </View>
            </View>

            {selected.ayahs.map((ayah: Ayah, index) => {
              const translation =
                selected.translations[index];

              const isSaved =
                reading?.surahNumber === selected.number &&
                reading.ayahNumber === ayah.numberInSurah;

              const isTarget =
                pendingAyah === ayah.numberInSurah;

              return (
                <View
                  key={ayah.number}
                  style={[
                    styles.ayahCard,
                    {
                      backgroundColor: isTarget
                        ? theme.card2
                        : theme.card,
                      borderColor: isSaved
                        ? theme.gold
                        : theme.line,
                    },
                  ]}
                >
                  <View style={styles.ayahHeader}>
                    <View
                      style={[
                        styles.ayahNumber,
                        {
                          backgroundColor: isSaved
                            ? theme.emerald
                            : theme.card2,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.ayahNumberText,
                          {
                            color: isSaved
                              ? theme.white
                              : theme.emerald,
                          },
                        ]}
                      >
                        {ayah.numberInSurah}
                      </Text>
                    </View>

                    <Pressable
                      onPress={() =>
                        keepMyPlace(
                          selected.number,
                          ayah.numberInSurah
                        )
                      }
                      style={styles.saveButton}
                    >
                      <Ionicons
                        name={
                          isSaved
                            ? 'bookmark'
                            : 'bookmark-outline'
                        }
                        size={17}
                        color={
                          isSaved
                            ? theme.gold
                            : theme.muted
                        }
                      />

                      <Text
                        style={[
                          styles.saveText,
                          {
                            color: isSaved
                              ? theme.gold
                              : theme.muted,
                          },
                        ]}
                      >
                        {isSaved
                          ? 'Position sauvegardée'
                          : 'Garder ma place'}
                      </Text>
                    </Pressable>
                  </View>

                  <Text
                    style={[
                      styles.arabicText,
                      { color: theme.ink },
                    ]}
                  >
                    {ayah.text}
                  </Text>

                  {translation?.text ? (
                    <Text
                      style={[
                        styles.frenchText,
                        { color: theme.muted },
                      ]}
                    >
                      {translation.text}
                    </Text>
                  ) : (
                    <Text
                      style={[
                        styles.noTranslation,
                        { color: theme.muted },
                      ]}
                    >
                      Traduction indisponible pour ce verset.
                    </Text>
                  )}

                  {isTarget && missionId ? (
                    <Pressable
                      disabled={
                        missionCompleted ||
                        missionSubmitting ||
                        missionReady
                      }
                      onPress={() => setMissionReady(true)}
                      style={{
                        marginTop: 16,
                        minHeight: 44,
                        borderRadius: 14,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor:
                          missionCompleted || missionReady
                            ? theme.card2
                            : theme.emerald,
                        borderWidth: 1,
                        borderColor:
                          missionCompleted || missionReady
                            ? theme.line
                            : theme.emerald,
                        paddingHorizontal: 14,
                      }}
                    >
                      <Text
                        style={{
                          color:
                            missionCompleted || missionReady
                              ? theme.muted
                              : theme.white,
                          fontSize: 12,
                          fontWeight: '900',
                        }}
                      >
                        {missionCompleted
                          ? 'Verset déjà validé'
                          : missionReady
                            ? 'Verset pris en compte'
                            : missionKind === 'review'
                              ? 'J’ai révisé ce verset'
                              : missionKind === 'learn'
                                ? 'J’ai travaillé ce verset'
                                : 'J’ai lu ce verset'}
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              );
            })}

            <Text
              style={[
                styles.source,
                { color: theme.muted },
              ]}
            >
              Texte arabe : Uthmani · Traduction française :
              Muhammad Hamidullah.
            </Text>

            {missionId ? (
              <View
                style={{
                  marginTop: 18,
                  padding: 16,
                  borderRadius: 18,
                  backgroundColor: theme.card,
                  borderWidth: 1,
                  borderColor: theme.line,
                  gap: 10,
                }}
              >
                <Text
                  style={{
                    color: theme.gold,
                    fontSize: 10,
                    fontWeight: '900',
                    letterSpacing: 1.2,
                  }}
                >
                  MISSION DU JOUR
                </Text>

                <Text
                  style={{
                    color: theme.ink,
                    fontSize: 16,
                    fontWeight: '800',
                  }}
                >
                  {missionKind === 'review'
                    ? 'Révision'
                    : missionKind === 'learn'
                      ? 'Apprentissage'
                      : 'Lecture'}
                </Text>

                <Text
                  style={{
                    color: theme.muted,
                    fontSize: 13,
                    lineHeight: 19,
                  }}
                >
                  {missionCompleted
                    ? 'Mission déjà validée.'
                    : missionReady
                      ? 'Votre lecture peut maintenant être validée.'
                      : 'Prenez quelques secondes pour lire attentivement avant de valider.'}
                </Text>

                <Pressable
                  disabled={
                    missionCompleted ||
                    !missionReady ||
                    missionSubmitting
                  }
                  onPress={validateMission}
                  style={{
                    marginTop: 4,
                    minHeight: 48,
                    borderRadius: 15,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor:
                      missionCompleted ||
                      !missionReady ||
                      missionSubmitting
                        ? theme.card2
                        : theme.emerald,
                    opacity: missionSubmitting ? 0.65 : 1,
                  }}
                >
                  <Text
                    style={{
                      color:
                        missionCompleted ||
                        !missionReady ||
                        missionSubmitting
                          ? theme.muted
                          : theme.white,
                      fontSize: 13,
                      fontWeight: '900',
                    }}
                  >
                    {missionCompleted
                      ? 'Mission terminée'
                      : missionSubmitting
                        ? 'Validation…'
                        : missionReady
                          ? 'Valider la mission'
                          : 'Lecture en cours…'}
                  </Text>
                </Pressable>
              </View>
            ) : null}
          </ScrollView>
        </SafeAreaView>
      </NourBackground>
    );
  }

  return (
    <NourBackground theme={theme}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <TopBar
            theme={theme}
            title="CORAN"
            arabic="القرآن"
            onTheme={toggleTheme}
          />

          <View style={styles.intro}>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.kicker,
                  { color: theme.gold },
                ]}
              >
                LE CORAN
              </Text>

              <Text
                style={[
                  styles.pageTitle,
                  { color: theme.ink },
                ]}
              >
                Lire. Chercher. Reprendre.
              </Text>

              <Text
                style={[
                  styles.pageSubtitle,
                  { color: theme.muted },
                ]}
              >
                Le texte des sourates et leur traduction,
                directement dans NOUR.
              </Text>
            </View>

            <View
              style={[
                styles.seal,
                { backgroundColor: theme.emerald },
              ]}
            >
              <Text
                style={[
                  styles.sealText,
                  { color: theme.goldSoft },
                ]}
              >
                ن
              </Text>
            </View>
          </View>

          {error ? (
            <PremiumCard
              theme={theme}
              style={styles.errorCard}
            >
              <View style={styles.errorHeader}>
                <Ionicons
                  name="warning-outline"
                  size={20}
                  color={theme.gold}
                />

                <Text
                  style={[
                    styles.errorTitle,
                    { color: theme.ink },
                  ]}
                >
                  Le Coran n’a pas pu être chargé
                </Text>
              </View>

              <Text
                style={[
                  styles.errorText,
                  { color: theme.muted },
                ]}
              >
                {error}
              </Text>

              <Pressable
                onPress={() => {
                  setError('');
                  setLoadingList(true);

                  getSurahs()
                    .then(setSurahs)
                    .catch((err) =>
                      setError(
                        err instanceof Error
                          ? err.message
                          : 'Erreur de chargement.'
                      )
                    )
                    .finally(() => setLoadingList(false));
                }}
                style={[
                  styles.retry,
                  { backgroundColor: theme.emerald },
                ]}
              >
                <Text style={styles.retryText}>
                  Réessayer
                </Text>
              </Pressable>
            </PremiumCard>
          ) : null}

          {reading ? (
            <Pressable
              onPress={() =>
                openSurah(
                  reading.surahNumber,
                  reading.ayahNumber
                )
              }
              style={[
                styles.resume,
                { backgroundColor: theme.emerald },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.resumeKicker}>
                  REPRENDRE MA LECTURE
                </Text>

                <Text style={styles.resumeTitle}>
                  Sourate {reading.surahNumber}
                </Text>

                <Text style={styles.resumeText}>
                  Verset {reading.ayahNumber}
                </Text>
              </View>

              <View
                style={[
                  styles.resumeAction,
                  { backgroundColor: theme.goldSoft },
                ]}
              >
                <Ionicons
                  name="arrow-forward"
                  size={18}
                  color={theme.emerald}
                />
              </View>
            </Pressable>
          ) : null}

          <View
            style={[
              styles.search,
              {
                backgroundColor: theme.card,
                borderColor: theme.line,
              },
            ]}
          >
            <Ionicons
              name="search-outline"
              size={18}
              color={theme.muted}
            />

            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Rechercher un verset ou une sourate"
              placeholderTextColor={theme.muted}
              style={[
                styles.searchInput,
                { color: theme.ink },
              ]}
            />

            {searching ? (
              <ActivityIndicator
                size="small"
                color={theme.gold}
              />
            ) : query ? (
              <Pressable
                onPress={() => setQuery('')}
              >
                <Ionicons
                  name="close-circle"
                  size={18}
                  color={theme.muted}
                />
              </Pressable>
            ) : null}
          </View>

          {query.trim() ? (
            <>
              <View style={styles.searchHeader}>
                <View>
                  <Text
                    style={[
                      styles.searchTitle,
                      { color: theme.ink },
                    ]}
                  >
                    Résultats
                  </Text>

                  <Text
                    style={[
                      styles.searchSubtitle,
                      { color: theme.muted },
                    ]}
                  >
                    Recherche dans la traduction française
                  </Text>
                </View>

                <Text
                  style={[
                    styles.resultCount,
                    { color: theme.gold },
                  ]}
                >
                  {verseResults.length}
                </Text>
              </View>

              {verseResults.length === 0 && !searching ? (
                <PremiumCard
                  theme={theme}
                  style={styles.empty}
                >
                  <Ionicons
                    name="search-outline"
                    size={24}
                    color={theme.muted}
                  />

                  <Text
                    style={[
                      styles.emptyTitle,
                      { color: theme.ink },
                    ]}
                  >
                    Aucun verset trouvé
                  </Text>

                  <Text
                    style={[
                      styles.emptyText,
                      { color: theme.muted },
                    ]}
                  >
                    Essayez un autre mot ou une autre
                    expression.
                  </Text>
                </PremiumCard>
              ) : (
                <PremiumCard
                  theme={theme}
                  style={styles.resultsCard}
                >
                  {verseResults.map((result, index) => (
                    <Pressable
                      key={`${result.number}-${index}`}
                      onPress={() =>
                        openSurah(
                          result.surah.number,
                          result.numberInSurah
                        )
                      }
                      style={[
                        styles.resultRow,
                        index > 0 && {
                          borderTopWidth: 1,
                          borderTopColor: theme.line,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.resultNumber,
                          { backgroundColor: theme.card2 },
                        ]}
                      >
                        <Text
                          style={[
                            styles.resultNumberText,
                            { color: theme.emerald },
                          ]}
                        >
                          {result.numberInSurah}
                        </Text>
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.resultSurah,
                            { color: theme.ink },
                          ]}
                        >
                          {result.surah.englishName}
                        </Text>

                        <Text
                          style={[
                            styles.resultText,
                            { color: theme.muted },
                          ]}
                          numberOfLines={4}
                        >
                          {result.text}
                        </Text>
                      </View>

                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color={theme.muted}
                      />
                    </Pressable>
                  ))}
                </PremiumCard>
              )}
            </>
          ) : (
            <>
              <View style={styles.listHeader}>
                <View>
                  <Text
                    style={[
                      styles.sectionTitle,
                      { color: theme.ink },
                    ]}
                  >
                    Les 114 sourates
                  </Text>

                  <Text
                    style={[
                      styles.sectionSubtitle,
                      { color: theme.muted },
                    ]}
                  >
                    Choisissez votre lecture
                  </Text>
                </View>

                <Text
                  style={[
                    styles.count,
                    { color: theme.gold },
                  ]}
                >
                  114
                </Text>
              </View>

              <PremiumCard
                theme={theme}
                style={styles.surahList}
              >
                {surahs.map((surah, index) => (
                  <Pressable
                    key={surah.number}
                    onPress={() => openSurah(surah.number)}
                    style={[
                      styles.surahRow,
                      index > 0 && {
                        borderTopWidth: 1,
                        borderTopColor: theme.line,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.numberBox,
                        { backgroundColor: theme.card2 },
                      ]}
                    >
                      <Text
                        style={[
                          styles.number,
                          { color: theme.emerald },
                        ]}
                      >
                        {surah.number}
                      </Text>
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.surahName,
                          { color: theme.ink },
                        ]}
                      >
                        {surah.englishName}
                      </Text>

                      <Text
                        style={[
                          styles.surahInfo,
                          { color: theme.muted },
                        ]}
                      >
                        {surah.englishNameTranslation} ·{' '}
                        {surah.numberOfAyahs} versets
                      </Text>
                    </View>

                    <Text
                      style={[
                        styles.surahArabic,
                        { color: theme.gold },
                      ]}
                    >
                      {surah.name}
                    </Text>

                    <Ionicons
                      name="chevron-forward"
                      size={15}
                      color={theme.muted}
                    />
                  </Pressable>
                ))}
              </PremiumCard>
            </>
          )}

          <Text
            style={[
              styles.source,
              { color: theme.muted },
            ]}
          >
            Source du texte et des données : Al Quran Cloud.
            Traduction française : Muhammad Hamidullah.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </NourBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 18,
    paddingBottom: 125,
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 24,
  },

  centerText: {
    fontSize: 12,
  },

  intro: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 14,
    marginTop: 3,
    marginBottom: 17,
  },

  kicker: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.8,
    marginBottom: 5,
  },

  pageTitle: {
    fontFamily: 'Georgia',
    fontSize: 29,
    lineHeight: 33,
    fontWeight: '700',
  },

  pageSubtitle: {
    fontSize: 11,
    lineHeight: 17,
    marginTop: 5,
    maxWidth: 310,
  },

  seal: {
    width: 52,
    height: 52,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sealText: {
    fontSize: 24,
  },

  errorCard: {
    marginBottom: 12,
  },

  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  errorTitle: {
    fontFamily: 'Georgia',
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },

  errorText: {
    fontSize: 11,
    lineHeight: 17,
    marginTop: 7,
  },

  retry: {
    alignSelf: 'flex-start',
    borderRadius: 14,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginTop: 14,
  },

  retryText: {
    color: '#FFFCF6',
    fontSize: 10,
    fontWeight: '800',
  },

  resume: {
    minHeight: 92,
    borderRadius: 25,
    padding: 17,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },

  resumeKicker: {
    color: '#D6BD8A',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.6,
  },

  resumeTitle: {
    color: '#FFFCF6',
    fontFamily: 'Georgia',
    fontSize: 21,
    fontWeight: '700',
    marginTop: 5,
  },

  resumeText: {
    color: 'rgba(255,252,246,.65)',
    fontSize: 10,
    marginTop: 3,
  },

  resumeAction: {
    width: 48,
    height: 48,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },

  search: {
    minHeight: 50,
    borderRadius: 17,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 13,
  },

  searchInput: {
    flex: 1,
    fontSize: 12,
  },

  searchHeader: {
    marginTop: 23,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },

  searchTitle: {
    fontFamily: 'Georgia',
    fontSize: 24,
    fontWeight: '700',
  },

  searchSubtitle: {
    fontSize: 10,
    marginTop: 3,
  },

  resultCount: {
    fontFamily: 'Georgia',
    fontSize: 23,
    fontWeight: '700',
  },

  resultsCard: {
    paddingVertical: 2,
  },

  resultRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 14,
  },

  resultNumber: {
    width: 36,
    height: 36,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },

  resultNumberText: {
    fontSize: 10,
    fontWeight: '800',
  },

  resultSurah: {
    fontSize: 12,
    fontWeight: '800',
  },

  resultText: {
    fontSize: 11,
    lineHeight: 17,
    marginTop: 4,
  },

  empty: {
    alignItems: 'center',
    paddingVertical: 30,
  },

  emptyTitle: {
    fontFamily: 'Georgia',
    fontSize: 21,
    fontWeight: '700',
    marginTop: 10,
  },

  emptyText: {
    fontSize: 11,
    marginTop: 5,
    textAlign: 'center',
  },

  listHeader: {
    marginTop: 24,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },

  sectionTitle: {
    fontFamily: 'Georgia',
    fontSize: 25,
    fontWeight: '700',
  },

  sectionSubtitle: {
    fontSize: 10,
    marginTop: 3,
  },

  count: {
    fontFamily: 'Georgia',
    fontSize: 22,
    fontWeight: '700',
  },

  surahList: {
    paddingVertical: 3,
  },

  surahRow: {
    minHeight: 70,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 11,
  },

  numberBox: {
    width: 39,
    height: 39,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  number: {
    fontSize: 10,
    fontWeight: '800',
  },

  surahName: {
    fontSize: 13,
    fontWeight: '800',
  },

  surahInfo: {
    fontSize: 9,
    marginTop: 3,
  },

  surahArabic: {
    fontSize: 18,
    maxWidth: 92,
  },

  source: {
    textAlign: 'center',
    fontSize: 9,
    lineHeight: 14,
    marginTop: 18,
    paddingHorizontal: 15,
  },

  back: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 8,
    marginBottom: 12,
  },

  backText: {
    fontSize: 10,
    fontWeight: '800',
  },

  hero: {
    borderRadius: 31,
    padding: 24,
  },

  heroEyebrow: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.7,
  },

  heroArabic: {
    color: '#FFFCF6',
    fontSize: 30,
    textAlign: 'right',
    marginTop: 18,
    lineHeight: 44,
  },

  heroTitle: {
    color: '#FFFCF6',
    fontFamily: 'Georgia',
    fontSize: 31,
    fontWeight: '700',
    marginTop: 8,
  },

  heroTranslation: {
    color: 'rgba(255,252,246,.62)',
    fontSize: 11,
    marginTop: 3,
  },

  heroMeta: {
    flexDirection: 'row',
    gap: 15,
    marginTop: 19,
  },

  heroMetaText: {
    color: '#D6BD8A',
    fontSize: 10,
    fontWeight: '700',
  },

  savedCard: {
    marginTop: 12,
  },

  savedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },

  savedTitle: {
    fontFamily: 'Georgia',
    fontSize: 22,
    fontWeight: '700',
  },

  savedText: {
    fontSize: 10,
    marginTop: 3,
  },

  savedPercent: {
    fontFamily: 'Georgia',
    fontSize: 24,
    fontWeight: '700',
  },

  sectionHeader: {
    marginTop: 25,
    marginBottom: 11,
  },

  ayahCard: {
    borderRadius: 23,
    borderWidth: 1,
    padding: 16,
    marginBottom: 10,
  },

  ayahHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  ayahNumber: {
    width: 35,
    height: 35,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },

  ayahNumberText: {
    fontSize: 10,
    fontWeight: '800',
  },

  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
  },

  saveText: {
    fontSize: 9,
    fontWeight: '700',
  },

  arabicText: {
    fontSize: 25,
    lineHeight: 45,
    textAlign: 'right',
    marginTop: 18,
  },

  frenchText: {
    fontSize: 13,
    lineHeight: 20,
    marginTop: 15,
  },

  noTranslation: {
    fontSize: 11,
    marginTop: 15,
    fontStyle: 'italic',
  },
});
