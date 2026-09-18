import { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { getDayPeriod } from "../src/utils/timeOfDay";
import { getPalette } from "../src/theme/colors";
import { RafiqatiBubble } from "../src/components/Rafiqati";
import { LESSONS } from "../src/data/lessons";
import {
  getTimeCapsuleMistake,
  markMistakeReviewed,
  loadProgress,
  saveProgress,
  MistakeEntry,
} from "../src/utils/storage";
import { stopSpeaking } from "../src/utils/speech";

// كبسولة الزمن — خطأ قديم (أسبوع فأكثر) يعود إليكِ بشكل مفاجئ لكي تري
// بنفسك أنكِ قد تقدّمتِ. ليست اختبارًا عقابيًا؛ الهدف إحساس "أنا فعلاً ما زلتُ أتذكر هذا".
export default function TimeCapsule() {
  const router = useRouter();
  const palette = getPalette(getDayPeriod());
  const [mistake, setMistake] = useState<MistakeEntry | null | undefined>(undefined);

  useEffect(() => {
    getTimeCapsuleMistake().then(setMistake);
    return () => stopSpeaking();
  }, []);

  async function handleRemembered() {
    if (!mistake) return;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await markMistakeReviewed(mistake.questionId, mistake.date);
    const p = await loadProgress();
    p.xp += 5;
    await saveProgress(p);
    router.replace("/");
  }

  function goReview() {
    if (!mistake) return;
    const target = Object.values(LESSONS).find((l) => l.unitId === mistake.unitId);
    if (target) router.replace(`/lesson/${target.id}`);
    else router.replace("/");
  }

  return (
    <LinearGradient colors={palette.sky} style={styles.fill}>
      {mistake === undefined && <View />}

      {mistake === null && (
        <View style={styles.center}>
          <RafiqatiBubble
            palette={palette}
            mood="happy"
            text="لا توجد كبسولة زمن جاهزة اليوم — ارجعي لاحقًا، لم يحن الوقت بعد."
          />
          <Pressable style={[styles.btn, { borderColor: palette.accent }]} onPress={() => router.replace("/")}>
            <Text style={styles.btnText}>رجوع</Text>
          </Pressable>
        </View>
      )}

      {mistake && (
        <View style={styles.center}>
          <RafiqatiBubble
            palette={palette}
            mood="thinking"
            text={`منذ فترة أخطأتِ في هذا السؤال... حاولي أن تتذكري الإجابة الصحيحة الآن:\n\n"${mistake.question}"`}
          />
          <Pressable
            style={[styles.btn, { borderColor: palette.accent, backgroundColor: palette.accent }]}
            onPress={handleRemembered}
          >
            <Text style={[styles.btnText, { color: "#fff" }]}>تذكرتُ الإجابة الصحيحة</Text>
          </Pressable>
          <Pressable style={[styles.btn, { borderColor: palette.accent }]} onPress={goReview}>
            <Text style={styles.btnText}>أحتاج إلى مراجعة هذا الدرس مرة أخرى</Text>
          </Pressable>
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, paddingTop: 60, paddingHorizontal: 20 },
  center: { flex: 1, justifyContent: "center" },
  btn: { borderWidth: 0.5, borderRadius: 12, padding: 14, alignItems: "center", marginTop: 12 },
  btnText: { fontSize: 14, fontWeight: "500" },
});
