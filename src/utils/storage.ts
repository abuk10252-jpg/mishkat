import AsyncStorage from "@react-native-async-storage/async-storage";

const KEYS = {
  progress: "zadi:progress",
  mistakes: "zadi:mistakes",
  wisdomChest: "zadi:wisdom_chest",
};

export type Progress = {
  xp: number;
  hearts: number;
  streakDays: number;
  lastActiveDate: string | null;
  completedLessonIds: string[];
  masteryByUnit: Record<string, number>;
  lastCompletedLessonDate: string | null;
  lastCompletedLessonId: string | null;
};

const DEFAULT_PROGRESS: Progress = {
  xp: 0,
  hearts: 5,
  streakDays: 0,
  lastActiveDate: null,
  completedLessonIds: [],
  masteryByUnit: {},
  lastCompletedLessonDate: null,
  lastCompletedLessonId: null,
};

export async function loadProgress(): Promise<Progress> {
  const raw = await AsyncStorage.getItem(KEYS.progress);
  if (!raw) return { ...DEFAULT_PROGRESS };
  const parsed = JSON.parse(raw);
  return { ...DEFAULT_PROGRESS, ...parsed };
}

export async function saveProgress(p: Progress): Promise<void> {
  await AsyncStorage.setItem(KEYS.progress, JSON.stringify(p));
}

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

export function isUnitUnlocked(unitId: string, orderedUnitIds: string[], progress: Progress, threshold = 0.6): boolean {
  const idx = orderedUnitIds.indexOf(unitId);
  if (idx <= 0) return true;
  const prevUnit = orderedUnitIds[idx - 1];
  return (progress.masteryByUnit[prevUnit] ?? 0) >= threshold;
}

export async function markMistakeReviewed(questionId: string, date: string): Promise<void> {
  const raw = await AsyncStorage.getItem(KEYS.mistakes);
  if (!raw) return;
  const list: MistakeEntry[] = JSON.parse(raw);
  const filtered = list.filter((m) => !(m.questionId === questionId && m.date === date));
  await AsyncStorage.setItem(KEYS.mistakes, JSON.stringify(filtered));
}
