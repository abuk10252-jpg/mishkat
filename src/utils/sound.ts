import { Audio } from "expo-av";

let correctSound: Audio.Sound | null = null;
let wrongSound: Audio.Sound | null = null;
let audioReady = false;

async function ensureLoaded() {
  if (!audioReady) {
    await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, shouldDuckAndroid: true });
    audioReady = true;
  }
  if (!correctSound) {
    const { sound } = await Audio.Sound.createAsync(require("../../assets/sounds/correct.wav"), { volume: 0.75 });
    correctSound = sound;
  }
  if (!wrongSound) {
    const { sound } = await Audio.Sound.createAsync(require("../../assets/sounds/wrong.wav"), { volume: 0.6 });
    wrongSound = sound;
  }
}

async function replay(sound: Audio.Sound | null): Promise<void> {
  if (!sound) return;
  await sound.setPositionAsync(0);
  await sound.playAsync();
}

export async function playCorrectSound(): Promise<void> {
  try { await ensureLoaded(); await replay(correctSound); } catch { /* الصوت تحسين اختياري */ }
}

export async function playWrongSound(): Promise<void> {
  try { await ensureLoaded(); await replay(wrongSound); } catch { /* الصوت تحسين اختياري */ }
}

export async function playTapSound(): Promise<void> {
  try { await ensureLoaded(); await replay(correctSound); } catch { /* الصوت تحسين اختياري */ }
}

export async function unloadSounds(): Promise<void> {
  await correctSound?.unloadAsync();
  await wrongSound?.unloadAsync();
  correctSound = null;
  wrongSound = null;
  audioReady = false;
}
