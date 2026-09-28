import { useEffect, useRef } from "react";
import { Dimensions } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from "react-native-reanimated";
import { useTabTransition } from "../lib/tab-transition.js";

// Slides a tab's content in the same direction the web app's tabs do: right
// when moving forward through TAB_ORDER, left when moving back. Matches the
// web version's 320ms / cubic-bezier(0.32, 0.72, 0, 1) curve.
export default function AnimatedTabScreen({ tabKey, style, children }) {
  const { activeTabKey, direction, navCount } = useTabTransition();
  const isActive = activeTabKey === tabKey;
  const lastAnimatedNavCount = useRef(-1);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (!isActive || navCount === 0 || lastAnimatedNavCount.current === navCount) return;
    lastAnimatedNavCount.current = navCount;

    const width = Dimensions.get("window").width;
    translateX.value = direction === "left" ? -width : width;
    opacity.value = 0.4;
    const easing = Easing.bezier(0.32, 0.72, 0, 1);
    translateX.value = withTiming(0, { duration: 320, easing });
    opacity.value = withTiming(1, { duration: 320, easing });
  }, [isActive, navCount, direction]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }));

  return <Animated.View style={[{ flex: 1 }, style, animatedStyle]}>{children}</Animated.View>;
}
