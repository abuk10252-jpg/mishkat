import { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, Pressable, TextInput, ScrollView, Animated } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getDayPeriod } from "../../src/utils/timeOfDay";
import { getPalette } from "../../src/theme/colors";
import { Rafiqati } from "../../src/components/Rafiqati";
import { LESSONS } from "../../src/data/lessons";
import { loadProgress, saveProgress, logMistake } from "../../src/utils/storage";
import { todayKey } from "../../src/utils/daily";

type AnswerState = null | { correct: boolean; selected?: number; selections?: number[] };

const FORMAT_LABELS: Record<string,string> = {
  mcq:"اختيار واحد", truefalse:"صح أم خطأ", multiSelect:"اختيار متعدد", scenario:"موقف فقهي", classification:"تصنيف", dropdown:"قائمة منسدلة", imageChoice:"اختيار بصري", choosePhrase:"اختاري العبارة", shortAnswer:"إجابة قصيرة", fill:"أكملي الفراغ", explain:"فسّري السبب", confidence:"قيّمي فهمك", dialogue:"حوار تفاعلي", teachback:"صحّحي رفيقتي", order:"ترتيب الخطوات", match:"توصيل ومطابقة", scale:"مقياس فهم", memory:"اختبار الذاكرة", oddOneOut:"اختاري المختلف", sequence:"سلسلة سريعة"
};
const ALL_FORMATS = Object.keys(FORMAT_LABELS);

export default function Lesson() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const lesson: any = LESSONS[id as string];
  const palette = getPalette(getDayPeriod());
  const [stepIndex,setStepIndex]=useState(0);
  const [answer,setAnswer]=useState<AnswerState>(null);
  const [picked,setPicked]=useState<string[]>([]);
  const [writeValue,setWriteValue]=useState("");
  const [writeChecked,setWriteChecked]=useState<null|boolean>(null);
  const [completedBefore,setCompletedBefore]=useState(false);
  const [accessReady,setAccessReady]=useState(false);
  const slide=useRef(new Animated.Value(18)).current;

  useEffect(()=>{
    if(!lesson)return;
    loadProgress().then(p=>{
      const completed=p.completedLessonIds.includes(lesson.id);
      const firstIncomplete=Object.values(LESSONS).find((l:any)=>!p.completedLessonIds.includes(l.id)) as any;
      const dailyDone=p.lastCompletedLessonDate===todayKey();
      setCompletedBefore(completed); setAccessReady(true);
      if(!completed && (firstIncomplete?.id!==lesson.id || dailyDone)) router.replace("/");
    });
  },[lesson,router]);

  useEffect(()=>{
    setAnswer(null); setPicked([]); setWriteValue(""); setWriteChecked(null); slide.setValue(18);
    Animated.spring(slide,{toValue:0,useNativeDriver:true,damping:18,stiffness:160}).start();
  },[stepIndex,slide]);

  if(!lesson)return <View style={styles.center}><Text style={styles.missing}>الدرس ده غير موجود</Text></View>;
  if(!accessReady)return <LinearGradient colors={palette.sky} style={styles.center}><Rafiqati palette={palette} mood="encouraging" size={120} showMoodIcon={false}/><Text style={[styles.missing,{color:palette.text}]}>رفيقتي تجهّز درس اليوم…</Text></LinearGradient>;

  const step:any=lesson.steps[stepIndex];
  const progressPct=Math.round((stepIndex/Math.max(1,lesson.steps.length-1))*100);
  const type=step.type || ALL_FORMATS[stepIndex%ALL_FORMATS.length];
  const formatLabel=FORMAT_LABELS[type] || "تفاعل";

  async function finishLesson(){
    const p=await loadProgress();
    if(!completedBefore){
      p.xp+=15; p.completedLessonIds=Array.from(new Set([...p.completedLessonIds,lesson.id]));
      p.masteryByUnit[lesson.unitId]=Math.min(1,(p.masteryByUnit[lesson.unitId]??0)+0.34);
      p.lastCompletedLessonDate=todayKey(); p.lastCompletedLessonId=lesson.id;
      const today=todayKey();
      if(p.lastActiveDate!==today){const yesterday=new Date();yesterday.setDate(yesterday.getDate()-1);p.streakDays=p.lastActiveDate===todayKey(yesterday)?p.streakDays+1:1;p.lastActiveDate=today;}
      await saveProgress(p);
    }
    router.replace("/");
  }
  async function next(correct?:boolean, question?:string){
    if(correct===false && question) { await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); await logMistake({questionId:step.id,unitId:lesson.unitId,question,date:new Date().toISOString()}); }
    if(correct===true) await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if(stepIndex+1>=lesson.steps.length) await finishLesson(); else setStepIndex(i=>i+1);
  }

  return <LinearGradient colors={palette.sky} style={styles.fill}>
    <View style={styles.topBar}>
      <Pressable onPress={()=>router.back()} style={styles.iconBtn}><Ionicons name="arrow-forward" size={22} color={palette.text}/></Pressable>
      <View style={styles.topProgress}><View style={styles.progressTrack}><View style={[styles.progressFill,{width:`${Math.max(4,progressPct)}%`,backgroundColor:palette.accent}]}/></View><Text style={[styles.progressText,{color:palette.muted}]}>{stepIndex+1} / {lesson.steps.length}</Text></View>
      <View style={styles.timeBadge}><Ionicons name="time-outline" size={15} color={palette.accentDeep}/><Text style={[styles.timeText,{color:palette.accentDeep}]}>20 د</Text></View>
    </View>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <Animated.View style={{transform:[{translateY:slide}]}}>
        <View style={styles.planRow}>
          {lesson.sessionPlan?.map((p:any)=><View key={p.id} style={[styles.planItem,{backgroundColor:palette.surface}]}><Text style={[styles.planMin,{color:palette.accentDeep}]}>{p.minutes} د</Text><Text style={[styles.planLabel,{color:palette.text}]}>{p.label}</Text></View>)}
        </View>
        <View style={styles.lessonHeading}><View style={{flex:1}}><Text style={[styles.eyebrow,{color:palette.accentDeep}]}>{formatLabel}</Text><Text style={[styles.title,{color:palette.text}]}>{lesson.title}</Text></View><View style={[styles.dailyBadge,{backgroundColor:`${palette.accent}18`}]}><Ionicons name="calendar-outline" size={15} color={palette.accentDeep}/><Text style={[styles.dailyBadgeText,{color:palette.accentDeep}]}>درس اليوم</Text></View></View>
        <View style={styles.characterStage}><View style={[styles.glow,{backgroundColor:`${palette.accent}18`}]}/><Rafiqati palette={palette} mood={answer?.correct?"happy":type==="teachback"||type==="dialogue"?"thinking":"encouraging"} size={154} showMoodIcon={false}/></View>
        <QuestionRenderer step={step} type={type} palette={palette} answer={answer} setAnswer={setAnswer} picked={picked} setPicked={setPicked} writeValue={writeValue} setWriteValue={setWriteValue} writeChecked={writeChecked} setWriteChecked={setWriteChecked} onNext={next}/>
      </Animated.View>
    </ScrollView>
  </LinearGradient>;
}

function QuestionRenderer({step,type,palette,answer,setAnswer,picked,setPicked,writeValue,setWriteValue,writeChecked,setWriteChecked,onNext}:any){
  const opts=step.opts||["نعم","لا","غير متأكد"];
  const q=step.q||step.instruction||step.companionClaim||"راجعي المعلومة ثم اختاري ما يناسبها.";
  const submitChoice=(i:number)=>{const correct=i===step.correct;setAnswer({correct,selected:i});};
  const feedback=answer!==null ? <Feedback correct={!!answer.correct} palette={palette} correctText={opts[step.correct]||step.acceptableAnswers?.[0]||"الإجابة المعتمدة في الدرس."} onNext={()=>onNext(answer.correct,q)}/> : null;
  const standard=(label:string,children:any)=><Card palette={palette} label={label}>{children}</Card>;
  const buttons=()=>opts.map((o:string,i:number)=><AnswerButton key={i} label={o} palette={palette} disabled={answer!==null} selected={answer?.selected===i} correct={answer?.selected===i?answer.correct:undefined} onPress={()=>submitChoice(i)}/>);

  switch(type){
    case "truefalse": return standard("صح أم خطأ",<><Text style={[styles.question,{color:palette.text}]}>{q}</Text><View style={styles.twoCol}><ChoiceChip label="صح" active={answer?.selected===0} palette={palette} onPress={()=>submitChoice(0)}/><ChoiceChip label="خطأ" active={answer?.selected===1} palette={palette} onPress={()=>submitChoice(1)}/></View>{feedback}</>);
    case "multiSelect": return standard("اختيار متعدد",<><Text style={[styles.question,{color:palette.text}]}>{q}</Text>{buttons()}<Text style={[styles.hint,{color:palette.muted}]}>يمكن اختيار أكثر من إجابة عند الحاجة.</Text>{feedback}</>);
    case "scenario": return standard("موقف فقهي",<><View style={[styles.scenario,{backgroundColor:`${palette.accent}0D`,borderColor:`${palette.accent}35`}]}><Text style={[styles.scenarioText,{color:palette.text}]}>تخيّلي هذا الموقف: {q}</Text></View>{buttons()}{feedback}</>);
    case "classification": return standard("تصنيف",<><Text style={[styles.question,{color:palette.text}]}>صنّفي الحالة التالية: {q}</Text>{buttons()}{feedback}</>);
    case "dropdown": return standard("قائمة منسدلة",<><Text style={[styles.question,{color:palette.text}]}>{q}</Text><Pressable style={[styles.dropdown,{borderColor:palette.accent}]} onPress={()=>submitChoice(0)}><Text style={[styles.answerText,{color:palette.text}]}>{opts[answer?.selected??0]}</Text><Ionicons name="chevron-down" size={20} color={palette.accent}/></Pressable>{feedback}</>);
    case "imageChoice": return standard("اختيار بصري",<><Text style={[styles.question,{color:palette.text}]}>{q}</Text><View style={styles.grid}>{opts.slice(0,4).map((o:string,i:number)=><Pressable key={i} onPress={()=>submitChoice(i)} style={[styles.visualChoice,{borderColor:answer?.selected===i?(answer.correct?palette.success:palette.danger):`${palette.accent}55`},answer?.selected===i&&{backgroundColor:`${palette.accent}14` }]}><Ionicons name={i%2?"water-outline":"sparkles-outline"} size={30} color={palette.accent}/><Text style={[styles.visualText,{color:palette.text}]}>{o}</Text></Pressable>)}</View>{feedback}</>);
    case "choosePhrase": return standard("اختاري العبارة الأنسب",<><Text style={[styles.question,{color:palette.text}]}>{q}</Text>{buttons()}{feedback}</>);
    case "shortAnswer": case "fill": case "explain": return standard(type==="fill"?"أكملي الفراغ":type==="explain"?"فسّري السبب":"إجابة قصيرة",<><Text style={[styles.question,{color:palette.text}]}>{q}</Text><TextInput value={writeValue} onChangeText={setWriteValue} style={[styles.input,{borderColor:palette.accent}]} placeholder={type==="fill"?"اكتبي الكلمة الناقصة":"اكتبي إجابتك هنا"} placeholderTextColor={palette.muted} textAlign="right" editable={writeChecked===null}/>{writeChecked===null?<ActionButton palette={palette} label="تحقّقي" icon="checkmark" onPress={()=>{const ok=!!writeValue.trim() && (step.acceptableAnswers||[]).some((a:string)=>a.trim()===writeValue.trim());setWriteChecked(ok);}}/>:<Feedback correct={!!writeChecked} palette={palette} correctText={step.acceptableAnswers?.[0]||"راجعي الإجابة في الشرح."} onNext={()=>onNext(!!writeChecked,q)}/>}</>);
    case "confidence": case "scale": return standard(type==="scale"?"مقياس فهم":"قيّمي فهمك",<><Text style={[styles.question,{color:palette.text}]}>كم تشعرين أنك فهمتِ هذه النقطة؟</Text><View style={styles.scaleRow}>{[1,2,3,4,5].map(n=><Pressable key={n} onPress={()=>onNext(true,q)} style={[styles.scaleDot,{backgroundColor:n<=3?`${palette.accent}20`:palette.accent}]}><Text style={{color:n<=3?palette.accent: "#fff",fontWeight:"800"}}>{n}</Text></Pressable>)}</View></>);
    case "dialogue": case "teachback": return standard(type==="dialogue"?"حوار تفاعلي":"صحّحي رفيقتي",<><Speech text={step.companionClaim||q} palette={palette}/>{buttons()}{feedback}</>);
    case "order": return standard("رتّبي الخطوات",<><Text style={[styles.question,{color:palette.text}]}>{step.instruction}</Text><OrderStep step={step} palette={palette} picked={picked} setPicked={setPicked} onDone={(ok:boolean)=>setAnswer({correct:ok})}/>{answer!==null&&<Feedback correct={!!answer.correct} palette={palette} correctText="الترتيب الصحيح محفوظ في الدرس." onNext={()=>onNext(answer.correct,step.instruction)}/>}</>);
    case "match": return standard("توصيل ومطابقة",<><Text style={[styles.question,{color:palette.text}]}>طابقي كل عبارة مع معناها الصحيح.</Text>{buttons()}{feedback}</>);
    case "memory": return standard("اختبار الذاكرة",<><Text style={[styles.question,{color:palette.text}]}>تذكّري المعلومة التي شرحتها رفيقتي: {q}</Text>{buttons()}{feedback}</>);
    case "oddOneOut": return standard("اختاري المختلف",<><Text style={[styles.question,{color:palette.text}]}>أي خيار لا ينتمي للمجموعة؟</Text>{buttons()}{feedback}</>);
    case "sequence": return standard("سلسلة سريعة",<><Text style={[styles.question,{color:palette.text}]}>اختاري الخطوة التالية في السلسلة.</Text>{buttons()}{feedback}</>);
    case "mcq": default: return standard("اختاري الإجابة الصحيحة",<><Text style={[styles.question,{color:palette.text}]}>{q}</Text>{buttons()}{feedback}</>);
  }
}

function Card({palette,label,children}:any){return <View style={[styles.card,{backgroundColor:palette.surface}]}><View style={styles.cardLabelRow}><View style={[styles.cardDot,{backgroundColor:palette.accent}]}/><Text style={[styles.cardLabel,{color:palette.accentDeep}]}>{label}</Text></View>{children}</View>}
function Speech({text,palette}:any){return <View style={[styles.speech,{backgroundColor:`${palette.accent}0D`,borderColor:`${palette.accent}38`}]}><Ionicons name="chatbubble-ellipses-outline" size={18} color={palette.accentDeep}/><Text style={[styles.speechText,{color:palette.text}]}>{text}</Text></View>}
function ActionButton({palette,label,icon,onPress}:any){return <Pressable style={[styles.action,{backgroundColor:palette.accent}]} onPress={onPress}><Text style={styles.actionText}>{label}</Text><Ionicons name={icon} size={18} color="#fff"/></Pressable>}
function ChoiceChip({label,active,palette,onPress}:any){return <Pressable onPress={onPress} style={[styles.chip,{borderColor:active?palette.accent:`${palette.accent}55`,backgroundColor:active?`${palette.accent}15`:palette.surfaceStrong}]}><Text style={[styles.chipText,{color:palette.text}]}>{label}</Text></Pressable>}
function AnswerButton({label,palette,disabled,selected,correct,onPress}:any){const border=selected?(correct?palette.success:palette.danger):`${palette.accent}55`;const bg=selected?(correct?`${palette.success}15`:`${palette.danger}12`):palette.surfaceStrong;return <Pressable disabled={disabled} onPress={onPress} style={[styles.answer,{borderColor:border,backgroundColor:bg}]}><View style={[styles.answerMarker,{borderColor:border,backgroundColor:selected?border:"transparent"}]}>{selected&&<Ionicons name={correct?"checkmark":"close"} size={14} color="#fff"/>}</View><Text style={[styles.answerText,{color:palette.text}]}>{label}</Text></Pressable>}
function Feedback({correct,palette,correctText,onNext}:any){return <View style={[styles.feedback,{backgroundColor:correct?`${palette.success}13`:`${palette.danger}11`,borderColor:correct?`${palette.success}45`:`${palette.danger}45`}]}><View style={styles.feedbackHead}><Ionicons name={correct?"checkmark-circle":"refresh-circle"} size={23} color={correct?palette.success:palette.danger}/><Text style={[styles.feedbackTitle,{color:correct?palette.success:palette.danger}]}>{correct?"إجابة صحيحة":"خلينا نراجعها"}</Text></View>{!correct&&<Text style={[styles.feedbackText,{color:palette.text}]}>الإجابة الصحيحة: {correctText}</Text>}<Pressable onPress={onNext} style={[styles.nextFeedback,{backgroundColor:correct?palette.success:palette.accent}]}><Text style={styles.actionText}>التالي</Text><Ionicons name="arrow-back" size={17} color="#fff"/></Pressable></View>}
function OrderStep({step,palette,picked,setPicked,onDone}:any){const shuffled=useMemo(()=>[...(step.items||[])].sort(()=>0.5-Math.random()),[step.id]);return <View>{shuffled.map((item:any)=><Pressable key={item.id} disabled={picked.includes(item.id)} onPress={()=>{const n=[...picked,item.id];setPicked(n);if(n.length===step.items.length)onDone(n.join(",")===step.correctOrder.join(","));}} style={[styles.answer,{borderColor:`${palette.accent}55`,opacity:picked.includes(item.id)?.42:1}]}><View style={[styles.numberMarker,{backgroundColor:palette.accent}]}><Text style={styles.numberText}>{picked.indexOf(item.id)+1||""}</Text></View><Text style={[styles.answerText,{color:palette.text}]}>{item.label}</Text></Pressable>)}</View>}

const styles=StyleSheet.create({
 fill:{flex:1},center:{flex:1,alignItems:"center",justifyContent:"center"},missing:{fontSize:16},topBar:{paddingTop:52,paddingHorizontal:18,flexDirection:"row-reverse",alignItems:"center",gap:10},iconBtn:{width:40,height:40,borderRadius:14,backgroundColor:"#ffffff90",alignItems:"center",justifyContent:"center"},topProgress:{flex:1,alignItems:"center"},progressTrack:{width:"100%",height:8,borderRadius:999,overflow:"hidden",backgroundColor:"#00000012"},progressFill:{height:"100%",borderRadius:999},progressText:{fontSize:10,marginTop:4},timeBadge:{flexDirection:"row-reverse",alignItems:"center",gap:4,paddingHorizontal:10,paddingVertical:9,borderRadius:999,backgroundColor:"#ffffff90"},timeText:{fontSize:12,fontWeight:"900"},content:{padding:18,paddingBottom:42},planRow:{flexDirection:"row-reverse",gap:7,marginBottom:12},planItem:{flex:1,borderRadius:14,paddingVertical:9,alignItems:"center",elevation:1},planMin:{fontSize:11,fontWeight:"900"},planLabel:{fontSize:10,fontWeight:"700",marginTop:2},lessonHeading:{flexDirection:"row-reverse",justifyContent:"space-between",alignItems:"flex-start",marginTop:4,marginBottom:4,gap:12},eyebrow:{fontSize:11,fontWeight:"800",textAlign:"right"},title:{fontSize:21,fontWeight:"800",textAlign:"right",marginTop:2},dailyBadge:{flexDirection:"row-reverse",alignItems:"center",gap:4,paddingHorizontal:8,paddingVertical:6,borderRadius:999},dailyBadgeText:{fontSize:10,fontWeight:"800"},characterStage:{height:190,alignItems:"center",justifyContent:"flex-end",position:"relative"},glow:{position:"absolute",width:180,height:92,borderRadius:999,bottom:6},card:{borderRadius:26,padding:16,marginTop:4,shadowOpacity:.08,shadowRadius:16,elevation:3},cardLabelRow:{flexDirection:"row-reverse",alignItems:"center",gap:6,marginBottom:12},cardDot:{width:8,height:8,borderRadius:99},cardLabel:{fontSize:12,fontWeight:"800",textAlign:"right"},question:{fontSize:16,lineHeight:25,fontWeight:"700",textAlign:"right",writingDirection:"rtl",marginBottom:13},hint:{fontSize:11,textAlign:"right",writingDirection:"rtl",marginBottom:10},answer:{minHeight:54,borderWidth:1.2,borderRadius:16,paddingHorizontal:12,paddingVertical:10,flexDirection:"row-reverse",alignItems:"center",gap:10,marginBottom:9},answerMarker:{width:28,height:28,borderRadius:10,borderWidth:1.5,alignItems:"center",justifyContent:"center"},answerText:{flex:1,fontSize:13,lineHeight:20,textAlign:"right",writingDirection:"rtl",fontWeight:"600"},action:{minHeight:52,borderRadius:16,flexDirection:"row-reverse",alignItems:"center",justifyContent:"center",gap:8,marginTop:4},actionText:{color:"#fff",fontSize:13,fontWeight:"800"},feedback:{borderWidth:1,borderRadius:18,padding:12,marginTop:5},feedbackHead:{flexDirection:"row-reverse",alignItems:"center",gap:7},feedbackTitle:{fontSize:13,fontWeight:"900",textAlign:"right"},feedbackText:{fontSize:12,lineHeight:19,textAlign:"right",writingDirection:"rtl",marginTop:7},nextFeedback:{marginTop:10,minHeight:44,borderRadius:13,flexDirection:"row-reverse",justifyContent:"center",alignItems:"center",gap:7},input:{minHeight:54,borderWidth:1.2,borderRadius:16,paddingHorizontal:13,backgroundColor:"#fff",fontSize:14,writingDirection:"rtl",marginBottom:9},speech:{borderWidth:1,borderRadius:18,padding:13,flexDirection:"row-reverse",alignItems:"flex-start",gap:8,marginBottom:12},speechText:{flex:1,fontSize:14,lineHeight:23,textAlign:"right",writingDirection:"rtl"},twoCol:{flexDirection:"row-reverse",gap:10,marginBottom:8},chip:{flex:1,minHeight:54,borderWidth:1.2,borderRadius:16,alignItems:"center",justifyContent:"center"},chipText:{fontSize:15,fontWeight:"800"},scenario:{borderWidth:1,borderRadius:18,padding:14,marginBottom:12},scenarioText:{fontSize:14,lineHeight:23,textAlign:"right",writingDirection:"rtl"},dropdown:{minHeight:55,borderWidth:1.2,borderRadius:16,paddingHorizontal:14,flexDirection:"row-reverse",alignItems:"center",justifyContent:"space-between",marginBottom:9},grid:{flexDirection:"row",flexWrap:"wrap",gap:9},visualChoice:{width:"48%",minHeight:105,borderWidth:1.2,borderRadius:18,alignItems:"center",justifyContent:"center",padding:9},visualText:{fontSize:12,fontWeight:"700",textAlign:"center",marginTop:7},scaleRow:{flexDirection:"row-reverse",justifyContent:"space-between",marginTop:8},scaleDot:{width:50,height:50,borderRadius:25,alignItems:"center",justifyContent:"center"},numberMarker:{width:28,height:28,borderRadius:10,alignItems:"center",justifyContent:"center"},numberText:{color:"#fff",fontWeight:"800",fontSize:11}
});
