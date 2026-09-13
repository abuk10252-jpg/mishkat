import { Audio } from "expo-av";

// أصوات قصيرة ولطيفة (لحنين، مش صفارة حادة) للإجابة الصح والغلط. الملفات
// اتولّدت برمجيًا (نغمات نقية، مش تسجيل حقيقي) عشان تفضل خفيفة الحجم.

let correctSound: Audio.Sound | null = null;
let wrongSound: Audio.Sound | null = null;

async function ensureLoaded() {
  if (!correctSound) {
    const { sound } = await Audio.Sound.createAsync(require("../../assets/sounds/correct.wav"));
    correctSound = sound;
  }
  if (!wrongSound) {
    const { sound } = await Audio.Sound.createAsync(require("../../assets/sounds/wrong.wav"));
    wrongSound = sound;
  }
}

export async function playCorrectSound(): Promise<void> {
  try {
    await ensureLoaded();
    await correctSound?.replayAsync();
  } catch {
    // مش مشكلة كبيرة لو فشل الصوت — التجربة تكمل عادي
  }
}

export async function playWrongSound(): Promise<void> {
  try {
    await ensureLoaded();
    await wrongSound?.replayAsync();
  } catch {}
}
