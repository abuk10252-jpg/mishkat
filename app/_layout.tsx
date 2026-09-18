import { useEffect } from "react";
import { I18nManager } from "react-native";
import { Stack } from "expo-router";
import { scheduleDailyReminder } from "../src/utils/notifications";

// التطبيق عربي بالكامل RTL. أول تشغيل بعد التفعيل هذا محتاج إعادة تحميل من
// Expo Go/الـ APK لكي يطبق فعليًا (قيود React Native نفسها، مش حاجة زيادة).
if (!I18nManager.isRTL) {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
}

export default function RootLayout() {
  useEffect(() => {
    scheduleDailyReminder(); // تذكير يومي الساعة ٨ بالليل افتراضيًا
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="lesson/[id]" options={{ animation: "slide_from_bottom" }} />
    </Stack>
  );
}
