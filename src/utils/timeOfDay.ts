// تقسيم اليوم لفترات تقريبية مبنية على ساعة الجهاز نفسه — بدون نت وبدون حساب فلكي دقيق.
// النية إحساس عام بإيقاع اليوم (فجر/ضحى/ظهر-عصر/مغرب/عشاء) مش مواقيت صلاة دقيقة.
// ممكن تتحسن لاحقًا بمكتبة حساب مواقيت محلية لو حبينا دقة أكتر.

export type DayPeriod = "fajr" | "duha" | "midday" | "maghrib" | "isha";

export function getDayPeriod(date: Date = new Date()): DayPeriod {
  const hour = date.getHours();
  if (hour >= 4 && hour < 7) return "fajr";
  if (hour >= 7 && hour < 12) return "duha";
  if (hour >= 12 && hour < 17) return "midday";
  if (hour >= 17 && hour < 19) return "maghrib";
  return "isha";
}
