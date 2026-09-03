// هوية مشكاة: وردي بودري + موف + كريمي + لمسات ذهبية.
// تتبدل الخلفية حسب وقت اليوم، بينما تبقى الهوية البصرية ثابتة وهادئة.

import { DayPeriod } from "../utils/timeOfDay";

export type Palette = {
  sky: [string, string];
  ground: string;
  accent: string;
  accentDeep: string;
  companionRobe: string;
  surface: string;
  surfaceStrong: string;
  text: string;
  muted: string;
  success: string;
  danger: string;
};

const PERIODS: Record<DayPeriod, Palette> = {
  fajr: {
    sky: ["#4A3857", "#80638E"], ground: "#5A4166", accent: "#D7A9C7", accentDeep: "#2F203B",
    companionRobe: "#6D4C78", surface: "#FFF8FC", surfaceStrong: "#FFFFFF", text: "#2E2430", muted: "#766A75",
    success: "#5E927A", danger: "#B55B6B",
  },
  duha: {
    sky: ["#FFF3EA", "#F4D3BE"], ground: "#F9EEE8", accent: "#B87991", accentDeep: "#5A3042",
    companionRobe: "#B96E88", surface: "#FFFDFC", surfaceStrong: "#FFFFFF", text: "#342832", muted: "#82747B",
    success: "#4E8B70", danger: "#B45161",
  },
  midday: {
    sky: ["#FFF4F7", "#F2D5E0"], ground: "#FAF0F4", accent: "#A94F70", accentDeep: "#56263B",
    companionRobe: "#8F6BA8", surface: "#FFFDFD", surfaceStrong: "#FFFFFF", text: "#30242B", muted: "#81727A",
    success: "#4B8C70", danger: "#B64F60",
  },
  maghrib: {
    sky: ["#FFF0EC", "#EAB3A8"], ground: "#F5D8D0", accent: "#B85F5B", accentDeep: "#542620",
    companionRobe: "#934958", surface: "#FFFDFC", surfaceStrong: "#FFFFFF", text: "#352625", muted: "#806E6B",
    success: "#4C866E", danger: "#AE4C55",
  },
  isha: {
    sky: ["#2E253B", "#564061"], ground: "#3C2D49", accent: "#D0A7CB", accentDeep: "#25192F",
    companionRobe: "#63466D", surface: "#FFF8FC", surfaceStrong: "#FFFFFF", text: "#302532", muted: "#857A88",
    success: "#72A48D", danger: "#D07B89",
  },
};

export function getPalette(period: DayPeriod): Palette {
  return PERIODS[period];
}

export function growthTint(masteryRatio: number): string {
  const stops = ["#F5DDE6", "#EAB8CA", "#D98AA5", "#B85F7C", "#7B3D55"];
  const idx = Math.min(stops.length - 1, Math.floor(Math.max(0, masteryRatio) * stops.length));
  return stops[idx];
}
