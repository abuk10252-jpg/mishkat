import { useState, useCallback } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { getDayPeriod } from "../src/utils/timeOfDay";
import { getPalette, growthTint } from "../src/theme/colors";
import { Rafiqati } from "../src/components/Rafiqati";
import { loadProgress, Progress, getTimeCapsuleMistake, MistakeEntry } from "../src/utils/storage";
import { LESSON_ORDER } from "../src/data/lessons";

// كل الدروس المتاحة حاليًا، بترتيب أبواب الكتب زي ما وردت في المصادر:
// الطهارة ← الصلاة ← الجنائز ← الصيام. أي درس جديد يتضاف في
// src/data/lessons/index.ts وهيظهر هنا تلقائيًا بترتيبه الصحيح.
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
  const period = getDayPeriod();
  const palette = getPalette(period);

  useFocusEffect(
    useCallback(() => {
      loadProgress().then(setProgress);
      getTimeCapsuleMistake().then(setCapsule);
    }, [])
  );

  const masteryRatio = progress
    ? Object.values(progress.masteryByUnit).reduce((a, b) => a + b, 0) /
      Math.max(1, new Set(LESSON_ORDER.map((l) => l.unitId)).size)
    : 0;

  return (
    <LinearGradient colors={palette.sky} style={styles.fill}>
      <View style={styles.statsRow}>
        <Stat icon="flame-outline" value={progress?.streakDays ?? 0} color={palette.accentDeep} />
        <Stat icon="heart-outline" value={progress?.hearts ?? 5} color={palette.accentDeep} />
        <Stat icon="star-outline" value={progress?.xp ?? 0} color={palette.accentDeep} />
      </View>

      <View style={styles.companionRow}>
        <Rafiqati mood={capsule ? "thinking" : "happy"} palette={palette} size={56} />
        <Text style={[styles.greeting, { color: palette.accentDeep }]}>أهلًا بيك في مشكاة</Text>
      </View>

      {capsule && (
        <Pressable
          style={[styles.capsuleCard, { borderColor: palette.accent }]}
          onPress={() => router.push("/capsule")}
        >
          <Ionicons name="time-outline" size={20} color={palette.accentDeep} />
          <Text style={[styles.capsuleText, { color: palette.accentDeep }]}>
            كبسولة زمن جاهزة — تفتكري ده لسه؟
          </Text>
        </Pressable>
      )}

      <ScrollView contentContainerStyle={styles.path} showsVerticalScrollIndicator={false}>
        {Object.entries(
          LESSON_ORDER.reduce<Record<string, typeof LESSON_ORDER>>((acc, l) => {
            (acc[l.unitId] ??= []).push(l);
            return acc;
          }, {})
        ).map(([unitId, lessons], unitIdx, allUnits) => {
          const prevUnitId = unitIdx > 0 ? allUnits[unitIdx - 1][0] : null;
          const unitUnlocked = !prevUnitId || (progress?.masteryByUnit[prevUnitId] ?? 0) >= 0.6;

          return (
            <View key={unitId} style={styles.unitBlock}>
              <Text style={[styles.unitLabel, { color: palette.accentDeep }]}>
                {UNIT_TITLES[unitId] ?? unitId}
              </Text>
              {lessons.map((lesson, i) => {
                const prevLesson = i > 0 ? lessons[i - 1] : null;
                const done = progress?.completedLessonIds.includes(lesson.id) ?? false;
                const today = new Date().toISOString().slice(0, 10);
                const alreadyStartedNewLessonToday = progress?.lastNewLessonDate === today;
                const lessonUnlocked =
                  unitUnlocked &&
                  (!prevLesson || (progress?.completedLessonIds.includes(prevLesson.id) ?? false)) &&
                  (done || !alreadyStartedNewLessonToday);

                return (
                  <Pressable
                    key={lesson.id}
                    onPress={() => lessonUnlocked && router.push(`/lesson/${lesson.id}`)}
                    style={[
                      styles.node,
                      { backgroundColor: lessonUnlocked ? growthTint(done ? 1 : masteryRatio) : "#00000022" },
                    ]}
                  >
                    <Ionicons
                      name={lessonUnlocked ? (done ? "checkmark-outline" : "leaf-outline") : "lock-closed-outline"}
                      size={22}
                      color="#FFFDFB"
                    />
                    <Text style={styles.nodeLabel} numberOfLines={1}>
                      {lesson.title}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          );
        })}
      </ScrollView>
    </LinearGradient>
  );
}

function Stat({ icon, value, color }: { icon: keyof typeof Ionicons.glyphMap; value: number; color: string }) {
  return (
    <View style={styles.stat}>
      <Ionicons name={icon} size={18} color={color} />
      <Text style={[styles.statText, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, paddingTop: 60, paddingHorizontal: 20 },
  statsRow: { flexDirection: "row-reverse", justifyContent: "space-around", marginBottom: 24 },
  stat: { flexDirection: "row-reverse", alignItems: "center", gap: 4 },
  statText: { fontSize: 14, fontWeight: "500" },
  companionRow: { flexDirection: "row-reverse", alignItems: "center", gap: 10, marginBottom: 16 },
  greeting: { fontSize: 16, fontWeight: "500", writingDirection: "rtl" },
  capsuleCard: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    borderWidth: 0.5,
    borderRadius: 14,
    padding: 12,
    marginBottom: 20,
    backgroundColor: "#ffffffaa",
  },
  capsuleText: { fontSize: 13, writingDirection: "rtl", textAlign: "right", flex: 1 },
  path: { paddingBottom: 40 },
  unitBlock: { marginBottom: 22 },
  unitLabel: { textAlign: "right", marginBottom: 10, fontSize: 14, fontWeight: "600", writingDirection: "rtl" },
  node: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  nodeLabel: { color: "#FFFDFB", fontSize: 13, writingDirection: "rtl", textAlign: "right", flex: 1 },
});
