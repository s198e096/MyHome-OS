import { Circle } from "lucide-react";
import { STATUS_COLOR } from "../lib/constants.js";

export default function StatusDot({ status }) {
  return <Circle size={8} fill={STATUS_COLOR[status]} color={STATUS_COLOR[status]} />;
}
