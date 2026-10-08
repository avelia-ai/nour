import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Switch,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { NourBackground } from '@/components/NourBackground';
import { TopBar } from '@/components/TopBar';
import { PremiumCard, Eyebrow } from '@/components/PremiumCard';
import { useNour } from '../_layout';

type ReadingPosition = {
  surahNumber: number;
  ayahNumber: number;
};

const PROFILE_KEY = '@nour/profile-name';
const QURAN_READING_KEY = '@nour/quran-reading';

const SURAH_NAMES: Record<number, string> = {
  1: 'Al-Fatiha',
  2: 'Al-Baqara',
  3: 'Al-Imran',
  4: 'An-Nisa',
  5: 'Al-Maida',
  6: 'Al-Anam',
  7: 'Al-Araf',
  8: 'Al-Anfal',
  9: 'At-Tawba',
  10: 'Yunus',
  11: 'Hud',
  12: 'Yusuf',
  13: 'Ar-Rad',
  14: 'Ibrahim',
  15: 'Al-Hijr',
  16: 'An-Nahl',
  17: 'Al-Isra',
  18: 'Al-Kahf',
  19: 'Maryam',
  20: 'Ta-Ha',
  21: 'Al-Anbiya',
  22: 'Al-Hajj',
  23: 'Al-Muminun',
  24: 'An-Nur',
  25: 'Al-Furqan',
  26: 'Ash-Shuara',
  27: 'An-Naml',
  28: 'Al-Qasas',
  29: 'Al-Ankabut',
  30: 'Ar-Rum',
  31: 'Luqman',
  32: 'As-Sajda',
  33: 'Al-Ahzab',
  34: 'Saba',
  35: 'Fatir',
  36: 'Ya-Sin',
  37: 'As-Saffat',
  38: 'Sad',
  39: 'Az-Zumar',
  40: 'Ghafir',
  41: 'Fussilat',
  42: 'Ash-Shura',
  43: 'Az-Zukhruf',
  44: 'Ad-Dukhan',
  45: 'Al-Jathiya',
  46: 'Al-Ahqaf',
  47: 'Muhammad',
  48: 'Al-Fath',
  49: 'Al-Hujurat',
  50: 'Qaf',
  51: 'Adh-Dhariyat',
  52: 'At-Tur',
  53: 'An-Najm',
  54: 'Al-Qamar',
  55: 'Ar-Rahman',
  56: 'Al-Waqia',
  57: 'Al-Hadid',
  58: 'Al-Mujadila',
  59: 'Al-Hashr',
  60: 'Al-Mumtahana',
  61: 'As-Saff',
  62: 'Al-Jumua',
  63: 'Al-Munafiqun',
  64: 'At-Taghabun',
  65: 'At-Talaq',
  66: 'At-Tahrim',
  67: 'Al-Mulk',
  68: 'Al-Qalam',
  69: 'Al-Haqqa',
  70: 'Al-Maarij',
  71: 'Nuh',
  72: 'Al-Jinn',
  73: 'Al-Muzzammil',
  74: 'Al-Muddaththir',
  75: 'Al-Qiyama',
  76: 'Al-Insan',
  77: 'Al-Mursalat',
  78: 'An-Naba',
  79: 'An-Naziat',
  80: 'Abasa',
  81: 'At-Takwir',
  82: 'Al-Infitar',
  83: 'Al-Mutaffifin',
  84: 'Al-Inshiqaq',
  85: 'Al-Buruj',
  86: 'At-Tariq',
  87: 'Al-Ala',
  88: 'Al-Ghashiya',
  89: 'Al-Fajr',
  90: 'Al-Balad',
  91: 'Ash-Shams',
  92: 'Al-Layl',
  93: 'Ad-Duha',
  94: 'Ash-Sharh',
  95: 'At-Tin',
  96: 'Al-Alaq',
  97: 'Al-Qadr',
  98: 'Al-Bayyina',
  99: 'Az-Zalzala',
  100: 'Al-Adiyat',
  101: 'Al-Qaria',
  102: 'At-Takathur',
  103: 'Al-Asr',
  104: 'Al-Humaza',
  105: 'Al-Fil',
  106: 'Quraysh',
  107: 'Al-Maun',
  108: 'Al-Kawthar',
  109: 'Al-Kafirun',
  110: 'An-Nasr',
  111: 'Al-Masad',
  112: 'Al-Ikhlas',
  113: 'Al-Falaq',
  114: 'An-Nas',
};

export default function Profile() {
  const { theme, darkMode, toggleTheme } = useNour();

  const [name, setName] = useState('');
  const [draftName, setDraftName] = useState('');
  const [editing, setEditing] = useState(false);
  const [reading, setReading] = useState<ReadingPosition | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const [storedName, storedReading] = await Promise.all([
          AsyncStorage.getItem(PROFILE_KEY),
          AsyncStorage.getItem(QURAN_READING_KEY),
        ]);

        if (storedName) {
          setName(storedName);
          setDraftName(storedName);
        }

        if (storedReading) {
          setReading(JSON.parse(storedReading));
        }
      } catch {
        // Profil local non disponible : on garde les valeurs par défaut.
      }
    };

    loadProfile();
  }, []);

  const saveName = async () => {
    const cleanName = draftName.trim();

    if (!cleanName) {
      setEditing(false);
      return;
    }

    setName(cleanName);
    setDraftName(cleanName);
    setEditing(false);

    try {
      await AsyncStorage.setItem(PROFILE_KEY, cleanName);
    } catch {
      // La valeur reste affichée même si le stockage local échoue.
    }
  };

  const displayName = name || 'Votre profil';

  return (
    <NourBackground theme={theme}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <TopBar
            theme={theme}
            title="PROFIL"
            arabic="ملفي"
            onTheme={toggleTheme}
          />

          <View style={styles.profile}>
            <View
              style={[
                styles.avatar,
                {
                  backgroundColor: theme.emerald,
                  borderColor: theme.gold,
                },
              ]}
            >
              <Text style={[styles.avatarText, { color: theme.goldSoft }]}>
                {name ? name.charAt(0).toUpperCase() : 'ن'}
              </Text>
            </View>

            <Text style={[styles.name, { color: theme.ink }]}>
              {displayName}
            </Text>

            <Text style={[styles.subtitle, { color: theme.muted }]}>
              Ton espace personnel
            </Text>

            {!editing ? (
              <Pressable
                onPress={() => {
                  setDraftName(name);
                  setEditing(true);
                }}
                style={({ pressed }) => [
                  styles.editButton,
                  {
                    borderColor: theme.line,
                    backgroundColor: theme.card2,
                    opacity: pressed ? 0.75 : 1,
                  },
                ]}
              >
                <Text style={[styles.editButtonText, { color: theme.ink }]}>
                  Modifier mon prénom
                </Text>
              </Pressable>
            ) : (
              <View style={styles.editor}>
                <TextInput
                  value={draftName}
                  onChangeText={setDraftName}
                  placeholder="Ton prénom"
                  placeholderTextColor={theme.muted}
                  autoFocus
                  maxLength={30}
                  style={[
                    styles.input,
                    {
                      color: theme.ink,
                      backgroundColor: theme.card2,
                      borderColor: theme.line,
                    },
                  ]}
                />

                <View style={styles.editorActions}>
                  <Pressable
                    onPress={() => {
                      setDraftName(name);
                      setEditing(false);
                    }}
                    style={[
                      styles.secondaryButton,
                      { borderColor: theme.line },
                    ]}
                  >
                    <Text style={[styles.secondaryText, { color: theme.ink }]}>
                      Annuler
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={saveName}
                    style={[
                      styles.primaryButton,
                      { backgroundColor: theme.emerald },
                    ]}
                  >
                    <Text
                      style={[styles.primaryText, { color: theme.white }]}
                    >
                      Enregistrer
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>

          <Text style={[styles.h2, { color: theme.ink }]}>
            Ma lecture
          </Text>

          <PremiumCard theme={theme}>
            {reading ? (
              <>
                <Eyebrow theme={theme}>Reprise de lecture</Eyebrow>
                <Text style={[styles.cardTitle, { color: theme.ink }]}>
                  {SURAH_NAMES[reading.surahNumber] ??
                    `Sourate ${reading.surahNumber}`}
                </Text>
                <Text style={[styles.description, { color: theme.muted }]}>
                  Verset {reading.ayahNumber} · ta dernière position est
                  enregistrée sur cet appareil.
                </Text>

                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: '/quran',
                      params: {
                        surah: String(reading.surahNumber),
                        ayah: String(reading.ayahNumber),
                      },
                    })
                  }
                  style={({ pressed }) => [
                    styles.fullButton,
                    {
                      backgroundColor: theme.emerald,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <Text style={[styles.fullButtonText, { color: theme.white }]}>
                    Reprendre ma lecture
                  </Text>
                </Pressable>
              </>
            ) : (
              <>
                <Eyebrow theme={theme}>Coran</Eyebrow>
                <Text style={[styles.cardTitle, { color: theme.ink }]}>
                  Commence ta lecture
                </Text>
                <Text style={[styles.description, { color: theme.muted }]}>
                  Ta position sera automatiquement conservée lorsque tu
                  utiliseras « Garder ma place » dans le Coran.
                </Text>

                <Pressable
                  onPress={() => router.push('/quran')}
                  style={({ pressed }) => [
                    styles.fullButton,
                    {
                      backgroundColor: theme.emerald,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <Text style={[styles.fullButtonText, { color: theme.white }]}>
                    Ouvrir le Coran
                  </Text>
                </Pressable>
              </>
            )}
          </PremiumCard>

          <Text style={[styles.h2, { color: theme.ink }]}>
            Apparence
          </Text>

          <PremiumCard theme={theme}>
            <View style={styles.settingRow}>
              <View style={styles.settingText}>
                <Text style={[styles.cardTitleSmall, { color: theme.ink }]}>
                  Mode sombre
                </Text>
                <Text style={[styles.description, { color: theme.muted }]}>
                  Une ambiance plus profonde pour une lecture nocturne.
                </Text>
              </View>

              <Switch
                value={darkMode}
                onValueChange={toggleTheme}
                trackColor={{
                  false: theme.line,
                  true: theme.emerald2,
                }}
                thumbColor={darkMode ? theme.gold : theme.white}
              />
            </View>
          </PremiumCard>

          <Text style={[styles.h2, { color: theme.ink }]}>
            Accès rapide
          </Text>

          <View style={styles.grid}>
            <QuickCard
              theme={theme}
              title="Coran"
              subtitle="Lire et rechercher"
              onPress={() => router.push('/quran')}
            />
            <QuickCard
              theme={theme}
              title="Prières"
              subtitle="Horaires et Qibla"
              onPress={() => router.push('/prayer')}
            />
            <QuickCard
              theme={theme}
              title="Mosquées"
              subtitle="Autour de moi"
              onPress={() => router.push('/mosques')}
            />
            <QuickCard
              theme={theme}
              title="Accueil"
              subtitle="Retour au programme"
              onPress={() => router.push('/')}
            />
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerArabic, { color: theme.gold }]}>
              نور · une lumière au quotidien
            </Text>
            <Text style={[styles.footerText, { color: theme.muted }]}>
              Les données de ton profil et ta position de lecture sont
              conservées localement sur cet appareil.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </NourBackground>
  );
}

function QuickCard({
  theme,
  title,
  subtitle,
  onPress,
}: {
  theme: ReturnType<typeof useNour>['theme'];
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.quickCard,
        {
          backgroundColor: theme.card,
          borderColor: theme.line,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <Text style={[styles.quickTitle, { color: theme.ink }]}>
        {title}
      </Text>
      <Text style={[styles.quickSubtitle, { color: theme.muted }]}>
        {subtitle}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 124,
  },
  profile: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 20,
  },
  avatar: {
    width: 82,
    height: 82,
    borderRadius: 30,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: 'Georgia',
    fontSize: 34,
    fontWeight: '700',
  },
  name: {
    fontFamily: 'Georgia',
    fontSize: 30,
    fontWeight: '700',
    marginTop: 12,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 5,
  },
  editButton: {
    marginTop: 14,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },
  editor: {
    width: '100%',
    marginTop: 14,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 15,
    paddingVertical: 13,
    fontSize: 15,
  },
  editorActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryText: {
    fontSize: 12,
    fontWeight: '700',
  },
  primaryButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryText: {
    fontSize: 12,
    fontWeight: '800',
  },
  h2: {
    fontFamily: 'Georgia',
    fontSize: 27,
    fontWeight: '700',
    marginTop: 24,
    marginBottom: 10,
  },
  cardTitle: {
    fontFamily: 'Georgia',
    fontSize: 24,
    fontWeight: '700',
    marginTop: 8,
  },
  cardTitleSmall: {
    fontFamily: 'Georgia',
    fontSize: 18,
    fontWeight: '700',
  },
  description: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
  },
  fullButton: {
    borderRadius: 15,
    alignItems: 'center',
    paddingVertical: 13,
    marginTop: 16,
  },
  fullButtonText: {
    fontSize: 12,
    fontWeight: '800',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  settingText: {
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickCard: {
    width: '48.5%',
    minHeight: 98,
    borderWidth: 1,
    borderRadius: 20,
    padding: 15,
    justifyContent: 'center',
  },
  quickTitle: {
    fontFamily: 'Georgia',
    fontSize: 19,
    fontWeight: '700',
  },
  quickSubtitle: {
    fontSize: 11,
    marginTop: 5,
    lineHeight: 16,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 30,
    paddingBottom: 8,
  },
  footerArabic: {
    fontFamily: 'Georgia',
    fontSize: 17,
  },
  footerText: {
    textAlign: 'center',
    fontSize: 10,
    lineHeight: 16,
    marginTop: 8,
    maxWidth: 320,
  },
});
