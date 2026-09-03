// 20 واجهة تفاعلية للأسئلة في مشكاة.
// يمكن ربط كل صيغة بأي سؤال فقهي من ملفات الدروس.
export const QUESTION_FORMATS = [
  { id: "mcq", title: "اختيار واحد" },
  { id: "truefalse", title: "صح أم خطأ" },
  { id: "multiSelect", title: "اختيار متعدد" },
  { id: "scenario", title: "موقف فقهي" },
  { id: "classification", title: "تصنيف" },
  { id: "dropdown", title: "قائمة منسدلة" },
  { id: "imageChoice", title: "اختيار بصري" },
  { id: "choosePhrase", title: "اختاري العبارة الأنسب" },
  { id: "shortAnswer", title: "إجابة قصيرة" },
  { id: "fill", title: "أكملي الفراغ" },
  { id: "explain", title: "فسّري السبب" },
  { id: "confidence", title: "قيّمي فهمك" },
  { id: "dialogue", title: "حوار تفاعلي" },
  { id: "teachback", title: "صحّحي رفيقتي" },
  { id: "order", title: "ترتيب الخطوات" },
  { id: "match", title: "توصيل ومطابقة" },
  { id: "scale", title: "مقياس فهم" },
  { id: "memory", title: "اختبار الذاكرة" },
  { id: "oddOneOut", title: "اختاري المختلف" },
  { id: "sequence", title: "سلسلة سريعة" },
] as const;
