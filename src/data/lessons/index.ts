import tahara1 from "./tahara-unit1.json";
import tahara2 from "./tahara-unit2.json";
import tahara3 from "./tahara-3.json";
import tahara4 from "./tahara-4.json";
import tahara5 from "./tahara-5.json";
import salah1 from "./salah-1.json";
import salah2 from "./salah-2.json";
import salah3 from "./salah-3.json";
import salah4 from "./salah-4.json";
import salah5 from "./salah-5.json";
import salah6 from "./salah-6.json";
import janazah1 from "./janazah-1.json";
import sawm1 from "./sawm-1.json";
import sawm2 from "./sawm-2.json";

// كل درس جديد تضيفه في src/data/lessons/*.json، سجله هنا بنفس id الملف،
// وزوّده في LESSON_ORDER بترتيب أبواب الكتب (طهارة ← صلاة ← جنائز ← صيام).
export const LESSONS: Record<string, typeof tahara1> = {
  [tahara1.id]: tahara1,
  [tahara2.id]: tahara2,
  [tahara3.id]: tahara3,
  [tahara4.id]: tahara4,
  [tahara5.id]: tahara5,
  [salah1.id]: salah1,
  [salah2.id]: salah2,
  [salah3.id]: salah3,
  [salah4.id]: salah4,
  [salah5.id]: salah5,
  [salah6.id]: salah6,
  [janazah1.id]: janazah1,
  [sawm1.id]: sawm1,
  [sawm2.id]: sawm2,
};

// ترتيب الدروس داخل كل وحدة (بترتيب أبواب الكتاب) — ده أساس بوابة الإتقان
// وقائمة الرئيسية. أي درس جديد يُضاف هنا في مكانه الصحيح من ترتيب الأبواب.
export const LESSON_ORDER = [
  tahara1,
  tahara2,
  tahara3,
  tahara4,
  tahara5,
  salah1,
  salah2,
  salah3,
  salah4,
  salah5,
  salah6,
  janazah1,
  sawm1,
  sawm2,
].map((l) => ({ id: l.id, title: l.title, unitId: l.unitId }));

export const UNIT_ORDER = ["tahara", "salah", "janazah", "sawm"];
