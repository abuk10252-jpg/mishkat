import AsyncStorage from "@react-native-async-storage/async-storage";

const KEYS = {
  progress: "zadi:progress",
  mistakes: "zadi:mistakes", // لسجل "كبسولة الزمن"
  wisdomChest: "zadi:wisdom_chest", // خزينة بطاقات الفوائد
};

export type Progress = {
  xp: number;
  hearts: number;
  streakDays: number;
  lastActiveDate: string | null; // ISO date, لحساب الستريك بدون نت
  lastNewLessonDate: string | null; // ISO date — آخر يوم اتفتح فيه درس جديد لأول مرة
  completedLessonIds: string[];
  masteryByUnit: Record<string, number>; // unitId -> 0..1
};

const DEFAULT_PROGRESS: Progress = {
  xp: 0,
  hearts: 5,
  streakDays: 0,
  lastActiveDate: null,
  lastNewLessonDate: null,
  completedLessonIds: [],
  masteryByUnit: {},
};

export async function loadProgress(): Promise<Progress> {
  const raw = await AsyncStorage.getItem(KEYS.progress);
  if (!raw) return DEFAULT_PROGRESS;
  return { ...DEFAULT_PROGRESS, ...JSON.parse(raw) };
}

export async function saveProgress(p: Progress): Promise<void> {
  await AsyncStorage.setItem(KEYS.progress, JSON.stringify(p));
}

// يسجل غلطة عشان نرجعها بعد فترة في "كبسولة الزمن" — تصحح نفس السؤال
// بعد أسابيع وتشوف الفرق بنفسك.
export type MistakeEntry = {
  questionId: string;
  unitId: string;
  question: string;
  date: string;
};

export async function logMistake(entry: MistakeEntry): Promise<void> {
  const raw = await AsyncStorage.getItem(KEYS.mistakes);
  const list: MistakeEntry[] = raw ? JSON.parse(raw) : [];
  list.push(entry);
  await AsyncStorage.setItem(KEYS.mistakes, JSON.stringify(list));
}

// يرجع غلطة قديمة (أسبوع فأكتر) لسه ما راجعناها، عشان نعرضها كـ"كبسولة زمن"
export async function getTimeCapsuleMistake(minDaysAgo = 7): Promise<MistakeEntry | null> {
  const raw = await AsyncStorage.getItem(KEYS.mistakes);
  if (!raw) return null;
  const list: MistakeEntry[] = JSON.parse(raw);
  const cutoff = Date.now() - minDaysAgo * 24 * 60 * 60 * 1000;
  const eligible = list.filter((m) => new Date(m.date).getTime() <= cutoff);
  if (eligible.length === 0) return null;
  return eligible[Math.floor(Math.random() * eligible.length)];
}

export type WisdomCard = { id: string; text: string; source: string; dateEarned: string };

export async function addWisdomCard(card: WisdomCard): Promise<void> {
  const raw = await AsyncStorage.getItem(KEYS.wisdomChest);
  const list: WisdomCard[] = raw ? JSON.parse(raw) : [];
  list.push(card);
  await AsyncStorage.setItem(KEYS.wisdomChest, JSON.stringify(list));
}

export async function getWisdomChest(): Promise<WisdomCard[]> {
  const raw = await AsyncStorage.getItem(KEYS.wisdomChest);
  return raw ? JSON.parse(raw) : [];
}

// بوابة الإتقان: الوحدة الجاية ما تتفتح إلا لو سابقتها وصلت نسبة إتقان كافية —
// هيكل جاهز الآن يشتغل تلقائيًا كل ما تضاف وحدات جديدة بترتيب الكتب الفقهية.
export function isUnitUnlocked(
  unitId: string,
  orderedUnitIds: string[],
  progress: Progress,
  threshold = 0.6
): boolean {
  const idx = orderedUnitIds.indexOf(unitId);
  if (idx <= 0) return true;
  const prevUnit = orderedUnitIds[idx - 1];
  return (progress.masteryByUnit[prevUnit] ?? 0) >= threshold;
}

// بعد ما تراجع غلطة قديمة في "كبسولة الزمن" وتتذكر الإجابة، نشيلها من قايمة
// الانتظار عشان ما تتكرر عليك تاني قريب.
export async function markMistakeReviewed(questionId: string, date: string): Promise<void> {
  const raw = await AsyncStorage.getItem(KEYS.mistakes);
  if (!raw) return;
  const list: MistakeEntry[] = JSON.parse(raw);
  const filtered = list.filter((m) => !(m.questionId === questionId && m.date === date));
  await AsyncStorage.setItem(KEYS.mistakes, JSON.stringify(filtered));
}
