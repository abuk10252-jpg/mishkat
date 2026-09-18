import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Image, Animated, Easing } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Palette } from "../theme/colors";
import { CompanionCustomization, DEFAULT_COMPANION_CUSTOMIZATION } from "../utils/storage";

// رفيقتي — شخصية محجبة برسمة فنية، مع حركة بسيطة (تنفس + انتقال مزاج + قفزة).
// تُعرض بشكل مضغوط يركز على الوجه والكتفين لتتناسب مع البطاقات الصغيرة
// وتظهر كرفيقة واضحة التفاصيل دون أن تأخذ مساحة كبيرة.

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

// نعرض الجزء العلوي فقط (الوجه + الحجاب + الكتفين) لتصبح أصغر وأوضح.
// الصورة الأصلية 500×666، نأخذ تقريباً أول 55% من الارتفاع.
const CROP_RATIO = 0.55;
const OUTFIT_COLORS: Record<CompanionCustomization["outfit"], string> = {
  rose: "#E78BAA",
  sunrise: "#E7A33E",
  lavender: "#9974C6",
  mint: "#68BFA8",
};
const ACCESSORY_ICONS: Record<CompanionCustomization["accessory"], keyof typeof Ionicons.glyphMap | null> = {
  none: null,
  book: "book-outline",
  sparkle: "sparkles-outline",
  flower: "flower-outline",
};

export function Rafiqati({
  mood = "neutral",
  palette,
  size = 72,
  showMoodIcon = true,
  customization = DEFAULT_COMPANION_CUSTOMIZATION,
}: {
  mood?: CompanionMood;
  palette: Palette;
  size?: number;
  outfitIndex?: number;
  showMoodIcon?: boolean;
  customization?: CompanionCustomization;
}) {
  // الارتفاع المعروض أصغر من الجسم الكامل ليظهر الوجه بوضوح.
  const displayHeight = Math.round(size * 1.15);
  // الارتفاع الحقيقي للصورة داخل الحاوية (نكبّرها قليلاً ثم نقص الجزء السفلي).
  const imageHeight = Math.round(displayHeight / CROP_RATIO);

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
  const sway = useRef(new Animated.Value(0)).current;
  const bob = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const swayLoop = Animated.loop(Animated.sequence([
      Animated.timing(sway, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(sway, { toValue: -1, duration: 2800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(sway, { toValue: 0, duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    const bobLoop = Animated.loop(Animated.sequence([
      Animated.timing(bob, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(bob, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    swayLoop.start();
    bobLoop.start();
    return () => { swayLoop.stop(); bobLoop.stop(); };
  }, []);
  const swayRotate = sway.interpolate({ inputRange: [-1, 0, 1], outputRange: ["-2deg", "0deg", "2deg"] });
  const bobTranslate = bob.interpolate({ inputRange: [0, 1], outputRange: [0, -3] });

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

  const bounce = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (mood !== "happy") return;
    bounce.setValue(0);
    Animated.sequence([
      Animated.timing(bounce, { toValue: 1, duration: 160, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.spring(bounce, { toValue: 0, friction: 3, useNativeDriver: true }),
    ]).start();
  }, [mood]);
  const bounceTranslateY = bounce.interpolate({ inputRange: [0, 1], outputRange: [0, -8] });

  return (
    <View style={{ width: size, height: displayHeight, overflow: "hidden" }}>
      <Animated.View
        style={{
          width: size,
          height: imageHeight,
          transform: [{ scale: breatheScale }, { rotate: swayRotate }, { translateY: bobTranslate }, { translateY: bounceTranslateY }],
        }}
      >
        {prevMood && (
          <Animated.Image
            source={MOOD_IMAGES[prevMood]}
            style={[StyleSheet.absoluteFill, { opacity: crossfade.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }]}
            resizeMode="cover"
          />
        )}
        <Animated.Image
          source={MOOD_IMAGES[displayedMood]}
          style={[StyleSheet.absoluteFill, prevMood ? { opacity: crossfade } : null]}
          resizeMode="cover"
        />
        <Animated.View pointerEvents="none" style={[styles.sparkle, { backgroundColor: palette.accent, opacity: breathe, top: size * 0.18, left: size * 0.08 }]} />
        <Animated.View pointerEvents="none" style={[styles.sparkleSmall, { backgroundColor: palette.accent, opacity: crossfade, top: size * 0.38, right: size * 0.04 }]} />
        <View pointerEvents="none" style={[styles.outfitGlow, { backgroundColor: OUTFIT_COLORS[customization.outfit], opacity: 0.22, bottom: size * 0.08, left: size * 0.22 }]} />
        {ACCESSORY_ICONS[customization.accessory] && (
          <View pointerEvents="none" style={[styles.accessoryBadge, { backgroundColor: OUTFIT_COLORS[customization.outfit], top: size * 0.42, left: size * 0.08 }]}>
            <Ionicons name={ACCESSORY_ICONS[customization.accessory]!} size={Math.max(11, size * 0.13)} color="#fff" />
          </View>
        )}
      </Animated.View>
      {showMoodIcon && (
        <View
          style={[
            styles.moodBadge,
            { backgroundColor: palette.accent, right: size * 0.02, top: size * 0.02 },
          ]}
        >
          <Ionicons name={MOOD_ICON[mood]} size={Math.max(11, size * 0.15)} color="#fff" />
        </View>
      )}
    </View>
  );
}

export function RafiqatiBubble({
  text,
  mood = "neutral",
  palette,
  customization,
}: {
  text: string;
  mood?: CompanionMood;
  palette: Palette;
  customization?: CompanionCustomization;
  outfitIndex?: number;
}) {
  return (
    <View style={styles.row}>
      <Rafiqati mood={mood} palette={palette} size={48} customization={customization} />
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
    padding: 3,
  },
  sparkle: { position: "absolute", width: 5, height: 5, borderRadius: 5 },
  sparkleSmall: { position: "absolute", width: 3.5, height: 3.5, borderRadius: 4 },
  outfitGlow: { position: "absolute", width: "50%", height: "18%", borderRadius: 999 },
  accessoryBadge: { position: "absolute", borderRadius: 999, padding: 3, shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 4, elevation: 2 },
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
    marginTop: 4,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: "right",
    writingDirection: "rtl",
  },
});
