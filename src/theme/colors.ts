// لوحة ألوان مشرقة ومريحة — مصممة لتشعر المتعلمة بالطاقة والدفء بدل الكآبة.
// تتغير مع وقت اليوم، لكن كل الفترات تحافظ على سطوع ووضوح مناسبين للتعلم.
import { DayPeriod } from "../utils/timeOfDay";

export type Palette = {
  sky: [string, string];
  ground: string;
  accent: string;
  accentDeep: string;
  companionRobe: string;
};

const PERIODS: Record<DayPeriod, Palette> = {
  fajr: {
    sky: ["#FFF4E6", "#F8D9E8"],
    ground: "#FFF8F2",
    accent: "#E78BAA",
    accentDeep: "#6D3B5A",
    companionRobe: "#C887B5",
  },
  duha: {
    sky: ["#FFF9D9", "#FFDCA8"],
    ground: "#FFFDF3",
    accent: "#E7A33E",
    accentDeep: "#71451D",
    companionRobe: "#D68191",
  },
  midday: {
    sky: ["#FFF1F5", "#FFD4E0"],
    ground: "#FFF9F7",
    accent: "#D86688",
    accentDeep: "#71334D",
    companionRobe: "#9C80C5",
  },
  maghrib: {
    sky: ["#FFF0E8", "#FFC3A7"],
    ground: "#FFF8F4",
    accent: "#E17A5D",
    accentDeep: "#713B2E",
    companionRobe: "#C76572",
  },
  isha: {
    sky: ["#F4ECFF", "#DCCAF5"],
    ground: "#FBF8FF",
    accent: "#9974C6",
    accentDeep: "#503A70",
    companionRobe: "#8B70B9",
  },
};

export function getPalette(period: DayPeriod): Palette {
  return PERIODS[period];
}

export function growthTint(masteryRatio: number): string {
  const stops = ["#FFD8E6", "#F6B4CA", "#E98EAD", "#D96C8D", "#B95579"];
  const idx = Math.min(stops.length - 1, Math.floor(masteryRatio * stops.length));
  return stops[idx];
}
