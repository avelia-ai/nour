import React, { useEffect, useState } from 'react';
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
import { router } from 'expo-router';

import { NourBackground } from '@/components/NourBackground';
import { PremiumCard } from '@/components/PremiumCard';
import { useNour } from './_layout';

import {
  getNourProgress,
  saveNourLearningProfile,
  type NourGoal,
  type NourLearningLevel,
} from '@/lib/nour-progress';

import { getSurah } from '@/lib/quran';

type Question = {
  prompt: string;
  options: string[];
  correctIndex: number;
  helper?: string;
};

const GOALS: {
  id: NourGoal;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
}[] = [
  {
    id: 'read',
    icon: 'book-outline',
    title: 'Lire le Coran',
    subtitle: 'Lire avec plus de régularité et de fluidité',
  },
  {
    id: 'memorize',
    icon: 'bookmark-outline',
    title: 'Mémoriser',
    subtitle: 'Construire une mémorisation progressive',
  },
  {
    id: 'recitation',
    icon: 'mic-outline',
    title: 'Améliorer ma récitation',
    subtitle: 'Travailler précision et tajwid',
  },
  {
    id: 'arabic',
    icon: 'school-outline',
    title: 'Apprendre l’arabe coranique',
    subtitle: 'Comprendre les mots et structures essentiels',
  },
  {
    id: 'understand',
    icon: 'bulb-outline',
    title: 'Comprendre le Coran',
    subtitle: 'Approfondir le sens de ce que je lis',
  },
  {
    id: 'everything',
    icon: 'star-outline',
    title: 'Tout apprendre',
    subtitle: 'Construire un parcours complet',
  },
];

const TIMES: (5 | 10 | 20 | 30)[] = [5, 10, 20, 30];

export default function Onboarding() {
  const { theme } = useNour();

  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState<NourGoal>('read');
  const [dailyMinutes, setDailyMinutes] = useState<5 | 10 | 20 | 30>(10);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [loadingDiagnostic, setLoadingDiagnostic] = useState(false);
  const [diagnosticError, setDiagnosticError] = useState('');
  const [diagnosticRetry, setDiagnosticRetry] = useState(0);

  const [learningLevel, setLearningLevel] =
    useState<NourLearningLevel | null>(null);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getNourProgress()
      .then((progress) => {
        if (progress.goal) setGoal(progress.goal);
        if (progress.dailyMinutes) setDailyMinutes(progress.dailyMinutes);
        if (progress.learningLevel) setLearningLevel(progress.learningLevel);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (step !== 1 || questions.length > 0) {
      return;
    }

    let active = true;

    async function loadDiagnostic() {
      try {
        setLoadingDiagnostic(true);
        setDiagnosticError('');

        const surah = await getSurah(1);

        if (!active) return;

        const ayah1 = surah.ayahs[0];
        const ayah2 = surah.ayahs[1];
        const ayah7 = surah.ayahs[6];

        if (!ayah1 || !ayah2 || !ayah7) {
          throw new Error('Versets nécessaires indisponibles.');
        }

        const translation1 = surah.translations[0];
        const translation2 = surah.translations[1];
        const translation7 = surah.translations[6];

        if (!translation1 || !translation2 || !translation7) {
          throw new Error('Traductions nécessaires indisponibles.');
        }

        const words2 = ayah2.text.trim().split(/\s+/);
        const words7 = ayah7.text.trim().split(/\s+/);

        if (words2.length < 3 || words7.length < 3) {
          throw new Error('Données de diagnostic insuffisantes.');
        }

        const q3Prefix = words2.slice(0, 2).join(' ');
        const q3Correct = words2[2];

        const q4Prefix = words7.slice(0, 2).join(' ');
        const q4Correct = words7[2];

        const q3Distractors = [
          words7[2],
          words2[3] ?? words2[1],
          words7[3] ?? words7[1],
        ];

        const q4Distractors = [
          words7[3] ?? words7[1],
          words2[2],
          words2[3] ?? words2[1],
        ];

        const builtQuestions: Question[] = [
          {
            prompt: 'Quelle traduction correspond à ce verset ?',
            options: [
              translation7.text,
              translation1.text,
              translation2.text,
            ],
            correctIndex: 1,
            helper: ayah1.text,
          },
          {
            prompt: 'Quel texte arabe correspond à cette traduction ?',
            options: [
              ayah1.text,
              ayah7.text,
              ayah2.text,
            ],
            correctIndex: 2,
            helper: translation2.text,
          },
          {
            prompt: 'Quel mot complète correctement ce passage ?',
            options: [
              q3Distractors[0],
              q3Distractors[1],
              q3Distractors[2],
              q3Correct,
            ],
            correctIndex: 3,
            helper: q3Prefix,
          },
          {
            prompt: 'Quel mot complète correctement ce passage ?',
            options: [
              q4Distractors[0],
              q4Correct,
              q4Distractors[1],
              q4Distractors[2],
            ],
            correctIndex: 1,
            helper: q4Prefix,
          },
        ];

        setQuestions(builtQuestions);
      } catch (error) {
        if (!active) return;

        setDiagnosticError(
          error instanceof Error
            ? error.message
            : 'Impossible de préparer votre évaluation.',
        );
      } finally {
        if (active) {
          setLoadingDiagnostic(false);
        }
      }
    }

    loadDiagnostic();

    return () => {
      active = false;
    };
  }, [step, questions.length, diagnosticRetry]);

  function chooseAnswer(questionIndex: number, answerIndex: number) {
    setAnswers((current) => ({
      ...current,
      [questionIndex]: answerIndex,
    }));
  }

  function evaluateLevel(): NourLearningLevel {
    const score = questions.reduce(
      (total, question, index) =>
        total + (answers[index] === question.correctIndex ? 1 : 0),
      0,
    );

    if (score <= 1) return 'beginner';
    if (score <= 3) return 'intermediate';
    return 'advanced';
  }

  function validateDiagnostic() {
    if (Object.keys(answers).length !== questions.length) {
      return;
    }

    setLearningLevel(evaluateLevel());
    setStep(2);
  }

  async function finish() {
    if (!learningLevel) {
      return;
    }

    try {
      setSaving(true);

      await saveNourLearningProfile(
        goal,
        learningLevel,
        dailyMinutes,
      );

      router.replace('/');
    } finally {
      setSaving(false);
    }
  }

  const answered = Object.keys(answers).length;
  const title =
    step === 0
      ? 'Où veux-tu aller ?'
      : step === 1
        ? 'Mesurons ton point de départ.'
        : 'Combien de temps peux-tu consacrer ?';

  const subtitle =
    step === 0
      ? 'Nour construira ton parcours autour de cet objectif.'
      : step === 1
        ? '4 questions courtes basées sur le Coran. Ce test mesure ta reconnaissance de lecture et ta mémoire de départ.'
        : 'Nour adaptera la cadence quotidienne à ton temps réel.';

  return (
    <NourBackground theme={theme}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Pressable
            onPress={() =>
              step === 0
                ? router.back()
                : setStep((value) => value - 1)
            }
            style={styles.back}
          >
            <Ionicons
              name="chevron-back"
              size={20}
              color={theme.ink}
            />
            <Text style={[styles.backText, { color: theme.ink }]}>
              Retour
            </Text>
          </Pressable>

          <Text style={[styles.eyebrow, { color: theme.gold }]}>
            TON PROFIL NOUR
          </Text>

          <Text style={[styles.title, { color: theme.ink }]}>
            {title}
          </Text>

          <Text style={[styles.subtitle, { color: theme.muted }]}>
            {subtitle}
          </Text>

          <View style={styles.steps}>
            {[0, 1, 2].map((item) => (
              <View
                key={item}
                style={[
                  styles.stepDot,
                  {
                    backgroundColor:
                      item <= step ? theme.gold : theme.line,
                  },
                ]}
              />
            ))}
          </View>

          {step === 0 ? (
            <View style={styles.list}>
              {GOALS.map((item) => {
                const selected = goal === item.id;

                return (
                  <Pressable
                    key={item.id}
                    onPress={() => setGoal(item.id)}
                    style={[
                      styles.option,
                      {
                        backgroundColor: selected
                          ? theme.card2
                          : theme.card,
                        borderColor: selected
                          ? theme.gold
                          : theme.line,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.icon,
                        { backgroundColor: theme.card2 },
                      ]}
                    >
                      <Ionicons
                        name={item.icon}
                        size={20}
                        color={theme.emerald}
                      />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.optionTitle,
                          { color: theme.ink },
                        ]}
                      >
                        {item.title}
                      </Text>

                      <Text
                        style={[
                          styles.optionSubtitle,
                          { color: theme.muted },
                        ]}
                      >
                        {item.subtitle}
                      </Text>
                    </View>

                    <Ionicons
                      name={
                        selected
                          ? 'checkmark-circle'
                          : 'ellipse-outline'
                      }
                      size={21}
                      color={
                        selected ? theme.gold : theme.muted
                      }
                    />
                  </Pressable>
                );
              })}
            </View>
          ) : step === 1 ? (
            <View>
              {loadingDiagnostic ? (
                <PremiumCard
                  theme={theme}
                  style={styles.loadingCard}
                >
                  <ActivityIndicator
                    size="small"
                    color={theme.gold}
                  />
                  <Text
                    style={[
                      styles.loadingText,
                      { color: theme.muted },
                    ]}
                  >
                    Préparation de ton évaluation…
                  </Text>
                </PremiumCard>
              ) : diagnosticError ? (
                <PremiumCard
                  theme={theme}
                  style={styles.errorCard}
                >
                  <Text
                    style={[
                      styles.optionTitle,
                      { color: theme.ink },
                    ]}
                  >
                    Évaluation indisponible
                  </Text>

                  <Text
                    style={[
                      styles.optionSubtitle,
                      { color: theme.muted },
                    ]}
                  >
                    {diagnosticError}
                  </Text>

                  <Pressable
                    onPress={() => {
                      setQuestions([]);
                      setDiagnosticError('');
                      setDiagnosticRetry((value) => value + 1);
                    }}
                    style={[
                      styles.retry,
                      { backgroundColor: theme.emerald },
                    ]}
                  >
                    <Text
                      style={[
                        styles.ctaText,
                        { color: theme.white },
                      ]}
                    >
                      Réessayer
                    </Text>
                  </Pressable>
                </PremiumCard>
              ) : (
                <>
                  <View style={styles.testMeta}>
                    <Text
                      style={[
                        styles.testCounter,
                        { color: theme.gold },
                      ]}
                    >
                      {answered} / {questions.length}
                    </Text>

                    <Text
                      style={[
                        styles.testHint,
                        { color: theme.muted },
                      ]}
                    >
                      Pas de chronomètre
                    </Text>
                  </View>

                  <View style={styles.questionList}>
                    {questions.map((question, questionIndex) => {
                      const selectedAnswer =
                        answers[questionIndex];

                      return (
                        <PremiumCard
                          key={`${question.prompt}-${questionIndex}`}
                          theme={theme}
                          style={styles.questionCard}
                        >
                          <Text
                            style={[
                              styles.questionNumber,
                              { color: theme.gold },
                            ]}
                          >
                            QUESTION {questionIndex + 1}
                          </Text>

                          <Text
                            style={[
                              styles.questionTitle,
                              { color: theme.ink },
                            ]}
                          >
                            {question.prompt}
                          </Text>

                          {question.helper ? (
                            <Text
                              style={[
                                styles.helper,
                                {
                                  color: theme.ink,
                                  writingDirection:
                                    question.helper.includes(' ')
                                      ? undefined
                                      : 'rtl',
                                },
                              ]}
                            >
                              {question.helper}
                            </Text>
                          ) : null}

                          <View style={styles.answers}>
                            {question.options.map(
                              (option, optionIndex) => {
                                const selected =
                                  selectedAnswer === optionIndex;

                                return (
                                  <Pressable
                                    key={`${option}-${optionIndex}`}
                                    onPress={() =>
                                      chooseAnswer(
                                        questionIndex,
                                        optionIndex,
                                      )
                                    }
                                    style={[
                                      styles.answer,
                                      {
                                        backgroundColor: selected
                                          ? theme.card2
                                          : theme.card,
                                        borderColor: selected
                                          ? theme.gold
                                          : theme.line,
                                      },
                                    ]}
                                  >
                                    <View
                                      style={[
                                        styles.answerBullet,
                                        {
                                          backgroundColor:
                                            selected
                                              ? theme.gold
                                              : theme.line,
                                        },
                                      ]}
                                    />

                                    <Text
                                      style={[
                                        styles.answerText,
                                        {
                                          color: theme.ink,
                                          writingDirection:
                                            questionIndex >= 2
                                              ? 'rtl'
                                              : undefined,
                                        },
                                      ]}
                                    >
                                      {option}
                                    </Text>
                                  </Pressable>
                                );
                              },
                            )}
                          </View>
                        </PremiumCard>
                      );
                    })}
                  </View>
                </>
              )}
            </View>
          ) : (
            <>
              <PremiumCard theme={theme} style={styles.resultCard}>
                <Text
                  style={[
                    styles.resultKicker,
                    { color: theme.gold },
                  ]}
                >
                  TON POINT DE DÉPART
                </Text>

                <Text
                  style={[
                    styles.resultTitle,
                    { color: theme.ink },
                  ]}
                >
                  {learningLevel === 'advanced'
                    ? 'Avancé'
                    : learningLevel === 'intermediate'
                      ? 'Intermédiaire'
                      : 'Débutant'}
                </Text>

                <Text
                  style={[
                    styles.resultText,
                    { color: theme.muted },
                  ]}
                >
                  Nour utilisera ce niveau pour éviter de te faire
                  recommencer inutilement certaines étapes.
                </Text>
              </PremiumCard>

              <View style={styles.timeGrid}>
                {TIMES.map((minutes) => {
                  const selected = dailyMinutes === minutes;

                  return (
                    <Pressable
                      key={minutes}
                      onPress={() => setDailyMinutes(minutes)}
                      style={[
                        styles.timeCard,
                        {
                          backgroundColor: selected
                            ? theme.card2
                            : theme.card,
                          borderColor: selected
                            ? theme.gold
                            : theme.line,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.timeNumber,
                          {
                            color: selected
                              ? theme.gold
                              : theme.ink,
                          },
                        ]}
                      >
                        {minutes}
                      </Text>

                      <Text
                        style={[
                          styles.timeLabel,
                          { color: theme.muted },
                        ]}
                      >
                        minutes / jour
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
          )}

          <Pressable
            onPress={() => {
              if (step === 0) {
                setStep(1);
                return;
              }

              if (step === 1) {
                validateDiagnostic();
                return;
              }

              finish();
            }}
            disabled={
              saving ||
              loadingDiagnostic ||
              (step === 1 &&
                (questions.length === 0 ||
                  answered !== questions.length)) ||
              (step === 1 && Boolean(diagnosticError))
            }
            style={[
              styles.cta,
              {
                backgroundColor: theme.emerald,
                opacity:
                  saving ||
                  loadingDiagnostic ||
                  (step === 1 &&
                    (questions.length === 0 ||
                      answered !== questions.length))
                    ? 0.45
                    : 1,
              },
            ]}
          >
            <Text
              style={[styles.ctaText, { color: theme.white }]}
            >
              {step === 2
                ? saving
                  ? 'Création…'
                  : 'Créer mon parcours'
                : step === 1
                  ? 'Évaluer mon niveau'
                  : 'Continuer'}
            </Text>

            <Ionicons
              name="arrow-forward"
              size={18}
              color={theme.white}
            />
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </NourBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 18,
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
    letterSpacing: 1.7,
  },
  title: {
    marginTop: 8,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '900',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
  },
  steps: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 22,
    marginBottom: 18,
  },
  stepDot: {
    height: 4,
    flex: 1,
    borderRadius: 4,
  },
  list: {
    gap: 10,
  },
  option: {
    minHeight: 76,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  icon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '900',
  },
  optionSubtitle: {
    marginTop: 3,
    fontSize: 11,
    lineHeight: 16,
  },
  loadingCard: {
    minHeight: 130,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 12,
    fontWeight: '700',
  },
  errorCard: {
    padding: 16,
  },
  retry: {
    minHeight: 44,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  testMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  testCounter: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  testHint: {
    fontSize: 11,
    fontWeight: '700',
  },
  questionList: {
    gap: 12,
  },
  questionCard: {
    padding: 15,
  },
  questionNumber: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.4,
  },
  questionTitle: {
    marginTop: 7,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '900',
  },
  helper: {
    marginTop: 12,
    fontSize: 18,
    lineHeight: 31,
    textAlign: 'right',
    fontWeight: '700',
  },
  answers: {
    gap: 8,
    marginTop: 15,
  },
  answer: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  answerBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  answerText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
  },
  resultCard: {
    padding: 18,
    marginBottom: 14,
  },
  resultKicker: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  resultTitle: {
    marginTop: 7,
    fontSize: 26,
    fontWeight: '900',
  },
  resultText: {
    marginTop: 7,
    fontSize: 12,
    lineHeight: 19,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  timeCard: {
    width: '48%',
    minHeight: 105,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeNumber: {
    fontSize: 30,
    fontWeight: '900',
  },
  timeLabel: {
    marginTop: 3,
    fontSize: 11,
    fontWeight: '700',
  },
  cta: {
    minHeight: 52,
    borderRadius: 16,
    marginTop: 24,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ctaText: {
    fontSize: 13,
    fontWeight: '900',
  },
});
