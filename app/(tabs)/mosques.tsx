import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NourBackground } from '@/components/NourBackground';
import { TopBar } from '@/components/TopBar';
import { PremiumCard } from '@/components/PremiumCard';
import { useNour } from '../_layout';

import {
  formatDistance,
  getNearbyMosques,
  openMosqueDirections,
  type Mosque,
} from '@/lib/mosques';

export default function Mosques() {
  const { theme, toggleTheme } = useNour();

  const [mosques, setMosques] = useState<Mosque[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const result = await getNearbyMosques();
      setMosques(result.mosques);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Impossible de rechercher les mosquées.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <NourBackground theme={theme}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <TopBar
            theme={theme}
            title="MOSQUÉES"
            arabic="المساجد"
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
                AUTOUR DE VOUS
              </Text>

              <Text
                style={[
                  styles.title,
                  { color: theme.ink },
                ]}
              >
                Trouver une mosquée.
              </Text>

              <Text
                style={[
                  styles.subtitle,
                  { color: theme.muted },
                ]}
              >
                Nous cherchons les mosquées référencées autour
                de votre position.
              </Text>
            </View>

            <View
              style={[
                styles.seal,
                { backgroundColor: theme.emerald },
              ]}
            >
              <Ionicons
                name="location"
                size={22}
                color={theme.goldSoft}
              />
            </View>
          </View>

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator color={theme.gold} />

              <Text
                style={[
                  styles.centerText,
                  { color: theme.muted },
                ]}
              >
                Recherche autour de vous…
              </Text>
            </View>
          ) : error ? (
            <PremiumCard
              theme={theme}
              style={styles.errorCard}
            >
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

              <Text
                style={[
                  styles.errorTitle,
                  { color: theme.ink },
                ]}
              >
                Localisation nécessaire
              </Text>

              <Text
                style={[
                  styles.errorText,
                  { color: theme.muted },
                ]}
              >
                {error}
              </Text>

              <Pressable
                onPress={load}
                style={[
                  styles.retry,
                  { backgroundColor: theme.emerald },
                ]}
              >
                <Ionicons
                  name="refresh"
                  size={15}
                  color={theme.white}
                />

                <Text style={styles.retryText}>
                  Réessayer
                </Text>
              </Pressable>
            </PremiumCard>
          ) : mosques.length === 0 ? (
            <PremiumCard
              theme={theme}
              style={styles.empty}
            >
              <Ionicons
                name="location-outline"
                size={27}
                color={theme.muted}
              />

              <Text
                style={[
                  styles.emptyTitle,
                  { color: theme.ink },
                ]}
              >
                Aucune mosquée trouvée
              </Text>

              <Text
                style={[
                  styles.emptyText,
                  { color: theme.muted },
                ]}
              >
                Aucune mosquée référencée n’a été trouvée dans
                un rayon de 5 km.
              </Text>

              <Pressable
                onPress={load}
                style={[
                  styles.retry,
                  { backgroundColor: theme.emerald },
                ]}
              >
                <Text style={styles.retryText}>
                  Actualiser
                </Text>
              </Pressable>
            </PremiumCard>
          ) : (
            <>
              <View style={styles.resultHeader}>
                <View>
                  <Text
                    style={[
                      styles.resultTitle,
                      { color: theme.ink },
                    ]}
                  >
                    Près de vous
                  </Text>

                  <Text
                    style={[
                      styles.resultSubtitle,
                      { color: theme.muted },
                    ]}
                  >
                    Résultats triés par distance
                  </Text>
                </View>

                <View
                  style={[
                    styles.countBadge,
                    { backgroundColor: theme.card2 },
                  ]}
                >
                  <Text
                    style={[
                      styles.count,
                      { color: theme.emerald },
                    ]}
                  >
                    {mosques.length}
                  </Text>
                </View>
              </View>

              {mosques.map((mosque) => (
                <PremiumCard
                  key={mosque.id}
                  theme={theme}
                  style={styles.mosqueCard}
                >
                  <View style={styles.cardTop}>
                    <View
                      style={[
                        styles.mosqueIcon,
                        { backgroundColor: theme.emerald },
                      ]}
                    >
                      <Ionicons
                        name="business-outline"
                        size={20}
                        color={theme.goldSoft}
                      />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.mosqueName,
                          { color: theme.ink },
                        ]}
                      >
                        {mosque.name}
                      </Text>

                      <Text
                        style={[
                          styles.distance,
                          { color: theme.gold },
                        ]}
                      >
                        {formatDistance(
                          mosque.distanceMeters
                        )}
                      </Text>
                    </View>
                  </View>

                  {mosque.address ? (
                    <View style={styles.infoRow}>
                      <Ionicons
                        name="navigate-outline"
                        size={14}
                        color={theme.muted}
                      />
                      <Text
                        style={[
                          styles.infoText,
                          { color: theme.muted },
                        ]}
                      >
                        {mosque.address}
                      </Text>
                    </View>
                  ) : null}

                  {mosque.serviceTimes ? (
                    <View style={styles.infoRow}>
                      <Ionicons
                        name="time-outline"
                        size={14}
                        color={theme.muted}
                      />
                      <Text
                        style={[
                          styles.infoText,
                          { color: theme.muted },
                        ]}
                        numberOfLines={2}
                      >
                        {mosque.serviceTimes}
                      </Text>
                    </View>
                  ) : null}

                  {mosque.openingHours ? (
                    <View style={styles.infoRow}>
                      <Ionicons
                        name="calendar-outline"
                        size={14}
                        color={theme.muted}
                      />
                      <Text
                        style={[
                          styles.infoText,
                          { color: theme.muted },
                        ]}
                        numberOfLines={2}
                      >
                        {mosque.openingHours}
                      </Text>
                    </View>
                  ) : null}

                  <Pressable
                    onPress={() =>
                      openMosqueDirections(
                        mosque.latitude,
                        mosque.longitude
                      )
                    }
                    style={({ pressed }) => [
                      styles.directionButton,
                      {
                        backgroundColor: theme.emerald,
                        opacity: pressed ? 0.85 : 1,
                      },
                    ]}
                  >
                    <Ionicons
                      name="navigate"
                      size={15}
                      color={theme.white}
                    />

                    <Text style={styles.directionText}>
                      Itinéraire
                    </Text>
                  </Pressable>
                </PremiumCard>
              ))}

              <Pressable
                onPress={load}
                style={[
                  styles.refresh,
                  {
                    borderColor: theme.line,
                    backgroundColor: theme.card,
                  },
                ]}
              >
                <Ionicons
                  name="refresh"
                  size={15}
                  color={theme.emerald}
                />

                <Text
                  style={[
                    styles.refreshText,
                    { color: theme.emerald },
                  ]}
                >
                  Actualiser ma position
                </Text>
              </Pressable>

              <Text
                style={[
                  styles.source,
                  { color: theme.muted },
                ]}
              >
                Données cartographiques : OpenStreetMap.
              </Text>
            </>
          )}
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

  intro: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 14,
    marginTop: 4,
    marginBottom: 20,
  },

  kicker: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.7,
    marginBottom: 5,
  },

  title: {
    fontFamily: 'Georgia',
    fontSize: 29,
    lineHeight: 33,
    fontWeight: '700',
  },

  subtitle: {
    fontSize: 11,
    lineHeight: 17,
    marginTop: 5,
    maxWidth: 305,
  },

  seal: {
    width: 52,
    height: 52,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },

  center: {
    minHeight: 280,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },

  centerText: {
    fontSize: 12,
  },

  errorCard: {
    alignItems: 'center',
    paddingVertical: 30,
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
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'center',
    maxWidth: 310,
    marginTop: 7,
  },

  retry: {
    minHeight: 43,
    paddingHorizontal: 16,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 17,
  },

  retryText: {
    color: '#FFFCF6',
    fontSize: 10,
    fontWeight: '800',
  },

  empty: {
    alignItems: 'center',
    paddingVertical: 31,
  },

  emptyTitle: {
    fontFamily: 'Georgia',
    fontSize: 22,
    fontWeight: '700',
    marginTop: 10,
  },

  emptyText: {
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'center',
    maxWidth: 300,
    marginTop: 5,
  },

  resultHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 11,
  },

  resultTitle: {
    fontFamily: 'Georgia',
    fontSize: 25,
    fontWeight: '700',
  },

  resultSubtitle: {
    fontSize: 10,
    marginTop: 3,
  },

  countBadge: {
    minWidth: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  count: {
    fontFamily: 'Georgia',
    fontSize: 17,
    fontWeight: '700',
  },

  mosqueCard: {
    marginBottom: 10,
  },

  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },

  mosqueIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  mosqueName: {
    fontFamily: 'Georgia',
    fontSize: 20,
    fontWeight: '700',
  },

  distance: {
    fontSize: 10,
    fontWeight: '800',
    marginTop: 4,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
    marginTop: 11,
  },

  infoText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 15,
  },

  directionButton: {
    minHeight: 44,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 15,
  },

  directionText: {
    color: '#FFFCF6',
    fontSize: 11,
    fontWeight: '800',
  },

  refresh: {
    minHeight: 44,
    borderRadius: 15,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 7,
  },

  refreshText: {
    fontSize: 10,
    fontWeight: '800',
  },

  source: {
    textAlign: 'center',
    fontSize: 9,
    lineHeight: 14,
    marginTop: 16,
  },
});
