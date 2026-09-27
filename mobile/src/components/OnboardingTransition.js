import { useEffect, useState } from "react";
import { View, Text, Image, Animated, Easing } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { PRIMARY, HERO_BG_TOP, HERO_BG_BOTTOM } from "../lib/constants.js";

// A brief full-screen "beat" between onboarding steps — a gently pulsing icon
// (a lucide icon component via `icon`, or the app logo via `image`) over a
// short message. Purely cosmetic (no data loading of its own); the caller
// decides how long it stays up, whether that's a fixed timer or however long
// some real work takes.
export default function OnboardingTransition({ icon: Icon, image, message }) {
  const insets = useSafeAreaInsets();
  const [scale] = useState(() => new Animated.Value(1));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.15, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [scale]);

  return (
    <LinearGradient colors={[HERO_BG_TOP, HERO_BG_BOTTOM]} style={{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <View className="flex-1 px-8 justify-center items-center">
        <View
          className="rounded-full items-center justify-center mb-8"
          style={{ width: 132, height: 132, backgroundColor: "rgba(255,255,255,0.5)" }}
        >
          <Animated.View className="rounded-full items-center justify-center bg-white" style={{ width: 88, height: 88, transform: [{ scale }] }}>
            {image ? <Image source={image} style={{ width: 56, height: 52 }} resizeMode="contain" /> : <Icon size={40} color={PRIMARY} />}
          </Animated.View>
        </View>
        <Text className="text-[17px] font-semibold text-center px-4" style={{ color: PRIMARY }}>
          {message}
        </Text>
      </View>
    </LinearGradient>
  );
}
