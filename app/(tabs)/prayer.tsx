import React, { useCallback, useEffect, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NourBackground } from '@/components/NourBackground';
import { TopBar } from '@/components/TopBar';
import { PremiumCard, Eyebrow } from '@/components/PremiumCard';
import { useNour } from '../_layout';

import {
  calculatePrayerSnapshot,
  formatPrayerTime,
  formatRemaining,
  requestCurrentCoordinates,
  type PrayerSnapshot,
} from '@/lib/prayer-times';

export default function Prayer() {
  const { theme, toggleTheme } = useNour();

  const [snapshot, setSnapshot] = useState<PrayerSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadPrayerTimes = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const coords = await requestCurrentCoordinates();

      const result = calculatePrayerSnapshot(
        coords.latitude,
        coords.longitude
      );

      setSnapshot(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Impossible de récupérer votre position.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPrayerTimes();
  }, [loadPrayerTimes]);

  useEffect(() => {
    if (!snapshot) {
      return;
    }

    const interval = setInterval(() => {
      const refreshed = calculatePrayerSnapshot(
        snapshot.latitude,
        snapshot.longitude
      );

      setSnapshot(refreshed);
    }, 30000);

    return () => clearInterval(interval);
  }, [snapshot?.latitude, snapshot?.longitude]);

  const now = new Date();

  return (
    <NourBackground theme={theme}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <TopBar
            theme={theme}
            title="PRIÈRE"
            arabic="الصلاة"
            onTheme={toggleTheme}
          />

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator color={theme.gold} />
              <Text style={[styles.loadingText, { color: theme.muted }]}>
                Calcul de vos horaires…
              </Text>
            </View>
          ) : error ? (
            <PremiumCard theme={theme} style={styles.errorCard}>
              <View
                style={[
                  styles.errorIcon,
                  { backgroundColor: theme.card2 },
                ]}
              >
                <Ionicons
                  name="location-outline"
                  size={23}
                  color={theme.emerald}
                />
              </View>

              <Text style={[styles.errorTitle, { color: theme.ink }]}>
                Votre position est nécessaire
              </Text>

              <Text style={[styles.errorText, { color: theme.muted }]}>
                {error}
              </Text>

              <Pressable
                onPress={loadPrayerTimes}
                style={[
                  styles.mainButton,
                  { backgroundColor: theme.emerald },
                ]}
              >
                <Ionicons
                  name="location"
                  size={16}
                  color={theme.white}
                />
                <Text style={styles.mainButtonText}>
                  Utiliser ma position
                </Text>
              </Pressable>
            </PremiumCard>
          ) : snapshot ? (
            <>
              <View
                style={[
                  styles.hero,
                  { backgroundColor: theme.emerald },
                ]}
              >
                <Eyebrow
                  theme={{
                    ...theme,
                    gold: theme.goldSoft,
                  }}
                >
                  PROCHAINE PRIÈRE
                </Eyebrow>

                <Text
                  style={[
                    styles.nextPrayer,
                    { color: theme.white },
                  ]}
                >
                  {snapshot.nextPrayer.name}
                </Text>

                <Text
                  style={[
                    styles.nextTime,
                    { color: theme.white },
                  ]}
                >
                  {formatPrayerTime(
                    snapshot.nextPrayer.time,
                    snapshot.timezone
                  )}
                </Text>

                <Text style={styles.remaining}>
                  dans {formatRemaining(snapshot.remainingMs)}
                </Text>

                <View style={styles.heroFooter}>
                  <View style={styles.locationRow}>
                    <Ionicons
                      name="location"
                      size={13}
                      color={theme.goldSoft}
                    />
                    <Text
                      style={[
                        styles.locationText,
                        { color: theme.goldSoft },
                      ]}
                    >
                      Position actuelle
                    </Text>
                  </View>

                  <Text style={styles.method}>
                    Muslim World League
                  </Text>
                </View>
              </View>

              <Text style={[styles.heading, { color: theme.ink }]}>
                Les cinq prières
              </Text>

              <View style={styles.grid}>
                {snapshot.prayers.map((prayer) => {
                  const isPast =
                    prayer.status === 'past' &&
                    prayer.time.getTime() <= now.getTime();

                  return (
                    <PremiumCard
                      key={`${prayer.key}-${prayer.time.toISOString()}`}
                      theme={theme}
                      style={styles.prayerCard}
                    >
                      <View style={styles.cardHeader}>
                        <Text
                          style={[
                            styles.prayerName,
                            { color: theme.ink },
                          ]}
                        >
                          {prayer.name}
                        </Text>

                        {prayer.status === 'next' ? (
                          <View
                            style={[
                              styles.dot,
                              { backgroundColor: theme.gold },
                            ]}
                          />
                        ) : null}
                      </View>

                      <Text
                        style={[
                          styles.time,
                          { color: theme.ink },
                        ]}
                      >
                        {formatPrayerTime(
                          prayer.time,
                          snapshot.timezone
                        )}
                      </Text>

                      <Text
                        style={[
                          styles.status,
                          {
                            color:
                              prayer.status === 'next'
                                ? theme.gold
                                : isPast
                                  ? theme.muted
                                  : theme.emerald2,
                          },
                        ]}
                      >
                        {prayer.status === 'next'
                          ? 'À venir'
                          : isPast
                            ? 'Terminée'
                            : 'Aujourd’hui'}
                      </Text>
                    </PremiumCard>
                  );
                })}
              </View>

              <View style={styles.headingRow}>
                <Text style={[styles.heading, { color: theme.ink }]}>
                  Qibla
                </Text>

                <Pressable
                  onPress={loadPrayerTimes}
                  hitSlop={10}
                >
                  <Ionicons
                    name="refresh"
                    size={18}
                    color={theme.gold}
                  />
                </Pressable>
              </View>

              <PremiumCard
                theme={theme}
                style={styles.qiblaCard}
              >
                <View
                  style={[
                    styles.compass,
                    { borderColor: theme.gold },
                  ]}
                >
                  <Text
                    style={[
                      styles.north,
                      { color: theme.muted },
                    ]}
                  >
                    N
                  </Text>

                  <View
                    style={[
                      styles.needle,
                      {
                        backgroundColor: theme.gold,
                        transform: [
                          {
                            rotate: `${snapshot.qibla}deg`,
                          },
                        ],
                      },
                    ]}
                  />

                  <View
                    style={[
                      styles.kaaba,
                      { backgroundColor: theme.emerald },
                    ]}
                  >
                    <Ionicons
                      name="cube-outline"
                      size={18}
                      color={theme.goldSoft}
                    />
                  </View>
                </View>

                <Text
                  style={[
                    styles.qiblaDegree,
                    { color: theme.ink },
                  ]}
                >
                  {snapshot.qibla}°
                </Text>

                <Text
                  style={[
                    styles.qiblaText,
                    { color: theme.muted },
                  ]}
                >
                  Direction de la Kaaba depuis votre position
                </Text>

                <Text
                  style={[
                    styles.coordinates,
                    { color: theme.muted },
                  ]}
                >
                  {snapshot.latitude.toFixed(4)}° ·{' '}
                  {snapshot.longitude.toFixed(4)}°
                </Text>
              </PremiumCard>
            </>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </NourBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },

  center: {
    minHeight: 300,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },

  loadingText: {
    fontSize: 12,
  },

  errorCard: {
    alignItems: 'center',
    paddingVertical: 30,
    marginTop: 10,
  },

  errorIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  errorTitle: {
    fontFamily: 'Georgia',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 15,
  },

  errorText: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    maxWidth: 300,
    marginTop: 8,
  },

  mainButton: {
    minHeight: 46,
    paddingHorizontal: 18,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 19,
  },

  mainButtonText: {
    color: '#FFFCF6',
    fontSize: 12,
    fontWeight: '800',
  },

  hero: {
    padding: 25,
    borderRadius: 31,
    overflow: 'hidden',
  },

  nextPrayer: {
    fontFamily: 'Georgia',
    fontSize: 62,
    lineHeight: 66,
    fontWeight: '700',
    marginTop: 13,
  },

  nextTime: {
    fontFamily: 'Georgia',
    fontSize: 29,
    fontWeight: '700',
    marginTop: 2,
  },

  remaining: {
    color: 'rgba(255,252,246,.70)',
    fontSize: 13,
    marginTop: 5,
  },

  heroFooter: {
    marginTop: 23,
    gap: 8,
  },

  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  locationText: {
    fontSize: 10,
    fontWeight: '700',
  },

  method: {
    color: 'rgba(255,252,246,.45)',
    fontSize: 9,
  },

  heading: {
    fontFamily: 'Georgia',
    fontSize: 30,
    fontWeight: '700',
    marginTop: 25,
    marginBottom: 10,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  prayerCard: {
    width: '47%',
    minHeight: 130,
    padding: 16,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  prayerName: {
    fontSize: 13,
    fontWeight: '700',
  },

  dot: {
    width: 7,
    height: 7,
    borderRadius: 10,
  },

  time: {
    fontFamily: 'Georgia',
    fontSize: 29,
    fontWeight: '700',
    marginTop: 12,
  },

  status: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 5,
  },

  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  qiblaCard: {
    alignItems: 'center',
    paddingVertical: 28,
  },

  compass: {
    width: 190,
    height: 190,
    borderRadius: 95,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  north: {
    position: 'absolute',
    top: 12,
    fontSize: 9,
    fontWeight: '800',
  },

  needle: {
    position: 'absolute',
    width: 3,
    height: 82,
    borderRadius: 3,
  },

  kaaba: {
    width: 43,
    height: 43,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  qiblaDegree: {
    fontFamily: 'Georgia',
    fontSize: 38,
    fontWeight: '700',
    marginTop: 16,
  },

  qiblaText: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
  },

  coordinates: {
    fontSize: 9,
    marginTop: 9,
  },
});
