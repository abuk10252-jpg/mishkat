import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, Image, Animated } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { getDayPeriod } from "../src/utils/timeOfDay";
import { getPalette, growthTint } from "../src/theme/colors";
import { Rafiqati } from "../src/components/Rafiqati";
import { loadProgress, Progress, getTimeCapsuleMistake, MistakeEntry } from "../src/utils/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LESSON_ORDER, UNIT_ORDER } from "../src/data/lessons";
import { getNextLessonId, hasCompletedToday } from "../src/utils/daily";

const UNIT_TITLES: Record<string, string> = {
  tahara: "كتاب الطهارة",
  salah: "كتاب الصلاة",
  janazah: "باب الجنائز",
  sawm: "كتاب الصيام",
};

export default function Home() {
  const router = useRouter();
  const [progress, setProgress] = useState<Progress | null>(null);
  const [capsule, setCapsule] = useState<MistakeEntry | null>(null);
  const [womenGate, setWomenGate] = useState<boolean | null>(null);
  const period = getDayPeriod();
  const palette = getPalette(period);
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    AsyncStorage.getItem("mishkat:women_gate").then((v) => setWomenGate(v === "accepted"));
  }, []);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: -5, duration: 1800, useNativeDriver: true }),
        Animated.timing(float, { toValue: 0, duration: 1800, useNativeDriver: true }),
      ])
    ).start();
  }, [float]);

  useFocusEffect(
    useCallback(() => {
      loadProgress().then(setProgress);
      getTimeCapsuleMistake().then(setCapsule);
    }, [])
  );

  const nextLessonId = progress ? getNextLessonId(progress) : null;
  const nextLesson = LESSON_ORDER.find((l) => l.id === nextLessonId) ?? null;
  const doneToday = progress ? hasCompletedToday(progress) : false;
  const completedCount = progress?.completedLessonIds.length ?? 0;
  const totalCount = LESSON_ORDER.length;
  const grouped = useMemo(
    () => LESSON_ORDER.reduce<Record<string, typeof LESSON_ORDER>>((acc, lesson) => {
      (acc[lesson.unitId] ??= []).push(lesson);
      return acc;
    }, {}),
    []
  );

  if (womenGate === null) {
    return <LinearGradient colors={palette.sky} style={styles.gate}><Image source={require("../assets/mishkat-logo.png")} style={styles.gateLogo} /><Rafiqati palette={palette} mood="encouraging" size={150} showMoodIcon={false} /><Text style={[styles.gateTitle,{color:palette.text}]}>مشكاة للنساء فقط</Text><Text style={[styles.gateText,{color:palette.muted}]}>مساحة تعليمية مخصصة للنساء لتعلّم الفقه بأسلوب تفاعلي هادئ.</Text><Pressable style={[styles.primaryBtn,{backgroundColor:palette.accent}]} onPress={async()=>{await AsyncStorage.setItem("mishkat:women_gate","accepted");setWomenGate(true)}}><Text style={styles.primaryText}>دخول مشكاة</Text><Ionicons name="arrow-back" size={19} color="#fff" /></Pressable></LinearGradient>;
  }

  return (
    <LinearGradient colors={palette.sky} style={styles.fill}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <Image source={require("../assets/mishkat-logo.png")} style={styles.logo} />
            <View>
              <Text style={[styles.brand, { color: palette.accentDeep }]}>مشكاة</Text>
              <Text style={[styles.tagline, { color: palette.muted }]}>رفيقة يومية في طريق العلم — للنساء فقط</Text>
            </View>
          </View>
          <View style={styles.statsRow}>
            <Stat icon="flame" value={progress?.streakDays ?? 0} color={palette.accentDeep} />
            <Stat icon="heart" value={progress?.hearts ?? 5} color={palette.danger} />
            <Stat icon="star" value={progress?.xp ?? 0} color={palette.accentDeep} />
          </View>
        </View>

        <Animated.View style={{ transform: [{ translateY: float }] }}>
          <View style={[styles.dailyCard, { backgroundColor: palette.surface }]}>
            <View style={styles.dailyCopy}>
              <View style={styles.pill}>
                <Ionicons name="sunny-outline" size={14} color={palette.accentDeep} />
                <Text style={[styles.pillText, { color: palette.accentDeep }]}>درس اليوم</Text>
              </View>
              <Text style={[styles.dailyTitle, { color: palette.text }]}>رحلتك اليوم</Text>
              <Text style={[styles.dailySub, { color: palette.muted }]}>درس واحد فقط كل يوم — تعلّم، تفاعل، ثم ارجع غدًا.</Text>
              {nextLesson ? (
                <Text style={[styles.lessonName, { color: palette.accentDeep }]} numberOfLines={2}>{nextLesson.title}</Text>
              ) : (
                <Text style={[styles.lessonName, { color: palette.accentDeep }]}>أكملتِ المنهج الحالي</Text>
              )}
              <View style={styles.metaRow}>
                <Ionicons name="time-outline" size={15} color={palette.muted} />
                <Text style={[styles.metaText, { color: palette.muted }]}>جلسة اليوم • 20 دقيقة</Text>
              </View>
              {nextLesson && !doneToday ? (
                <Pressable
                  style={[styles.primaryBtn, { backgroundColor: palette.accent }]}
                  onPress={() => router.push(`/lesson/${nextLesson.id}`)}
                >
                  <Text style={styles.primaryText}>ابدئي درس اليوم</Text>
                  <Ionicons name="arrow-back" size={19} color="#fff" />
                </Pressable>
              ) : (
                <View style={[styles.completeBanner, { backgroundColor: `${palette.success}18`, borderColor: `${palette.success}55` }]}>
                  <Ionicons name="checkmark-circle" size={22} color={palette.success} />
                  <Text style={[styles.completeText, { color: palette.success }]}>درس اليوم اكتمل — نلتقي غدًا</Text>
                </View>
              )}
            </View>
            <View style={styles.heroCharacter}>
              <Rafiqati mood={doneToday ? "happy" : "encouraging"} palette={palette} size={118} showMoodIcon={false} />
            </View>
          </View>
        </Animated.View>

        <View style={styles.progressHeader}>
          <Text style={[styles.sectionTitle, { color: palette.text }]}>رحلة الإتقان</Text>
          <Text style={[styles.progressLabel, { color: palette.muted }]}>{completedCount}/{totalCount} دروس</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.round((completedCount / Math.max(1, totalCount)) * 100)}%`, backgroundColor: palette.accent }]} />
        </View>

        {capsule && (
          <Pressable style={[styles.capsuleCard, { backgroundColor: palette.surface, borderColor: `${palette.accent}55` }]} onPress={() => router.push("/capsule")}>
            <View style={[styles.capsuleIcon, { backgroundColor: `${palette.accent}18` }]}>
              <Ionicons name="time-outline" size={22} color={palette.accentDeep} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.capsuleTitle, { color: palette.text }]}>كبسولة زمن</Text>
              <Text style={[styles.capsuleText, { color: palette.muted }]}>رفيقتي محتفظة بسؤال قديم لكِ. راجعيه الآن.</Text>
            </View>
            <Ionicons name="chevron-back" size={20} color={palette.muted} />
          </Pressable>
        )}

        <Text style={[styles.sectionTitle, { color: palette.text, marginTop: 20 }]}>مسار الكتب</Text>
        {Object.entries(grouped).map(([unitId, lessons], unitIdx) => {
          const prevUnitId = unitIdx > 0 ? UNIT_ORDER[unitIdx - 1] : null;
          const unitUnlocked = !prevUnitId || (progress?.masteryByUnit[prevUnitId] ?? 0) >= 0.6;
          return (
            <View key={unitId} style={styles.unitBlock}>
              <Text style={[styles.unitLabel, { color: palette.accentDeep }]}>{UNIT_TITLES[unitId] ?? unitId}</Text>
              {lessons.map((lesson, i) => {
                const done = progress?.completedLessonIds.includes(lesson.id) ?? false;
                const isNext = lesson.id === nextLessonId;
                const lockedByDaily = isNext && doneToday;
                const unlocked = unitUnlocked && (done || isNext) && !lockedByDaily;
                return (
                  <Pressable
                    key={lesson.id}
                    onPress={() => unlocked && router.push(`/lesson/${lesson.id}`)}
                    style={[styles.node, { backgroundColor: done ? `${palette.accent}18` : palette.surface, borderColor: isNext && !done ? palette.accent : "#00000008", opacity: unlocked || done ? 1 : 0.55 }]}
                  >
                    <View style={[styles.nodeIcon, { backgroundColor: done ? palette.success : isNext ? palette.accent : "#00000012" }]}>
                      <Ionicons name={done ? "checkmark" : isNext ? "play" : "lock-closed"} size={17} color={done || isNext ? "#fff" : palette.muted} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.nodeLabel, { color: palette.text }]} numberOfLines={1}>{lesson.title}</Text>
                      <Text style={[styles.nodeSub, { color: palette.muted }]}>{done ? "مكتمل" : isNext ? "درس اليوم" : "يفتح مع تقدمك"}</Text>
                    </View>
                    <Ionicons name="chevron-back" size={18} color={palette.muted} />
                  </Pressable>
                );
              })}
            </View>
          );
        })}

        <View style={[styles.footerCard, { backgroundColor: palette.surface }]}>
          <Rafiqati palette={palette} mood="happy" size={64} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.footerTitle, { color: palette.text }]}>رفيقتي معاك في كل خطوة</Text>
            <Text style={[styles.footerText, { color: palette.muted }]}>تشرح، تسأل، تخطئ أحيانًا، وتتعلم معك.</Text>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

function Stat({ icon, value, color }: { icon: keyof typeof Ionicons.glyphMap; value: number; color: string }) {
  return (
    <View style={styles.stat}>
      <Ionicons name={icon} size={17} color={color} />
      <Text style={[styles.statText, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  gate: { flex: 1, alignItems: "center", justifyContent: "center", padding: 28 },
  gateLogo: { width: 104, height: 104, borderRadius: 30, marginBottom: 8 },
  gateTitle: { fontSize: 27, fontWeight: "900", marginTop: 4, textAlign: "center" },
  gateText: { fontSize: 14, lineHeight: 24, textAlign: "center", marginTop: 10, marginBottom: 22, maxWidth: 360 },
  scroll: { paddingTop: 54, paddingHorizontal: 18, paddingBottom: 40 },
  header: { marginBottom: 18 },
  brandRow: { flexDirection: "row-reverse", alignItems: "center", gap: 10, justifyContent: "space-between" },
  logo: { width: 62, height: 62, borderRadius: 20 },
  brand: { fontSize: 27, fontWeight: "800", textAlign: "right" },
  tagline: { fontSize: 11, marginTop: 2, textAlign: "right" },
  statsRow: { flexDirection: "row-reverse", justifyContent: "flex-start", gap: 9, marginTop: 12 },
  stat: { flexDirection: "row-reverse", alignItems: "center", gap: 5, backgroundColor: "#ffffff80", paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999 },
  statText: { fontSize: 13, fontWeight: "700" },
  dailyCard: { minHeight: 235, borderRadius: 28, padding: 18, flexDirection: "row-reverse", overflow: "hidden", shadowOpacity: 0.08, shadowRadius: 18, elevation: 4 },
  dailyCopy: { flex: 1, alignItems: "flex-end" },
  heroCharacter: { width: 125, alignItems: "center", justifyContent: "flex-end", paddingTop: 28 },
  pill: { flexDirection: "row-reverse", gap: 5, alignItems: "center", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: "#F7E7EE", marginBottom: 9 },
  pillText: { fontSize: 11, fontWeight: "800" },
  dailyTitle: { fontSize: 21, fontWeight: "800", textAlign: "right" },
  dailySub: { fontSize: 12, lineHeight: 18, textAlign: "right", marginTop: 4 },
  lessonName: { fontSize: 15, fontWeight: "800", textAlign: "right", marginTop: 8 },
  metaRow: { flexDirection: "row-reverse", alignItems: "center", gap: 5, marginTop: 7 },
  metaText: { fontSize: 11 },
  primaryBtn: { marginTop: 12, borderRadius: 14, paddingVertical: 11, paddingHorizontal: 15, flexDirection: "row-reverse", alignItems: "center", gap: 8 },
  primaryText: { color: "#fff", fontWeight: "800", fontSize: 13 },
  completeBanner: { marginTop: 12, borderWidth: 1, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 10, flexDirection: "row-reverse", alignItems: "center", gap: 7 },
  completeText: { fontSize: 11, fontWeight: "700", textAlign: "right", flex: 1 },
  progressHeader: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", marginTop: 22, marginBottom: 7 },
  sectionTitle: { fontSize: 17, fontWeight: "800", textAlign: "right" },
  progressLabel: { fontSize: 11 },
  progressTrack: { height: 8, borderRadius: 999, backgroundColor: "#00000010", overflow: "hidden", marginBottom: 4 },
  progressFill: { height: "100%", borderRadius: 999 },
  capsuleCard: { marginTop: 14, borderWidth: 1, borderRadius: 18, padding: 12, flexDirection: "row-reverse", alignItems: "center", gap: 10 },
  capsuleIcon: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  capsuleTitle: { fontSize: 13, fontWeight: "800", textAlign: "right" },
  capsuleText: { fontSize: 11, lineHeight: 17, textAlign: "right", marginTop: 2 },
  unitBlock: { marginTop: 13 },
  unitLabel: { fontSize: 13, fontWeight: "800", textAlign: "right", marginBottom: 8 },
  node: { minHeight: 62, borderWidth: 1, borderRadius: 18, paddingHorizontal: 12, marginBottom: 8, flexDirection: "row-reverse", alignItems: "center", gap: 10 },
  nodeIcon: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  nodeLabel: { fontSize: 13, fontWeight: "700", textAlign: "right" },
  nodeSub: { fontSize: 10, textAlign: "right", marginTop: 2 },
  footerCard: { marginTop: 22, borderRadius: 20, padding: 12, flexDirection: "row-reverse", alignItems: "center", gap: 9 },
  footerTitle: { fontSize: 12, fontWeight: "800", textAlign: "right" },
  footerText: { fontSize: 10, lineHeight: 16, textAlign: "right", marginTop: 2 },
});
