import { View } from "react-native";
import Svg, { Rect, Circle, Line, Polygon, Path, G } from "react-native-svg";
import { PRIMARY, ACCENT_YELLOW } from "../lib/constants.js";

const STROKE = PRIMARY;
const DUCT = "#9C978C";

// Simple schematic line-drawings for the HVAC "Guide me" questions — not
// real photos, so there's nothing to license, but still enough of a visual
// cue (a vent, a flame, a wall unit) that the yes/no question is easier to
// answer without already knowing HVAC terminology.

function DuctworkIllustration() {
  return (
    <Svg width={220} height={130} viewBox="0 0 220 130">
      <Polygon points="20,62 110,18 200,62" fill="#EAF1F8" stroke={STROKE} strokeWidth={2.5} strokeLinejoin="round" />
      <Rect x={30} y={62} width={160} height={52} fill="white" stroke={STROKE} strokeWidth={2.5} />
      <Line x1={45} y1={80} x2={175} y2={80} stroke={DUCT} strokeWidth={3} strokeDasharray="5,4" />
      {[62, 110, 158].map((cx) => (
        <G key={cx}>
          <Line x1={cx} y1={80} x2={cx} y2={92} stroke={DUCT} strokeWidth={3} />
          <Rect x={cx - 12} y={92} width={24} height={9} rx={2} fill={ACCENT_YELLOW} stroke={STROKE} strokeWidth={1.5} />
          <Line x1={cx - 7} y1={96.5} x2={cx + 7} y2={96.5} stroke={STROKE} strokeWidth={1} />
        </G>
      ))}
    </Svg>
  );
}

function PackagedUnitIllustration() {
  return (
    <Svg width={220} height={130} viewBox="0 0 220 130">
      <Rect x={20} y={55} width={110} height={58} fill="white" stroke={STROKE} strokeWidth={2.5} />
      <Polygon points="12,55 75,22 138,55" fill="#EAF1F8" stroke={STROKE} strokeWidth={2.5} strokeLinejoin="round" />
      <Line x1={130} y1={95} x2={158} y2={95} stroke={DUCT} strokeWidth={4} />
      <Rect x={158} y={70} width={48} height={50} rx={4} fill={ACCENT_YELLOW} stroke={STROKE} strokeWidth={2.5} />
      <Circle cx={182} cy={88} r={10} fill="white" stroke={STROKE} strokeWidth={1.8} />
      <Line x1={182} y1={79} x2={182} y2={97} stroke={STROKE} strokeWidth={1.5} />
      <Line x1={173} y1={88} x2={191} y2={88} stroke={STROKE} strokeWidth={1.5} />
      <Path d="M172 108 L178 100 L186 100 L192 108 Z" fill="white" stroke={STROKE} strokeWidth={1.5} strokeLinejoin="round" />
    </Svg>
  );
}

function FurnaceIllustration() {
  return (
    <Svg width={220} height={130} viewBox="0 0 220 130">
      <Polygon points="20,62 110,18 200,62" fill="#EAF1F8" stroke={STROKE} strokeWidth={2.5} strokeLinejoin="round" />
      <Rect x={30} y={62} width={160} height={52} fill="white" stroke={STROKE} strokeWidth={2.5} />
      <Rect x={88} y={75} width={44} height={44} rx={4} fill={ACCENT_YELLOW} stroke={STROKE} strokeWidth={2.5} />
      <Path
        d="M110 80
           C101 91 104 96 99 101
           C95 105 98 111 106 113
           C103 107 109 103 110 107
           C111 103 117 107 114 113
           C122 111 125 105 121 101
           C116 96 119 91 110 80 Z"
        fill="white"
        stroke={STROKE}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function WallUnitIllustration() {
  return (
    <Svg width={220} height={130} viewBox="0 0 220 130">
      <Rect x={60} y={14} width={100} height={102} fill="#F5F8F0" stroke={STROKE} strokeWidth={2.5} />
      <Rect x={86} y={50} width={48} height={30} rx={3} fill={ACCENT_YELLOW} stroke={STROKE} strokeWidth={2.5} />
      <Line x1={93} y1={60} x2={127} y2={60} stroke={STROKE} strokeWidth={1.2} />
      <Line x1={93} y1={66} x2={127} y2={66} stroke={STROKE} strokeWidth={1.2} />
      <Line x1={93} y1={72} x2={127} y2={72} stroke={STROKE} strokeWidth={1.2} />
    </Svg>
  );
}

const ILLUSTRATIONS = {
  start: DuctworkIllustration,
  packaged_check: PackagedUnitIllustration,
  heat_source: FurnaceIllustration,
  wall_unit: WallUnitIllustration,
};

export default function HvacGuideIllustration({ guideKey }) {
  const Illustration = ILLUSTRATIONS[guideKey];
  if (!Illustration) return null;
  return (
    <View className="items-center justify-center mb-4" style={{ height: 130 }}>
      <Illustration />
    </View>
  );
}
