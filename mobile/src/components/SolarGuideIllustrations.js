import { View } from "react-native";
import Svg, { Rect, Line, Circle, G, Polygon } from "react-native-svg";
import { PRIMARY, ACCENT_YELLOW } from "../lib/constants.js";

const STROKE = PRIMARY;

// Simple schematic line-drawings for the solar panel "Guide me" questions —
// same approach as the other guided walkthroughs: original vector line-art,
// not photos, so there's nothing to license.

function GroundMountIllustration() {
  return (
    <Svg width={220} height={130} viewBox="0 0 220 130">
      <Circle cx={185} cy={25} r={9} fill="white" stroke={STROKE} strokeWidth={1.8} />
      <Line x1={185} y1={11} x2={185} y2={16} stroke={STROKE} strokeWidth={1.6} />
      <Line x1={185} y1={34} x2={185} y2={39} stroke={STROKE} strokeWidth={1.6} />
      <Line x1={199} y1={25} x2={194} y2={25} stroke={STROKE} strokeWidth={1.6} />
      <Line x1={171} y1={25} x2={176} y2={25} stroke={STROKE} strokeWidth={1.6} />

      <Line x1={15} y1={112} x2={205} y2={112} stroke={STROKE} strokeWidth={2.5} />
      <Line x1={78} y1={112} x2={92} y2={66} stroke={STROKE} strokeWidth={3} />
      <Line x1={142} y1={112} x2={128} y2={66} stroke={STROKE} strokeWidth={3} />

      <G transform="rotate(-16 110 55)">
        <Rect x={65} y={42} width={90} height={30} rx={2} fill={ACCENT_YELLOW} stroke={STROKE} strokeWidth={2} />
        <Line x1={95} y1={42} x2={95} y2={72} stroke={STROKE} strokeWidth={1} />
        <Line x1={125} y1={42} x2={125} y2={72} stroke={STROKE} strokeWidth={1} />
        <Line x1={65} y1={57} x2={155} y2={57} stroke={STROKE} strokeWidth={1} />
      </G>
    </Svg>
  );
}

function RoofTileIllustration() {
  // The whole roof slope IS the panel surface (flush, edge-to-edge) — no
  // separate rectangular panel sitting on top of a visible roof underneath.
  return (
    <Svg width={220} height={130} viewBox="0 0 220 130">
      <Polygon points="20,70 110,15 200,70" fill={ACCENT_YELLOW} stroke={STROKE} strokeWidth={2.5} strokeLinejoin="round" />
      <Rect x={35} y={70} width={150} height={38} fill="white" stroke={STROKE} strokeWidth={2.5} />
      <Line x1={110} y1={15} x2={110} y2={70} stroke={STROKE} strokeWidth={1} />
      <Line x1={65} y1={70} x2={90} y2={40} stroke={STROKE} strokeWidth={1} />
      <Line x1={155} y1={70} x2={130} y2={40} stroke={STROKE} strokeWidth={1} />
      <Line x1={72} y1={48} x2={148} y2={48} stroke={STROKE} strokeWidth={1} />
      <Line x1={92} y1={61} x2={128} y2={61} stroke={STROKE} strokeWidth={1} />
    </Svg>
  );
}

const ILLUSTRATIONS = {
  start: GroundMountIllustration,
  tile_check: RoofTileIllustration,
};

export default function SolarGuideIllustration({ guideKey }) {
  const Illustration = ILLUSTRATIONS[guideKey];
  if (!Illustration) return null;
  return (
    <View className="items-center justify-center mb-4" style={{ height: 130 }}>
      <Illustration />
    </View>
  );
}
