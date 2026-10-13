import { View } from "react-native";
import Svg, { Rect, Circle, Line, Polygon, Path, G } from "react-native-svg";
import { PRIMARY, ACCENT_YELLOW } from "../lib/constants.js";

const STROKE = PRIMARY;
const DUCT = "#9C978C";

// Simple schematic line-drawings for the water heater "Guide me" questions —
// same approach as HvacGuideIllustrations: original vector line-art, not
// photos, so there's nothing to license.

function TankIllustration() {
  return (
    <Svg width={220} height={130} viewBox="0 0 220 130">
      <Rect x={85} y={34} width={50} height={78} rx={10} fill="white" stroke={STROKE} strokeWidth={2.5} />
      <Rect x={101} y={20} width={18} height={16} rx={3} fill="white" stroke={STROKE} strokeWidth={2} />
      <Rect x={85} y={63} width={50} height={14} fill={ACCENT_YELLOW} stroke={STROKE} strokeWidth={1.5} />
    </Svg>
  );
}

function TankFanIllustration() {
  return (
    <Svg width={220} height={130} viewBox="0 0 220 130">
      <Rect x={85} y={50} width={50} height={62} rx={10} fill="white" stroke={STROKE} strokeWidth={2.5} />
      <Rect x={85} y={76} width={50} height={14} fill="#EAF1F8" stroke={STROKE} strokeWidth={1.5} />
      <Rect x={93} y={16} width={34} height={30} rx={5} fill={ACCENT_YELLOW} stroke={STROKE} strokeWidth={2.5} />
      <Circle cx={110} cy={31} r={10} fill="white" stroke={STROKE} strokeWidth={1.6} />
      <Line x1={110} y1={22} x2={110} y2={40} stroke={STROKE} strokeWidth={1.4} />
      <Line x1={101} y1={31} x2={119} y2={31} stroke={STROKE} strokeWidth={1.4} />
    </Svg>
  );
}

function SolarIllustration() {
  return (
    <Svg width={220} height={130} viewBox="0 0 220 130">
      <Polygon points="25,55 110,15 195,55" fill="#EAF1F8" stroke={STROKE} strokeWidth={2.5} strokeLinejoin="round" />
      <G transform="rotate(-11 110 40)">
        <Rect x={55} y={28} width={110} height={24} rx={2} fill={ACCENT_YELLOW} stroke={STROKE} strokeWidth={2} />
        <Line x1={85} y1={28} x2={85} y2={52} stroke={STROKE} strokeWidth={1} />
        <Line x1={110} y1={28} x2={110} y2={52} stroke={STROKE} strokeWidth={1} />
        <Line x1={135} y1={28} x2={135} y2={52} stroke={STROKE} strokeWidth={1} />
        <Line x1={55} y1={40} x2={165} y2={40} stroke={STROKE} strokeWidth={1} />
      </G>
      <Line x1={95} y1={70} x2={95} y2={94} stroke={DUCT} strokeWidth={3} strokeDasharray="4,3" />
      <Rect x={75} y={94} width={40} height={24} rx={4} fill="white" stroke={STROKE} strokeWidth={2.5} />
    </Svg>
  );
}

function SingleFixtureIllustration() {
  return (
    <Svg width={220} height={130} viewBox="0 0 220 130">
      <Rect x={55} y={30} width={110} height={10} rx={3} fill="white" stroke={STROKE} strokeWidth={2.5} />
      <Path
        d="M62 40 L62 50 C62 62 70 70 85 70 L135 70 C150 70 158 62 158 50 L158 40 Z"
        fill="#EAF1F8"
        stroke={STROKE}
        strokeWidth={2.5}
      />
      <Rect x={90} y={82} width={40} height={32} rx={4} fill={ACCENT_YELLOW} stroke={STROKE} strokeWidth={2.5} />
      <Line x1={110} y1={70} x2={110} y2={82} stroke={DUCT} strokeWidth={3} />
    </Svg>
  );
}

const ILLUSTRATIONS = {
  start: TankIllustration,
  tank_fan_check: TankFanIllustration,
  solar_check: SolarIllustration,
  single_fixture_check: SingleFixtureIllustration,
};

export default function WaterHeaterGuideIllustration({ guideKey }) {
  const Illustration = ILLUSTRATIONS[guideKey];
  if (!Illustration) return null;
  return (
    <View className="items-center justify-center mb-4" style={{ height: 130 }}>
      <Illustration />
    </View>
  );
}
