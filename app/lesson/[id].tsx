import { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, TextInput } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getDayPeriod } from "../../src/utils/timeOfDay";
import { getPalette } from "../../src/theme/colors";
import { RafiqatiBubble } from "../../src/components/Rafiqati";
import { LESSONS } from "../../src/data/lessons";
import { loadProgress, saveProgress, logMistake, Progress } from "../../src/utils/storage";
import { playCorrectSound, playWrongSound } from "../../src/utils/sound";
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
  return pool.slice(0, REVIEW_TARGET).map((s, i) => ({ ...s, id: `rev-${i}-${s.id}` }));
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

    // رفيقتي بتتكلم فعليًا لما يكون عندها نص شرح أو ادّعاء تصحيح
    if (step?.type === "teach") speak((step as any).text);
    else if (step?.type === "teachback") speak((step as any).companionClaim);
    else if (step?.type === "niyyah") speak("قبل ما نبدأ، خصص هذه اللحظة نية لله في طلب العلم.");
    else stopSpeaking();
  }, [stepIndex]);

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
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${progressPct}%`, backgroundColor: palette.accent }]} />
      </View>

      {step.type === "niyyah" && (
        <View style={styles.center}>
          <RafiqatiBubble
            palette={palette}
            mood="encouraging"
            text="قبل ما نبدأ، خصص هذه اللحظة نية لله في طلب العلم."
          />
          <Pressable style={[styles.btn, { borderColor: palette.accent }]} onPress={() => goNext()}>
            <Text style={styles.btnText}>ابدأ بسم الله</Text>
          </Pressable>
        </View>
      )}

      {step.type === "teach" && (
        <View>
          <RafiqatiBubble palette={palette} mood="neutral" text={step.text} />
          <Pressable style={[styles.btn, { borderColor: palette.accent }]} onPress={() => goNext()}>
            <Text style={styles.btnText}>التالي</Text>
          </Pressable>
        </View>
      )}

      {step.type === "mcq" && (
        <View>
          <Text style={styles.question}>{step.q}</Text>
          {step.opts.map((opt: string, i: number) => (
            <Pressable
              key={i}
              disabled={answered}
              onPress={() => {
                setAnswered(true);
                const correct = i === step.correct;
                setTimeout(() => goNext(correct, correct ? undefined : { question: step.q, qId: step.id }), 700);
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
          <RafiqatiBubble palette={palette} mood="thinking" text={step.companionClaim} />
          <Text style={styles.hint}>صحح رفيقتك</Text>
          {step.opts.map((opt: string, i: number) => (
            <Pressable
              key={i}
              disabled={answered}
              onPress={() => {
                setAnswered(true);
                const correct = i === step.correct;
                setTimeout(
                  () => goNext(correct, correct ? undefined : { question: step.companionClaim, qId: step.id }),
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
                const ok = step.acceptableAnswers.some(
                  (a: string) => a.trim() === writeValue.trim()
                );
                setWriteChecked(ok);
                setTimeout(() => goNext(ok, ok ? undefined : { question: step.q, qId: step.id }), 900);
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
          onDone={(ok: boolean) => goNext(ok, ok ? undefined : { question: step.instruction, qId: step.id })}
        />
      )}
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
  fill: { flex: 1, paddingTop: 60, paddingHorizontal: 20 },
  center: { flex: 1, justifyContent: "center" },
  barTrack: { height: 6, borderRadius: 6, backgroundColor: "#00000022", marginBottom: 24 },
  barFill: { height: 6, borderRadius: 6 },
  question: { fontSize: 15, writingDirection: "rtl", textAlign: "right", marginBottom: 14 },
  opt: {
    borderWidth: 0.5,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    backgroundColor: "#ffffffaa",
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
