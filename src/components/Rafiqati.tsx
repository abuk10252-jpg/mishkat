import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Image, Animated, Easing } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Palette } from "../theme/colors";

// رفيقتي — شخصية كاملة الجسم برسمة فنية حقيقية، مع طبقة حركة بسيطة فوق
// الصور الثابتة (تنفّس مستمر + انتقال ناعم بين الحالات المزاجية + قفزة فرح
// لحظة الإجابة الصح). دي مش رسوم متحركة حقيقية بمفاصل منفصلة (ده محتاج أداة
// رسم/تحريك متخصصة زي Rive وفنان مخصص لتفكيك الشخصية لطبقات) — لكنها بتدي
// إحساس "حية" حقيقي بدون أي مكتبة إضافية، باستخدام Animated المدمجة في
// React Native نفسها.

export type CompanionMood = "neutral" | "happy" | "thinking" | "encouraging";

const MOOD_IMAGES: Record<CompanionMood, any> = {
  neutral: require("../../assets/rafiqati/neutral.png"),
  happy: require("../../assets/rafiqati/happy.png"),
  thinking: require("../../assets/rafiqati/thinking.png"),
  encouraging: require("../../assets/rafiqati/encouraging.png"),
};

const MOOD_ICON: Record<CompanionMood, keyof typeof Ionicons.glyphMap> = {
  neutral: "moon-outline",
  happy: "sparkles-outline",
  thinking: "help-circle-outline",
  encouraging: "heart-outline",
};

// النسبة الحقيقية لأبعاد صور رفيقتي (500×666).
const ASPECT_RATIO = 666 / 500;

export function Rafiqati({
  mood = "neutral",
  palette,
  size = 96,
  showMoodIcon = true,
}: {
  mood?: CompanionMood;
  palette: Palette;
  size?: number;
  outfitIndex?: number; // محفوظة للتوافق، غير مستخدمة حاليًا
  showMoodIcon?: boolean;
}) {
  const height = Math.round(size * ASPECT_RATIO);

  // -- التنفّس: تكبير/تصغير بسيط مستمر، عشان تحس إنها "واقفة حية" مش صورة مجمّدة.
  const breathe = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(breathe, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);
  const breatheScale = breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 1.025] });

  // -- الانتقال الناعم بين الحالات المزاجية: صورتين فوق بعض، القديمة بتختفي
  // والجديدة بتظهر بدل ما تتقفز فجأة.
  const [displayedMood, setDisplayedMood] = useState(mood);
  const [prevMood, setPrevMood] = useState<CompanionMood | null>(null);
  const crossfade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (mood === displayedMood) return;
    setPrevMood(displayedMood);
    setDisplayedMood(mood);
    crossfade.setValue(0);
    Animated.timing(crossfade, {
      toValue: 1,
      duration: 350,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(() => setPrevMood(null));
  }, [mood]);

  // -- قفزة فرح لحظة ما تدخل حالة "سعيدة" (إجابة صح).
  const bounce = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (mood !== "happy") return;
    bounce.setValue(0);
    Animated.sequence([
      Animated.timing(bounce, { toValue: 1, duration: 160, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.spring(bounce, { toValue: 0, friction: 3, useNativeDriver: true }),
    ]).start();
  }, [mood]);
  const bounceTranslateY = bounce.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });

  return (
    <View style={{ width: size, height }}>
      <Animated.View
        style={{
          width: size,
          height,
          transform: [{ scale: breatheScale }, { translateY: bounceTranslateY }],
        }}
      >
        {prevMood && (
          <Animated.Image
            source={MOOD_IMAGES[prevMood]}
            style={[StyleSheet.absoluteFill, { opacity: crossfade.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }]}
            resizeMode="contain"
          />
        )}
        <Animated.Image
          source={MOOD_IMAGES[displayedMood]}
          style={[StyleSheet.absoluteFill, prevMood ? { opacity: crossfade } : null]}
          resizeMode="contain"
        />
      </Animated.View>
      {showMoodIcon && (
        <View
          style={[
            styles.moodBadge,
            { backgroundColor: palette.accent, right: size * 0.02, top: size * 0.02 },
          ]}
        >
          <Ionicons name={MOOD_ICON[mood]} size={Math.max(12, size * 0.16)} color="#fff" />
        </View>
      )}
    </View>
  );
}

export function RafiqatiBubble({
  text,
  mood = "neutral",
  palette,
}: {
  text: string;
  mood?: CompanionMood;
  palette: Palette;
  outfitIndex?: number; // محفوظة للتوافق، غير مستخدمة حاليًا
}) {
  return (
    <View style={styles.row}>
      <Rafiqati mood={mood} palette={palette} size={64} />
      <View style={[styles.bubble, { borderColor: palette.accent }]}>
        <Text style={styles.bubbleText}>{text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  moodBadge: {
    position: "absolute",
    borderRadius: 999,
    padding: 4,
  },
  row: {
    flexDirection: "row-reverse",
    gap: 10,
    marginBottom: 16,
    alignItems: "flex-start",
  },
  bubble: {
    flex: 1,
    borderWidth: 0.5,
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#fff",
    marginTop: 8,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: "right",
    writingDirection: "rtl",
  },
});
