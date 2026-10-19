import { View } from "react-native";
import Svg, { Rect, Polygon, Path, Line } from "react-native-svg";
import { PRIMARY, ACCENT_YELLOW } from "../lib/constants.js";

const STROKE = PRIMARY;
const CABLE = "#9C978C";

// Simple schematic line-drawings for the backup generator "Guide me"
// questions — same approach as the HVAC/water heater ones: original vector
// line-art, not photos, so there's nothing to license.

function AutoStandbyIllustration() {
  return (
    <Svg width={220} height={130} viewBox="0 0 220 130">
      <Polygon points="12,55 75,22 138,55" fill="#EAF1F8" stroke={STROKE} strokeWidth={2.5} strokeLinejoin="round" />
      <Rect x={20} y={55} width={110} height={58} fill="white" stroke={STROKE} strokeWidth={2.5} />
      <Line x1={130} y1={95} x2={158} y2={95} stroke={CABLE} strokeWidth={3} strokeDasharray="4,3" />
      <Rect x={158} y={70} width={48} height={50} rx={4} fill={ACCENT_YELLOW} stroke={STROKE} strokeWidth={2.5} />
      <Path
        d="M189 79 L175 99 L183 99 L180 110 L195 90 L187 90 Z"
        fill="white"
        stroke={STROKE}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function FuelDrumIllustration() {
  return (
    <Svg width={220} height={130} viewBox="0 0 220 130">
      <Rect x={85} y={28} width={50} height={82} rx={8} fill="white" stroke={STROKE} strokeWidth={2.5} />
      <Rect x={85} y={28} width={50} height={10} rx={4} fill={ACCENT_YELLOW} stroke={STROKE} strokeWidth={1.5} />
      <Rect x={85} y={63} width={50} height={10} fill={ACCENT_YELLOW} stroke={STROKE} strokeWidth={1.5} />
      <Rect x={85} y={100} width={50} height={10} rx={4} fill={ACCENT_YELLOW} stroke={STROKE} strokeWidth={1.5} />
    </Svg>
  );
}

function PortableHandleIllustration() {
  return (
    <Svg width={220} height={130} viewBox="0 0 220 130">
      <Path d="M90 55 C90 38 130 38 130 55" fill="none" stroke={STROKE} strokeWidth={3} strokeLinecap="round" />
      <Rect x={70} y={55} width={80} height={50} rx={8} fill={ACCENT_YELLOW} stroke={STROKE} strokeWidth={2.5} />
      <Line x1={85} y1={74} x2={135} y2={74} stroke={STROKE} strokeWidth={1.2} />
      <Line x1={85} y1={82} x2={135} y2={82} stroke={STROKE} strokeWidth={1.2} />
      <Line x1={85} y1={90} x2={135} y2={90} stroke={STROKE} strokeWidth={1.2} />
    </Svg>
  );
}

const ILLUSTRATIONS = {
  start: AutoStandbyIllustration,
  fuel_check: FuelDrumIllustration,
  size_check: PortableHandleIllustration,
};

export default function GeneratorGuideIllustration({ guideKey }) {
  const Illustration = ILLUSTRATIONS[guideKey];
  if (!Illustration) return null;
  return (
    <View className="items-center justify-center mb-4" style={{ height: 130 }}>
      <Illustration />
    </View>
  );
}
