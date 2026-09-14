import * as Speech from "expo-speech";

let currentlySpeaking = false;
let preferredVoice: string | undefined;
let voiceLoaded = false;

async function getFemaleArabicVoice(): Promise<string | undefined> {
  if (voiceLoaded) return preferredVoice;
  voiceLoaded = true;
  try {
    const voices = await Speech.getAvailableVoicesAsync();
    const arabic = voices.filter((voice) => voice.language.toLowerCase().startsWith("ar"));
    const femaleHint = /(female|woman|فاطمة|أنثى|zira|saba|laila|maged)/i;
    preferredVoice = arabic.find((voice) => femaleHint.test(`${voice.name} ${voice.identifier}`))?.identifier ?? arabic[0]?.identifier;
  } catch {
    preferredVoice = undefined;
  }
  return preferredVoice;
}

export async function prepareSpeech(): Promise<void> {
  await getFemaleArabicVoice();
}

export async function speak(text: string, learnerName = ""): Promise<void> {
  const cleanText = learnerName && !text.includes(learnerName) ? `${learnerName}، ${text}` : text;
  Speech.stop();
  currentlySpeaking = true;
  const voice = await getFemaleArabicVoice();
  Speech.speak(cleanText, {
    language: "ar",
    voice,
    pitch: 1.12,
    rate: 0.9,
    onDone: () => { currentlySpeaking = false; },
    onStopped: () => { currentlySpeaking = false; },
    onError: () => { currentlySpeaking = false; },
  });
}

export function stopSpeaking(): void {
  Speech.stop();
  currentlySpeaking = false;
}

export function isSpeaking(): boolean {
  return currentlySpeaking;
}
