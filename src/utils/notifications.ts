import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// إشعار يومي بسيط يفكّر المستخدمة بدرسها — بديل آمن وسهل عن الويدجت الحقيقي
// على الشاشة الرئيسية (اللي بيحتاج كود أصلي منفصل لكل نظام تشغيل).
// شغال بالكامل من غير نت، ومجدول محليًا على الجهاز نفسه.

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const REMINDER_MESSAGES = [
  "رفيقتك مستنياك 🌙 خلصي درس النهاردة؟",
  "لسه فاكرة نواقض الوضوء؟ راجعي معايا شوية",
  "دقايق بسيطة كفاية تخليكي تتقدمي في مشكاة",
  "حان وقت درسك اليومي في مشكاة",
];

export async function ensureNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

// تجدول تذكير يومي متكرر الساعة المحددة (افتراضيًا ٨ المغرب/الليل، وقت
// هادئ عادة). بتلغي أي تذكير قديم مجدول قبل ما تحط الجديد عشان ما تتكرر.
export async function scheduleDailyReminder(hour = 20, minute = 0): Promise<void> {
  const granted = await ensureNotificationPermission();
  if (!granted) return;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("daily-reminder", {
      name: "تذكير الدرس اليومي",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  await Notifications.cancelAllScheduledNotificationsAsync();

  const message = REMINDER_MESSAGES[Math.floor(Math.random() * REMINDER_MESSAGES.length)];

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "مشكاة",
      body: message,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

export async function cancelDailyReminder(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
