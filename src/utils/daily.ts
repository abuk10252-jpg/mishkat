import { LESSON_ORDER } from "../data/lessons";
import { Progress } from "./storage";

export function todayKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getNextLessonId(progress: Progress): string | null {
  const next = LESSON_ORDER.find((lesson) => !progress.completedLessonIds.includes(lesson.id));
  return next?.id ?? null;
}

export function hasCompletedToday(progress: Progress): boolean {
  return progress.lastCompletedLessonDate === todayKey();
}

export function canStartDailyLesson(progress: Progress, lessonId: string): boolean {
  const nextId = getNextLessonId(progress);
  if (!nextId || nextId !== lessonId) return false;
  return !hasCompletedToday(progress);
}

export function daysUntilNextLesson(): number {
  return 1;
}
