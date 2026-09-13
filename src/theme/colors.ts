// نظام ألوان "حي" — مش لوحة ثابتة زي أغلب التطبيقات.
// فكرة خارج الصندوق: الألوان بتتغير مع وقت اليوم (إحساس بإيقاع العبادة اليومي)
// وبتتعمّق تدريجيًا كل ما تقدمك في الحديقة/العلم يزيد (إحساس نمو حقيقي مش لوحة جامدة).
//
// لوحة نسائية دافئة (وردي/موف/ذهبي) — بدون أي درجات خضراء، بناءً على طلب التصميم.

import { DayPeriod } from "../utils/timeOfDay";

export type Palette = {
  sky: [string, string]; // تدرج خلفية الشاشة الرئيسية
  ground: string; // لون الحديقة/الأرضية
  accent: string; // لون العناصر التفاعلية الأساسية
  accentDeep: string; // نص/حدود فوق accent
  companionRobe: string; // لمسة لونية خفيفة قرب رفيقتي تتماشى مع وقت اليوم
};

// كل فترة يوم ليها هوية لونية مستوحاة من ضوء السماء الفعلي في الوقت ده —
// مش اختيار عشوائي، لكن انعكاس لإيقاع يوم حقيقي. كل الدرجات دلوقتي وردي/موف/ذهبي/كريمي.
const PERIODS: Record<DayPeriod, Palette> = {
  fajr: {
    sky: ["#3C2E4A", "#7A5C8F"], // بنفسجي الفجر الدافئ
    ground: "#4A3358",
    accent: "#B892CE",
    accentDeep: "#2E1F3A",
    companionRobe: "#6B4C7A",
  },
  duha: {
    sky: ["#FAEEDA", "#F3C9A8"], // ضحى ذهبي كريمي دافئ
    ground: "#F7EFE8",
    accent: "#D4AF7A",
    accentDeep: "#5A3E1E",
    companionRobe: "#C97B92",
  },
  midday: {
    sky: ["#FCEFF3", "#F3D0DC"], // نهار وردي فاتح هادي
    ground: "#F7EFE8",
    accent: "#B85E78",
    accentDeep: "#5A2C3D",
    companionRobe: "#9B7EBD",
  },
  maghrib: {
    sky: ["#FAECE7", "#E8A091"], // غروب وردي مرجاني دافئ
    ground: "#F0C9BE",
    accent: "#C9705A",
    accentDeep: "#4A2318",
    companionRobe: "#993C4A",
  },
  isha: {
    sky: ["#2A1F35", "#4A2E4F"], // ليل هادئ بنفسجي عميق
    ground: "#3A2440",
    accent: "#B08BC7",
    accentDeep: "#1E1526",
    companionRobe: "#5A3A63",
  },
};

export function getPalette(period: DayPeriod): Palette {
  return PERIODS[period];
}

// كل ما نسبة الإتقان الكلية (0-1) تزيد، لون "الحديقة" يميل تدريجيًا لدرجات
// أدفى وأنضج (من وردي فاتح لعنّابي عميق فيه لمسة ذهبية) — التقدم نفسه بيتحول
// للون، مش بس رقم في شريط.
export function growthTint(masteryRatio: number): string {
  const stops = ["#F3D9E1", "#E8A8BC", "#D4708F", "#B85E78", "#7A3B52"];
  const idx = Math.min(stops.length - 1, Math.floor(masteryRatio * stops.length));
  return stops[idx];
}
