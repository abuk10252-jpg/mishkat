import { useEffect } from "react";
import { I18nManager } from "react-native";
import { Stack } from "expo-router";

// التطبيق عربي بالكامل RTL. أول تشغيل بعد التفعيل ده محتاج إعادة تحميل من
// Expo Go/الـ APK عشان يطبق فعليًا (قيود React Native نفسها، مش حاجة زيادة).
if (!I18nManager.isRTL) {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
}

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="lesson/[id]" options={{ animation: "slide_from_bottom" }} />
    </Stack>
  );
}
