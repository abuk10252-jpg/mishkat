import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Path, Circle, Ellipse, G, Rect } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { Palette } from "../theme/colors";

export type CompanionMood = "neutral" | "happy" | "thinking" | "encouraging";
const MOOD_ICON: Record<CompanionMood, keyof typeof Ionicons.glyphMap> = {
  neutral: "moon-outline", happy: "sparkles-outline", thinking: "help-circle-outline", encouraging: "heart-outline",
};

export type Outfit = {
  name: string; hijab: string; robe: string; trim: string; accent: string; embroidery: number;
};

// 10 outfits: different silhouettes, not just different colors.
export const OUTFITS: Outfit[] = [
  { name: "الملكية المطرزة", hijab: "#6F3D58", robe: "#A95778", trim: "#E8C88A", accent: "#F4E6D4", embroidery: 0 },
  { name: "العباءة الواسعة", hijab: "#4A5575", robe: "#7082A6", trim: "#D9C7A0", accent: "#F7EFE2", embroidery: 1 },
  { name: "الكاب الهادئ", hijab: "#4C5F4D", robe: "#728A68", trim: "#D9B878", accent: "#F1E8D8", embroidery: 2 },
  { name: "الكيمونو المحتشم", hijab: "#6A4A7B", robe: "#9672A7", trim: "#EBC5D7", accent: "#FFF4F7", embroidery: 3 },
  { name: "المخمل الناعم", hijab: "#62483B", robe: "#8A6958", trim: "#D8B982", accent: "#F5E9D7", embroidery: 4 },
  { name: "الفستان الطبقي", hijab: "#28676C", robe: "#4E9290", trim: "#D9D09B", accent: "#F4EFE2", embroidery: 5 },
  { name: "العباءة المقصوصة", hijab: "#30384E", robe: "#4C5874", trim: "#B8C9D8", accent: "#EAF0F5", embroidery: 6 },
  { name: "الأكمام الواسعة", hijab: "#75465E", robe: "#B2768C", trim: "#F0D1A8", accent: "#FFF5EA", embroidery: 7 },
  { name: "المعطف الشرقي", hijab: "#8A5D32", robe: "#B48754", trim: "#F0D68E", accent: "#FFF4D9", embroidery: 8 },
  { name: "الأبيض اللؤلؤي", hijab: "#746E7A", robe: "#E6DDE0", trim: "#B67A98", accent: "#FFFFFF", embroidery: 9 },
];

const SKIN = "#D9A078";
function defaultOutfitIndex() {
  const day = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return day % OUTFITS.length;
}

function Embroidery({ kind, c }: { kind: number; c: string }) {
  if (kind === 0) return <G stroke={c} fill="none" strokeWidth="1.7"><Path d="M60 84 L60 168"/><Path d="M32 161 Q60 177 88 161"/><Path d="M47 101 Q60 88 73 101 Q60 114 47 101Z"/></G>;
  if (kind === 1) return <G stroke={c} fill="none" strokeWidth="1.6"><Path d="M27 88 Q43 104 43 155"/><Path d="M93 88 Q77 104 77 155"/><Path d="M37 158 Q60 170 83 158"/></G>;
  if (kind === 2) return <G stroke={c} fill="none" strokeWidth="1.5"><Path d="M60 82 L60 170"/><Path d="M39 101 L51 113 L39 125 L51 137 L39 149"/><Path d="M81 101 L69 113 L81 125 L69 137 L81 149"/></G>;
  if (kind === 3) return <G stroke={c} fill="none" strokeWidth="1.7"><Path d="M60 83 L60 169"/><Path d="M42 99 Q60 113 78 99"/><Path d="M42 121 Q60 135 78 121"/><Path d="M42 143 Q60 157 78 143"/></G>;
  if (kind === 4) return <G stroke={c} fill="none" strokeWidth="1.5"><Path d="M26 157 Q60 177 94 157"/><Path d="M34 146 Q60 161 86 146"/><Circle cx="60" cy="105" r="8"/><Path d="M52 105 L68 105 M60 97 L60 113"/></G>;
  if (kind === 5) return <G stroke={c} fill="none" strokeWidth="1.6"><Path d="M35 165 Q60 148 85 165"/><Path d="M42 153 Q60 137 78 153"/><Path d="M48 141 Q60 128 72 141"/></G>;
  if (kind === 6) return <G stroke={c} fill="none" strokeWidth="1.5"><Path d="M23 166 L40 151 L53 166 L67 151 L80 166 L97 151"/><Path d="M60 86 L60 145"/></G>;
  if (kind === 7) return <G stroke={c} fill="none" strokeWidth="1.7"><Path d="M29 96 Q42 110 42 158"/><Path d="M91 96 Q78 110 78 158"/><Path d="M35 156 Q60 174 85 156"/></G>;
  if (kind === 8) return <G stroke={c} fill="none" strokeWidth="1.6"><Path d="M60 84 L60 170"/><Path d="M31 150 L44 138 L57 150 L70 138 L83 150"/><Path d="M42 106 L60 94 L78 106"/></G>;
  return <G stroke={c} fill="none" strokeWidth="1.5"><Path d="M60 86 L60 169"/><Path d="M37 158 Q60 174 83 158"/><Circle cx="60" cy="107" r="5"/><Circle cx="60" cy="122" r="3"/><Circle cx="60" cy="135" r="3"/></G>;
}

export function Rafiqati({ mood = "neutral", palette, size = 96, outfitIndex, showMoodIcon = true }: {
  mood?: CompanionMood; palette: Palette; size?: number; outfitIndex?: number; showMoodIcon?: boolean;
}) {
  const outfit = useMemo(() => OUTFITS[outfitIndex ?? defaultOutfitIndex()], [outfitIndex]);
  const mouth = mood === "thinking" ? "M52 47 Q60 44 68 47" : "M50 44 Q60 55 70 44";
  const body = outfit.robe;
  return (
    <View style={{ width: size, height: size * 1.62 }}>
      <Svg width="100%" height="100%" viewBox="0 0 120 195">
        <G>
          <Ellipse cx="60" cy="185" rx="35" ry="7" fill="#00000018" />
          {/* 10 silhouette families */}
          {outfit.embroidery === 0 && <Path d="M35 73 Q22 87 16 119 L10 178 Q60 190 110 178 L104 119 Q98 87 85 73Z" fill={body}/>} 
          {outfit.embroidery === 1 && <Path d="M39 72 L22 93 L9 176 Q60 190 111 176 L98 93 L81 72Z" fill={body}/>} 
          {outfit.embroidery === 2 && <Path d="M37 74 Q20 91 19 123 L14 178 L106 178 L101 123 Q100 91 83 74Z" fill={body}/>} 
          {outfit.embroidery === 3 && <Path d="M38 72 L19 94 L31 113 L22 178 Q60 188 98 178 L89 113 L101 94 L82 72Z" fill={body}/>} 
          {outfit.embroidery === 4 && <Path d="M39 72 Q28 92 28 118 L22 176 Q60 187 98 176 L92 118 Q92 92 81 72Z" fill={body}/>} 
          {outfit.embroidery === 5 && <Path d="M36 72 Q26 93 26 116 L17 151 Q60 168 103 151 L94 116 Q94 93 84 72Z" fill={body}/>} 
          {outfit.embroidery === 6 && <Path d="M37 72 L23 95 L20 145 L8 177 L112 177 L100 145 L97 95 L83 72Z" fill={body}/>} 
          {outfit.embroidery === 7 && <Path d="M38 72 Q18 88 10 132 L4 171 Q18 180 34 176 L60 165 L86 176 Q102 180 116 171 L110 132 Q102 88 82 72Z" fill={body}/>} 
          {outfit.embroidery === 8 && <Path d="M36 72 L18 92 L26 116 L17 178 L103 178 L94 116 L102 92 L84 72Z" fill={body}/>} 
          {outfit.embroidery === 9 && <Path d="M37 72 Q26 92 27 121 L21 177 Q60 188 99 177 L93 121 Q94 92 83 72Z" fill={body}/>} 
          {/* sleeves / inner dress */}
          <Path d="M45 78 Q36 98 37 132 L42 171 L78 171 L83 132 Q84 98 75 78Z" fill={outfit.accent} opacity="0.95"/>
          <Embroidery kind={outfit.embroidery} c={outfit.trim}/>
          {/* hands */}
          <Ellipse cx="27" cy="119" rx="5.3" ry="8.5" fill={SKIN} transform="rotate(-12 27 119)"/>
          <Ellipse cx="93" cy="119" rx="5.3" ry="8.5" fill={SKIN} transform="rotate(12 93 119)"/>
          {/* hijab: rounded character silhouette */}
          <Path d="M39 33 Q40 7 60 5 Q80 7 81 33 L89 65 Q90 79 60 85 Q30 79 31 65Z" fill={outfit.hijab}/>
          <Path d="M36 53 Q60 71 84 53 L88 69 Q60 90 32 69Z" fill={outfit.hijab}/>
          <Path d="M45 66 Q60 73 75 66" stroke={outfit.trim} strokeWidth="1.6" fill="none" opacity="0.9"/>
          {/* face */}
          <Ellipse cx="60" cy="37" rx="15.5" ry="17.5" fill={SKIN}/>
          <Path d="M47 30 Q53 26 57 29 M63 29 Q68 26 73 30" stroke="#3A2928" strokeWidth="1.7" fill="none" strokeLinecap="round"/>
          <Ellipse cx="53" cy="37" rx="3.1" ry="4" fill="#30252A"/>
          <Ellipse cx="67" cy="37" rx="3.1" ry="4" fill="#30252A"/>
          <Circle cx="54" cy="36" r="0.9" fill="#fff"/><Circle cx="68" cy="36" r="0.9" fill="#fff"/>
          <Path d={mouth} stroke="#7A4A3A" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
          <Circle cx="60" cy="70" r="3" fill={outfit.trim}/>
          {/* tiny flower pin changes with outfit */}
          <G transform="translate(78 26)"><Circle cx="0" cy="0" r="3" fill={outfit.trim}/><Circle cx="0" cy="-4" r="2" fill={outfit.trim}/><Circle cx="4" cy="0" r="2" fill={outfit.trim}/><Circle cx="0" cy="4" r="2" fill={outfit.trim}/><Circle cx="-4" cy="0" r="2" fill={outfit.trim}/></G>
        </G>
      </Svg>
      {showMoodIcon && <View style={[styles.moodBadge,{backgroundColor:palette.accent,right:size*.02,top:size*.02}]}><Ionicons name={MOOD_ICON[mood]} size={Math.max(12,size*.16)} color="#fff"/></View>}
    </View>
  );
}

export function RafiqatiBubble({ text, mood="neutral", palette, outfitIndex }: {text:string;mood?:CompanionMood;palette:Palette;outfitIndex?:number}) {
  return <View style={styles.row}><Rafiqati mood={mood} palette={palette} size={58} outfitIndex={outfitIndex}/><View style={[styles.bubble,{borderColor:palette.accent}]}><Text style={styles.bubbleText}>{text}</Text></View></View>;
}
const styles=StyleSheet.create({
  moodBadge:{position:"absolute",borderRadius:999,padding:4},
  row:{flexDirection:"row-reverse",gap:10,marginBottom:16,alignItems:"flex-start"},
  bubble:{flex:1,borderWidth:.5,borderRadius:16,padding:12,backgroundColor:"#fff",marginTop:8},
  bubbleText:{fontSize:14,lineHeight:22,textAlign:"right",writingDirection:"rtl"},
});
