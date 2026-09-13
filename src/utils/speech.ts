import * as Speech from "expo-speech";

// رفيقتي "بتتكلم" فعليًا — باستخدام محرك تحويل النص لصوت المدمج في نظام
// تشغيل الهاتف (Text-to-Speech)، مش تسجيل صوتي حقيقي لممثلة صوت (ده كان
// هيحتاج تسجيل كل جملة يدويًا، وما ينفعش مع محتوى ديناميكي بيتغير من ملفات
// JSON). الصوت بيعتمد على أصوات العربي المتاحة على جهاز المستخدمة نفسه.

let currentlySpeaking = false;

export function speak(text: string): void {
  Speech.stop();
  currentlySpeaking = true;
  Speech.speak(text, {
    language: "ar",
    pitch: 1.08, // أعلى شوية من الطبيعي، إحساس أرق وأخف
    rate: 0.92, // أبطأ شوية عن الافتراضي، وضوح أكتر
    onDone: () => {
      currentlySpeaking = false;
    },
    onStopped: () => {
      currentlySpeaking = false;
    },
  });
}

export function stopSpeaking(): void {
  Speech.stop();
  currentlySpeaking = false;
}

export function isSpeaking(): boolean {
  return currentlySpeaking;
}
