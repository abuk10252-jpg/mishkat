import { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, Pressable, TextInput, Animated, Easing } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getDayPeriod } from "../../src/utils/timeOfDay";
import { getPalette } from "../../src/theme/colors";
import { RafiqatiBubble } from "../../src/components/Rafiqati";
import { LESSONS } from "../../src/data/lessons";
import { loadProgress, saveProgress, logMistake, Progress, getLearnerName, getCompanionCustomization, CompanionCustomization, DEFAULT_COMPANION_CUSTOMIZATION } from "../../src/utils/storage";
import { playCorrectSound, playWrongSound, playTapSound } from "../../src/utils/sound";
import { speak, stopSpeaking } from "../../src/utils/speech";

type Step = (typeof LESSONS)[string]["steps"][number];

// عشان الدرس يوصل لحوالي ٣٠ دقيقة من غير ما نحشو محتوى تعليمي جديد (حشو
// بيقلل الجودة)، بعد المحتوى الجديد بتاع اليوم بنضيف "جولة مراجعة" —
// أسئلة اتسحبت عشوائيًا من الدروس اللي خلصتها قبل كده. ده فعليًا نفس مبدأ
// "كبسولة الزمن" لكن مكثّف جوه الدرس نفسه: تكرار متباعد (Spaced
// Repetition) بيثبت المعلومة، مش مجرد وقت زيادة.
const REVIEW_TARGET = 18;

function buildReviewRound(currentLessonId: string, completedLessonIds: string[]): Step[] {
  const pool: Step[] = [];
  for (const lid of completedLessonIds) {
    if (lid === currentLessonId) continue;
    const l = LESSONS[lid];
    if (!l) continue;
    for (const s of l.steps as Step[]) {
      if (s.type === "mcq" || s.type === "write") pool.push(s);
    }
  }
  // خلط بسيط (Fisher-Yates) بدل sort العشوائي غير الدقيق
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, REVIEW_TARGET).map((s, i) => ({ ...s, id: `rev-${i}-${s.id}` })) as Step[];
}

export default function Lesson() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const lesson = LESSONS[id as string];
  const palette = getPalette(getDayPeriod());

  const [progress, setProgress] = useState<Progress | null>(null);
  const [steps, setSteps] = useState<Step[]>(lesson ? (lesson.steps as Step[]) : []);
  const [stepIndex, setStepIndex] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [orderPicked, setOrderPicked] = useState<string[]>([]);
  const [writeValue, setWriteValue] = useState("");
  const [writeChecked, setWriteChecked] = useState<null | boolean>(null);
  const [learnerName, setLearnerName] = useState("");
  const [customization, setCustomization] = useState<CompanionCustomization>(DEFAULT_COMPANION_CUSTOMIZATION);
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentOffset = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    if (!lesson) return;
    loadProgress().then((p) => {
      setProgress(p);
      const review = buildReviewRound(lesson.id, p.completedLessonIds);
      if (review.length > 0) {
        setSteps([
          ...(lesson.steps as Step[]),
          {
            type: "teach",
            id: "review-intro",
            text: `خلصنا المحتوى الجديد! دلوقتي جولة مراجعة سريعة (${review.length} سؤال) على اللي درستيه قبل كده — عشان يفضل عالق في دماغك.`,
          } as Step,
          ...review,
        ]);
      }
    });
    getLearnerName().then(setLearnerName);
    getCompanionCustomization().then(setCustomization);
  }, [lesson?.id]);

  if (!lesson) {
    return (
      <View style={styles.center}>
        <Text>الدرس ده غير موجود</Text>
      </View>
    );
  }

  const step = steps[stepIndex] as Step;

  useEffect(() => {
    setAnswered(false);
    setOrderPicked([]);
    setWriteValue("");
    setWriteChecked(null);
    contentOpacity.setValue(0);
    contentOffset.setValue(12);
    Animated.parallel([
      Animated.timing(contentOpacity, { toValue: 1, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(contentOffset, { toValue: 0, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();

    // رفيقتي بتتكلم فعليًا لما يكون عندها نص شرح أو ادّعاء تصحيح
    if (step?.type === "teach") speak((step as any).text, learnerName);
    else if (step?.type === "teachback") speak((step as any).companionClaim, learnerName);
    else if (step?.type === "niyyah") speak("قبل ما نبدأ، خصص هذه اللحظة نية لله في طلب العلم.", learnerName);
    else stopSpeaking();
  }, [stepIndex, learnerName]);

  useEffect(() => {
    return () => stopSpeaking(); // اقفلي الصوت لو المستخدمة خرجت من الدرس فجأة
  }, []);

  async function goNext(correct?: boolean, wrongPayload?: { question: string; qId: string }) {
    if (correct === false && wrongPayload) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      playWrongSound();
      await logMistake({
        questionId: wrongPayload.qId,
        unitId: lesson.unitId,
        question: wrongPayload.question,
        date: new Date().toISOString(),
      });
    } else if (correct === true) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      playCorrectSound();
    } else {
      playTapSound();
    }

    if (stepIndex + 1 >= steps.length) {
      const p = await loadProgress();
      p.xp += 15;
      p.completedLessonIds = Array.from(new Set([...p.completedLessonIds, lesson.id]));
      p.masteryByUnit[lesson.unitId] = Math.min(1, (p.masteryByUnit[lesson.unitId] ?? 0) + 0.34);
      p.lastNewLessonDate = new Date().toISOString().slice(0, 10);
      await saveProgress(p);
      router.replace("/");
    } else {
      setStepIndex((i) => i + 1);
    }
  }

  const progressPct = Math.round(((stepIndex + 1) / steps.length) * 100);

  return (
    <LinearGradient colors={palette.sky} style={styles.fill}>
      <View style={styles.lessonHeader}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-forward" size={20} color={palette.accentDeep} />
        </Pressable>
        <View style={styles.progressMeta}>
          <Text style={[styles.progressLabel, { color: palette.accentDeep }]}>رحلة الدرس</Text>
          <Text style={[styles.progressCount, { color: palette.accentDeep }]}>{stepIndex + 1} من {steps.length}</Text>
        </View>
      </View>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${progressPct}%`, backgroundColor: palette.accent }]} />
      </View>
      {!!(lesson.madhhab || lesson.source) && (
        <View style={[styles.sourceCard, { borderColor: palette.accent + "66", backgroundColor: "#ffffff99" }]}>
          <View style={styles.sourceHeading}>
            <Ionicons name="library-outline" size={17} color={palette.accentDeep} />
            <Text style={[styles.sourceLabel, { color: palette.accentDeep }]}>مسار موثّق</Text>
            {!!lesson.madhhab && <View style={[styles.madhhabPill, { backgroundColor: palette.accent }]}><Text style={styles.madhhabText}>{lesson.madhhab}</Text></View>}
          </View>
          {!!lesson.source && <Text style={[styles.sourceText, { color: palette.accentDeep }]}>{lesson.source}</Text>}
          <Text style={[styles.sourceNote, { color: palette.accentDeep }]}>محتوى تعليمي معاد الصياغة، وليس فتوى شخصية.</Text>
          {!!lesson.sourceUrl && <Pressable onPress={() => {}}><Text style={[styles.sourceLink, { color: palette.accentDeep }]}>مرجع الدرس محفوظ في ملف المصادر</Text></Pressable>}
        </View>
      )}

      <Animated.View style={{ flex: 1, opacity: contentOpacity, transform: [{ translateY: contentOffset }] }}>
      {step.type === "niyyah" && (
        <View style={styles.center}>
          <RafiqatiBubble
            palette={palette}
            mood="encouraging"
            customization={customization}
            text="قبل ما نبدأ، خصص هذه اللحظة نية لله في طلب العلم."
          />
          <Pressable style={[styles.btn, { borderColor: palette.accent }]} onPress={() => goNext()}>
            <Text style={styles.btnText}>ابدأ بسم الله</Text>
          </Pressable>
        </View>
      )}

      {step.type === "teach" && (
        <View>
          <RafiqatiBubble palette={palette} mood="neutral" customization={customization} text={step.text ?? ""} />
          <Pressable style={[styles.btn, { borderColor: palette.accent }]} onPress={() => goNext()}>
            <Text style={styles.btnText}>التالي</Text>
          </Pressable>
        </View>
      )}

      {step.type === "mcq" && (
        <View>
          <Text style={styles.question}>{step.q}</Text>
          {(step.opts ?? []).map((opt: string, i: number) => (
            <Pressable
              key={i}
              disabled={answered}
              onPress={() => {
                setAnswered(true);
                const correct = i === step.correct;
                setTimeout(() => goNext(correct, correct ? undefined : { question: step.q ?? "", qId: step.id ?? "" }), 700);
              }}
              style={[styles.opt, { borderColor: palette.accent }]}
            >
              <Text style={styles.optText}>{opt}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {step.type === "teachback" && (
        <View>
          <RafiqatiBubble palette={palette} mood="thinking" customization={customization} text={step.companionClaim ?? ""} />
          <Text style={styles.hint}>صحح رفيقتك</Text>
          {(step.opts ?? []).map((opt: string, i: number) => (
            <Pressable
              key={i}
              disabled={answered}
              onPress={() => {
                setAnswered(true);
                const correct = i === step.correct;
                setTimeout(
                  () => goNext(correct, correct ? undefined : { question: step.companionClaim ?? "", qId: step.id ?? "" }),
                  700
                );
              }}
              style={[styles.opt, { borderColor: palette.accent }]}
            >
              <Text style={styles.optText}>{opt}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {step.type === "write" && (
        <View>
          <Text style={styles.question}>{step.q}</Text>
          <TextInput
            value={writeValue}
            onChangeText={setWriteValue}
            style={[styles.input, { borderColor: palette.accent }]}
            textAlign="right"
            editable={writeChecked === null}
          />
          {writeChecked === false && <Text style={styles.error}>اكتب إجابة قبل ما تكمل</Text>}
          {writeChecked === null ? (
            <Pressable
              style={[styles.btn, { borderColor: palette.accent }]}
              onPress={() => {
                if (!writeValue.trim()) {
                  setWriteChecked(false);
                  return;
                }
                const ok = (step.acceptableAnswers ?? []).some(
                  (a: string) => a.trim() === writeValue.trim()
                );
                setWriteChecked(ok);
                setTimeout(() => goNext(ok, ok ? undefined : { question: step.q ?? "", qId: step.id ?? "" }), 900);
              }}
            >
              <Text style={styles.btnText}>تأكيد</Text>
            </Pressable>
          ) : null}
        </View>
      )}

      {step.type === "order" && (
        <OrderStep
          step={step}
          palette={palette}
          picked={orderPicked}
          setPicked={setOrderPicked}
          onDone={(ok: boolean) => goNext(ok, ok ? undefined : { question: step.instruction ?? "", qId: step.id ?? "" })}
        />
      )}
      </Animated.View>
    </LinearGradient>
  );
}

function OrderStep({ step, palette, picked, setPicked, onDone }: any) {
  const shuffled = useMemo(
    () => [...step.items].sort(() => 0.5 - Math.random()),
    [step.id]
  );
  return (
    <View>
      <Text style={styles.question}>{step.instruction}</Text>
      {shuffled.map((item: { id: string; label: string }) => (
        <Pressable
          key={item.id}
          disabled={picked.includes(item.id)}
          onPress={() => {
            const next = [...picked, item.id];
            setPicked(next);
            if (next.length === step.items.length) {
              const ok = next.join(",") === step.correctOrder.join(",");
              setTimeout(() => onDone(ok), 500);
            }
          }}
          style={[
            styles.opt,
            { borderColor: palette.accent, opacity: picked.includes(item.id) ? 0.4 : 1 },
          ]}
        >
          <Text style={styles.optText}>{item.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, paddingTop: 52, paddingHorizontal: 20 },
  center: { flex: 1, justifyContent: "center" },
  lessonHeader: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  backButton: { width: 40, height: 40, borderRadius: 14, backgroundColor: "#ffffff88", alignItems: "center", justifyContent: "center" },
  progressMeta: { flexDirection: "row-reverse", alignItems: "baseline", gap: 8 },
  progressLabel: { fontSize: 16, fontWeight: "800", writingDirection: "rtl" },
  progressCount: { fontSize: 10, opacity: 0.65, writingDirection: "rtl" },
  barTrack: { height: 8, borderRadius: 8, backgroundColor: "#00000018", marginBottom: 24, overflow: "hidden" },
  barFill: { height: 6, borderRadius: 6 },
  sourceCard: { borderWidth: 1, borderRadius: 16, padding: 11, marginBottom: 16 },
  sourceHeading: { flexDirection: "row-reverse", alignItems: "center", gap: 6, marginBottom: 5 },
  sourceLabel: { fontSize: 12, fontWeight: "800", writingDirection: "rtl" },
  madhhabPill: { marginLeft: "auto", borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 },
  madhhabText: { color: "#fff", fontSize: 10, fontWeight: "800", writingDirection: "rtl" },
  sourceText: { fontSize: 10, lineHeight: 16, textAlign: "right", writingDirection: "rtl" },
  sourceNote: { fontSize: 9, opacity: 0.65, textAlign: "right", writingDirection: "rtl", marginTop: 4 },
  sourceLink: { fontSize: 9, textAlign: "right", writingDirection: "rtl", marginTop: 4, textDecorationLine: "underline" },
  question: { fontSize: 18, lineHeight: 27, fontWeight: "700", writingDirection: "rtl", textAlign: "right", marginBottom: 18 },
  opt: {
    borderWidth: 0.5,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    backgroundColor: "#ffffffaa",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  optText: { fontSize: 14, writingDirection: "rtl", textAlign: "right" },
  btn: { borderWidth: 0.5, borderRadius: 12, padding: 12, alignItems: "center", marginTop: 8 },
  btnText: { fontSize: 14, fontWeight: "500" },
  hint: { fontSize: 12, writingDirection: "rtl", textAlign: "right", marginBottom: 8, opacity: 0.7 },
  input: {
    borderWidth: 0.5,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    backgroundColor: "#ffffffaa",
    fontSize: 14,
    writingDirection: "rtl",
  },
  error: { color: "#A32D2D", fontSize: 12, marginBottom: 8, textAlign: "right", writingDirection: "rtl" },
});
