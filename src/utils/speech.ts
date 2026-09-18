// تم تعطيل التحدث الصوتي بناءً على طلب المستخدم.
// الدوال موجودة للتوافق مع باقي الكود، لكنها لا تفعل شيئًا.

export async function prepareSpeech(): Promise<void> {
  // لا شيء — الصوت معطّل
}

export async function speak(_text: string, _learnerName = ""): Promise<void> {
  // لا شيء — الصوت معطّل
}

export function stopSpeaking(): void {
  // لا شيء
}

export function isSpeaking(): boolean {
  return false;
}
