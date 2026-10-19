import { View } from "react-native";
import Svg, { Rect, Line, Circle } from "react-native-svg";
import { PRIMARY, ACCENT_YELLOW } from "../lib/constants.js";

const STROKE = PRIMARY;

// Simple schematic line-drawings for the EV charger "Guide me" questions —
// same approach as the other guided walkthroughs: original vector line-art,
// not photos, so there's nothing to license.

function OutletIllustration() {
  return (
    <Svg width={220} height={130} viewBox="0 0 220 130">
      <Rect x={75} y={20} width={70} height={95} rx={10} fill="white" stroke={STROKE} strokeWidth={2.5} />
      <Line x1={98} y1={45} x2={98} y2={68} stroke={STROKE} strokeWidth={5} strokeLinecap="round" />
      <Line x1={122} y1={45} x2={122} y2={68} stroke={STROKE} strokeWidth={5} strokeLinecap="round" />
      <Circle cx={110} cy={92} r={6} fill="none" stroke={STROKE} strokeWidth={3.5} />
    </Svg>
  );
}

function HardwireIllustration() {
  return (
    <Svg width={220} height={130} viewBox="0 0 220 130">
      <Rect x={40} y={15} width={140} height={100} fill="#F5F8F0" stroke={STROKE} strokeWidth={2} />
      <Rect x={75} y={30} width={70} height={48} rx={6} fill={ACCENT_YELLOW} stroke={STROKE} strokeWidth={2.5} />
      <Circle cx={110} cy={48} r={10} fill="none" stroke={STROKE} strokeWidth={2} />
      <Line x1={110} y1={78} x2={110} y2={100} stroke={STROKE} strokeWidth={3} />
      <Circle cx={110} cy={100} r={3.5} fill={STROKE} />
    </Svg>
  );
}

const ILLUSTRATIONS = {
  start: OutletIllustration,
  hardwire_check: HardwireIllustration,
};

export default function EvChargerGuideIllustration({ guideKey }) {
  const Illustration = ILLUSTRATIONS[guideKey];
  if (!Illustration) return null;
  return (
    <View className="items-center justify-center mb-4" style={{ height: 130 }}>
      <Illustration />
    </View>
  );
}
