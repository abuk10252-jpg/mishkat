import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, Animated, Easing, Modal, TextInput, KeyboardAvoidingView, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { getDayPeriod } from "../src/utils/timeOfDay";
import { getPalette, growthTint } from "../src/theme/colors";
import { Rafiqati } from "../src/components/Rafiqati";
import { loadProgress, Progress, getTimeCapsuleMistake, MistakeEntry, getLearnerName, saveLearnerName, CompanionCustomization, DEFAULT_COMPANION_CUSTOMIZATION, getCompanionCustomization, saveCompanionCustomization } from "../src/utils/storage";
import { prepareSpeech, speak } from "../src/utils/speech";
import { playTapSound } from "../src/utils/sound";
import { LESSON_ORDER } from "../src/data/lessons";

const UNIT_TITLES: Record<string, string> = {
  libas: "اللباس والزينة",
  tahara: "كتاب الطهارة",
  salah: "كتاب الصلاة",
  janazah: "باب الجنائز",
  sawm: "كتاب الصيام",
  zakat: "كتاب الزكاة",
  hajj: "الحج والعمرة",
  family: "النكاح والأسرة",
  muamalat: "المعاملات والآداب",
  ikhtilaf: "أدب الخلاف الفقهي",
  challenge: "التحهذه النهائي",
};

const DAILY_XP_GOAL = 30;

export default function Home() {
  const router = useRouter();
  const [progress, setProgress] = useState<Progress | null>(null);
  const [capsule, setCapsule] = useState<MistakeEntry | null>(null);
  const [learnerName, setLearnerName] = useState("");
  const [nameDraft, setNameDraft] = useState("");
  const [nameModalVisible, setNameModalVisible] = useState(false);
  const [customization, setCustomization] = useState<CompanionCustomization>(DEFAULT_COMPANION_CUSTOMIZATION);
  const [customizeVisible, setCustomizeVisible] = useState(false);
  const period = getDayPeriod();
  const palette = getPalette(period);
  const intro = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      loadProgress().then(setProgress);
      getTimeCapsuleMistake().then(setCapsule);
      getLearnerName().then((name) => { setLearnerName(name); if (!name) setNameModalVisible(true); });
      prepareSpeech();
      getCompanionCustomization().then(setCustomization);
    }, [])
  );

  useEffect(() => {
    Animated.timing(intro, { toValue: 1, duration: 650, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [intro]);

  const masteryRatio = progress
    ? Object.values(progress.masteryByUnit).reduce((a, b) => a + b, 0) /
      Math.max(1, new Set(LESSON_ORDER.map((l) => l.unitId)).size)
    : 0;
  const completedCount = progress?.completedLessonIds.length ?? 0;
  const dailyXp = progress?.xp ? progress.xp % (DAILY_XP_GOAL + 15) : 0;
  const dailyProgress = Math.min(1, dailyXp / DAILY_XP_GOAL);
  const nextLesson = LESSON_ORDER.find((lesson) => !progress?.completedLessonIds.includes(lesson.id));

  return (
    <LinearGradient colors={palette.sky} style={styles.fill}>
      <Animated.View style={{ flex: 1, opacity: intro, transform: [{ translateY: intro.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }] }}>
        <View style={styles.topBar}>
          <View style={styles.brandRow}>
            <View style={[styles.logo, { backgroundColor: palette.accent }]}><Ionicons name="sparkles" size={18} color="#fff" /></View>
            <View>
              <Text style={[styles.brand, { color: palette.accentDeep }]}>{learnerName ? `أهلًا ${learnerName}` : "مِشكاة"}</Text>
              <Text style={[styles.subtitle, { color: palette.accentDeep }]}>رحلة علمٍ بنورٍ هادئ</Text>
            </View>
          </View>
          <View style={styles.topActions}>
            <Pressable style={styles.iconButton} onPress={() => setCustomizeVisible(true)}><Ionicons name="color-palette-outline" size={22} color={palette.accentDeep} /></Pressable>
            <Pressable style={styles.iconButton} onPress={() => router.push("/capsule")}><Ionicons name="time-outline" size={22} color={palette.accentDeep} /></Pressable>
          </View>
        </View>

        <View style={styles.statsRow}>
          <Stat icon="flame" label="أيام متتالية" value={progress?.streakDays ?? 0} color={palette.accentDeep} />
          <Stat icon="heart" label="قلوب" value={progress?.hearts ?? 5} color={palette.accentDeep} />
          <Stat icon="star" label="نقطة علم" value={progress?.xp ?? 0} color={palette.accentDeep} />
        </View>

        <View style={[styles.heroCard, { backgroundColor: `${palette.accentDeep}E8` }]}>
          <View style={styles.heroCopy}>
            <Text style={styles.heroEyebrow}>هدف اليوم</Text>
            <Text style={styles.heroTitle}>{dailyProgress >= 1 ? "أتممتِ وردك اليومي!" : "خطوة صغيرة، أثر كبير"}</Text>
            <Text style={styles.heroText}>{dailyProgress >= 1 ? `أحسنتِ يا ${learnerName || "رفيقتي"}! عودي غدًا لنحافظ على النور.` : `${learnerName ? `يا ${learnerName}، ` : ""}واصلي طريقك في طلب العلم بهدوء.`}</Text>
            <View style={styles.goalTrack}><View style={[styles.goalFill, { width: `${Math.max(8, dailyProgress * 100)}%`, backgroundColor: palette.accent }]} /></View>
            <Text style={styles.goalLabel}>{Math.min(dailyXp, DAILY_XP_GOAL)} / {DAILY_XP_GOAL} نقطة اليوم</Text>
          </View>
          <Rafiqati mood={dailyProgress >= 1 ? "happy" : "encouraging"} palette={palette} size={56} showMoodIcon={false} customization={customization} />
        </View>

        {capsule && (
          <Pressable style={({ pressed }) => [styles.capsuleCard, { borderColor: palette.accent, transform: [{ scale: pressed ? 0.98 : 1 }] }]} onPress={() => router.push("/capsule")}>
            <View style={[styles.capsuleIcon, { backgroundColor: `${palette.accent}33` }]}><Ionicons name="hourglass-outline" size={20} color={palette.accentDeep} /></View>
            <View style={styles.capsuleCopy}><Text style={[styles.capsuleTitle, { color: palette.accentDeep }]}>كبسولة زمنية وصلت</Text><Text style={[styles.capsuleText, { color: palette.accentDeep }]}>راجعي سؤالًا قديمًا واكتشفي كم نَمَت معرفتك</Text></View>
            <Ionicons name="chevron-back" size={18} color={palette.accentDeep} />
          </Pressable>
        )}

        <View style={styles.sectionHeader}><Text style={[styles.sectionTitle, { color: palette.accentDeep }]}>رحلتك التعليمية</Text><Text style={[styles.sectionMeta, { color: palette.accentDeep }]}>{completedCount} من {LESSON_ORDER.length} دروس</Text></View>
        <View style={styles.masteryTrack}><View style={[styles.masteryFill, { width: `${Math.round(masteryRatio * 100)}%`, backgroundColor: palette.accent }]} /></View>

        <ScrollView contentContainerStyle={styles.path} showsVerticalScrollIndicator={false}>
          {Object.entries(LESSON_ORDER.reduce<Record<string, typeof LESSON_ORDER>>((acc, l) => { (acc[l.unitId] ??= []).push(l); return acc; }, {})).map(([unitId, lessons], unitIdx, allUnits) => {
            const prevUnitId = unitIdx > 0 ? allUnits[unitIdx - 1][0] : null;
            const unitUnlocked = !prevUnitId || (progress?.masteryByUnit[prevUnitId] ?? 0) >= 0.6;
            return (
              <View key={unitId} style={styles.unitBlock}>
                <View style={styles.unitHeader}><Text style={[styles.unitLabel, { color: palette.accentDeep }]}>{UNIT_TITLES[unitId] ?? unitId}</Text><View style={[styles.unitPill, { backgroundColor: `${palette.accent}33` }]}><Text style={[styles.unitPillText, { color: palette.accentDeep }]}>{unitUnlocked ? "مفتوحة" : "قريبًا"}</Text></View></View>
                {lessons.map((lesson, i) => {
                  const prevLesson = i > 0 ? lessons[i - 1] : null;
                  const done = progress?.completedLessonIds.includes(lesson.id) ?? false;
                  const today = new Date().toISOString().slice(0, 10);
                  const alreadyStartedNewLessonToday = progress?.lastNewLessonDate === today;
                  const lessonUnlocked = unitUnlocked && (!prevLesson || (progress?.completedLessonIds.includes(prevLesson.id) ?? false)) && (done || !alreadyStartedNewLessonToday);
                  const isNext = lesson.id === nextLesson?.id && lessonUnlocked;
                  return (
                    <Pressable key={lesson.id} disabled={!lessonUnlocked} onPress={() => router.push(`/lesson/${lesson.id}`)} style={({ pressed }) => [styles.node, { backgroundColor: lessonUnlocked ? (done ? growthTint(1) : `${palette.accentDeep}E8`) : "#00000018", borderColor: isNext ? palette.accent : "transparent", opacity: pressed ? 0.86 : 1 }]}>
                      <View style={[styles.nodeIcon, { backgroundColor: done ? palette.accent : "#FFFFFF22" }]}><Ionicons name={lessonUnlocked ? (done ? "checkmark" : "play") : "lock-closed"} size={17} color="#FFFDFB" /></View>
                      <View style={styles.nodeCopy}><Text style={styles.nodeLabel} numberOfLines={1}>{lesson.title}</Text><Text style={styles.nodeHint}>{done ? "تم الإنجاز · أعيديها للتثبيت" : isNext ? "درس اليوم المقترح" : lessonUnlocked ? "جاهز للبدء" : "أكملي المسار لفتح الدرس"}</Text></View>
                      {isNext && <View style={[styles.nextBadge, { backgroundColor: palette.accent }]}><Text style={styles.nextBadgeText}>ابدئي</Text></View>}
                    </Pressable>
                  );
                })}
              </View>
            );
          })}
        </ScrollView>
      </Animated.View>
      <Modal visible={nameModalVisible} transparent animationType="fade" onRequestClose={() => {}}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.modalBackdrop}>
          <View style={styles.nameCard}>
            <Rafiqati mood="encouraging" palette={palette} size={60} customization={customization} />
            <Text style={[styles.nameTitle, { color: palette.accentDeep }]}>هيا نتعرّف عليكِ</Text>
            <Text style={[styles.nameHint, { color: palette.accentDeep }]}>ما الاسم الذي تحبين أن تناديكِ به رفيقتي؟</Text>
            <TextInput value={nameDraft} onChangeText={setNameDraft} autoFocus placeholder="اكتبي اسمك هنا" placeholderTextColor="#9B8790" style={[styles.nameInput, { borderColor: palette.accent }]} textAlign="right" />
            <Pressable style={[styles.nameButton, { backgroundColor: palette.accentDeep }]} onPress={async () => { const name = nameDraft.trim(); if (!name) return; await saveLearnerName(name); setLearnerName(name); setNameModalVisible(false); await playTapSound(); speak(`أهلاً ${name}! أنا رفيقتك، وسأكون معك في رحلة العلم.`); }}>
              <Text style={styles.nameButtonText}>ابدئي الرحلة</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      <Modal visible={customizeVisible} transparent animationType="slide" onRequestClose={() => setCustomizeVisible(false)}>
        <View style={styles.customizeBackdrop}>
          <View style={styles.customizeCard}>
            <View style={styles.customizeTitleRow}><Text style={[styles.customizeTitle, { color: palette.accentDeep }]}>استوديو رفيقتي</Text><Pressable onPress={() => setCustomizeVisible(false)}><Ionicons name="close-circle" size={25} color={palette.accentDeep} /></Pressable></View>
            <View style={styles.previewRow}><Rafiqati mood="happy" palette={palette} size={72} customization={customization} /><View style={styles.previewCopy}><Text style={[styles.previewTitle, { color: palette.accentDeep }]}>اختاري لمستها اليوم</Text><Text style={[styles.previewText, { color: palette.accentDeep }]}>كلما واصلتِ التعلم، تفتحين خيارات أكثر.</Text></View></View>
            <Text style={[styles.choiceLabel, { color: palette.accentDeep }]}>الأزياء</Text>
            <View style={styles.choiceRow}>{([
              ["rose", "وردي", "#E78BAA", true], ["sunrise", "ذهبي", "#E7A33E", true], ["lavender", "بنفسجي", "#9974C6", progress?.xp !== undefined && progress.xp >= 30], ["mint", "نعناعي", "#68BFA8", progress?.streakDays !== undefined && progress.streakDays >= 3],
            ] as const).map(([id, label, color, unlocked]) => <Pressable key={id} disabled={!unlocked} onPress={() => setCustomization((c) => ({ ...c, outfit: id }))} style={[styles.choice, { borderColor: customization.outfit === id ? color : "#00000012", opacity: unlocked ? 1 : 0.4 }]}><View style={[styles.colorDot, { backgroundColor: color }]} /><Text style={[styles.choiceText, { color: palette.accentDeep }]}>{label}</Text>{!unlocked && <Ionicons name="lock-closed" size={12} color={palette.accentDeep} />}</Pressable>)}</View>
            <Text style={[styles.choiceLabel, { color: palette.accentDeep }]}>الإكسسوارات</Text>
            <View style={styles.choiceRow}>{([
              ["sparkle", "نجوم", "sparkles-outline", true], ["book", "كتاب", "book-outline", progress?.xp !== undefined && progress.xp >= 45], ["flower", "زهرة", "flower-outline", progress?.streakDays !== undefined && progress.streakDays >= 7], ["none", "بدون", null, true],
            ] as const).map(([id, label, icon, unlocked]) => <Pressable key={id} disabled={!unlocked} onPress={() => setCustomization((c) => ({ ...c, accessory: id }))} style={[styles.accessoryChoice, { borderColor: customization.accessory === id ? palette.accent : "#00000012", opacity: unlocked ? 1 : 0.4 }]}>{icon ? <Ionicons name={icon} size={19} color={palette.accentDeep} /> : <Ionicons name="remove-outline" size={19} color={palette.accentDeep} />}<Text style={[styles.choiceText, { color: palette.accentDeep }]}>{label}</Text></Pressable>)}</View>
            <Pressable style={[styles.saveStyleButton, { backgroundColor: palette.accentDeep }]} onPress={async () => { await saveCompanionCustomization(customization); setCustomizeVisible(false); await playTapSound(); }}><Text style={styles.nameButtonText}>احفظي الإطلالة</Text></Pressable>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

function Stat({ icon, label, value, color }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: number; color: string }) {
  return <View style={styles.stat}><Ionicons name={icon} size={18} color={color} /><View><Text style={[styles.statText, { color }]}>{value}</Text><Text style={[styles.statLabel, { color }]}>{label}</Text></View></View>;
}

const styles = StyleSheet.create({
  fill: { flex: 1, paddingTop: 52, paddingHorizontal: 18 },
  topBar: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", marginBottom: 18 },
  topActions: { flexDirection: "row-reverse", gap: 8 },
  brandRow: { flexDirection: "row-reverse", alignItems: "center", gap: 10 },
  logo: { width: 38, height: 38, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  brand: { textAlign: "right", fontSize: 20, fontWeight: "800", writingDirection: "rtl" },
  subtitle: { textAlign: "right", fontSize: 10, opacity: 0.7, writingDirection: "rtl", marginTop: 2 },
  iconButton: { width: 42, height: 42, borderRadius: 14, backgroundColor: "#ffffff66", alignItems: "center", justifyContent: "center" },
  statsRow: { flexDirection: "row-reverse", justifyContent: "space-between", marginBottom: 18 },
  stat: { flexDirection: "row-reverse", alignItems: "center", gap: 7 },
  statText: { fontSize: 15, fontWeight: "800", textAlign: "right" },
  statLabel: { fontSize: 9, opacity: 0.65, textAlign: "right", writingDirection: "rtl" },
  heroCard: { borderRadius: 24, paddingVertical: 16, paddingHorizontal: 16, flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", overflow: "hidden", marginBottom: 14, minHeight: 100 },
  heroCopy: { flex: 1, alignItems: "flex-end" },
  heroEyebrow: { color: "#FFFFFF99", fontSize: 11, writingDirection: "rtl" },
  heroTitle: { color: "#FFF", fontSize: 19, fontWeight: "800", textAlign: "right", writingDirection: "rtl", marginTop: 4 },
  heroText: { color: "#FFFFFFCC", fontSize: 11, textAlign: "right", writingDirection: "rtl", marginTop: 4 },
  goalTrack: { height: 6, backgroundColor: "#FFFFFF33", borderRadius: 8, width: "100%", marginTop: 13, overflow: "hidden" },
  goalFill: { height: "100%", borderRadius: 8 },
  goalLabel: { color: "#FFFFFFAA", fontSize: 10, marginTop: 5, writingDirection: "rtl" },
  capsuleCard: { flexDirection: "row-reverse", alignItems: "center", gap: 10, borderWidth: 1, borderRadius: 18, padding: 11, marginBottom: 18, backgroundColor: "#ffffff99" },
  capsuleIcon: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  capsuleCopy: { flex: 1, alignItems: "flex-end" },
  capsuleTitle: { fontSize: 12, fontWeight: "800", writingDirection: "rtl" },
  capsuleText: { fontSize: 10, opacity: 0.75, textAlign: "right", writingDirection: "rtl", marginTop: 2 },
  sectionHeader: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", marginBottom: 7 },
  sectionTitle: { fontSize: 16, fontWeight: "800", writingDirection: "rtl" },
  sectionMeta: { fontSize: 10, opacity: 0.7, writingDirection: "rtl" },
  masteryTrack: { height: 5, borderRadius: 5, backgroundColor: "#00000018", marginBottom: 14, overflow: "hidden" },
  masteryFill: { height: "100%", borderRadius: 5 },
  path: { paddingBottom: 36 },
  unitBlock: { marginBottom: 17 },
  unitHeader: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", marginBottom: 9 },
  unitLabel: { fontSize: 13, fontWeight: "800", writingDirection: "rtl" },
  unitPill: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
  unitPillText: { fontSize: 9, fontWeight: "700", writingDirection: "rtl" },
  node: { flexDirection: "row-reverse", alignItems: "center", gap: 10, borderRadius: 18, borderWidth: 1.5, paddingVertical: 11, paddingHorizontal: 12, marginBottom: 8 },
  nodeIcon: { width: 34, height: 34, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  nodeCopy: { flex: 1, alignItems: "flex-end" },
  nodeLabel: { color: "#FFFDFB", fontSize: 13, fontWeight: "700", writingDirection: "rtl", textAlign: "right" },
  nodeHint: { color: "#FFFFFFAA", fontSize: 9, marginTop: 2, writingDirection: "rtl", textAlign: "right" },
  nextBadge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 5 },
  nextBadgeText: { color: "#fff", fontSize: 10, fontWeight: "800", writingDirection: "rtl" },
  modalBackdrop: { flex: 1, backgroundColor: "#24152699", alignItems: "center", justifyContent: "center", padding: 24 },
  nameCard: { width: "100%", borderRadius: 26, backgroundColor: "#FFF9F7", padding: 22, alignItems: "center" },
  nameTitle: { fontSize: 20, fontWeight: "800", writingDirection: "rtl", textAlign: "center", marginTop: 4 },
  nameHint: { fontSize: 12, opacity: 0.72, writingDirection: "rtl", textAlign: "center", marginTop: 7, marginBottom: 16 },
  nameInput: { width: "100%", borderWidth: 1, borderRadius: 14, padding: 13, fontSize: 15, writingDirection: "rtl", backgroundColor: "#fff" },
  nameButton: { width: "100%", borderRadius: 14, alignItems: "center", padding: 14, marginTop: 12 },
  nameButtonText: { color: "#fff", fontSize: 14, fontWeight: "800", writingDirection: "rtl" },
  customizeBackdrop: { flex: 1, backgroundColor: "#24152688", justifyContent: "flex-end" },
  customizeCard: { backgroundColor: "#FFF9F7", borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, paddingBottom: 28 },
  customizeTitleRow: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  customizeTitle: { fontSize: 20, fontWeight: "800", writingDirection: "rtl" },
  previewRow: { flexDirection: "row-reverse", alignItems: "center", gap: 14, backgroundColor: "#FFFFFF", borderRadius: 20, padding: 12, marginBottom: 12 },
  previewCopy: { flex: 1, alignItems: "flex-end" },
  previewTitle: { fontSize: 15, fontWeight: "800", writingDirection: "rtl", textAlign: "right" },
  previewText: { fontSize: 11, opacity: 0.7, writingDirection: "rtl", textAlign: "right", marginTop: 4 },
  choiceLabel: { fontSize: 13, fontWeight: "800", textAlign: "right", writingDirection: "rtl", marginTop: 8, marginBottom: 7 },
  choiceRow: { flexDirection: "row-reverse", flexWrap: "wrap", gap: 8 },
  choice: { flexDirection: "row-reverse", alignItems: "center", gap: 5, borderWidth: 1.5, borderRadius: 13, paddingVertical: 8, paddingHorizontal: 10 },
  colorDot: { width: 17, height: 17, borderRadius: 9 },
  accessoryChoice: { flexDirection: "row-reverse", alignItems: "center", gap: 5, borderWidth: 1.5, borderRadius: 13, paddingVertical: 8, paddingHorizontal: 10 },
  choiceText: { fontSize: 11, fontWeight: "700", writingDirection: "rtl" },
  saveStyleButton: { borderRadius: 15, alignItems: "center", padding: 14, marginTop: 18 },
});
