import { useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Plus, ChevronRight, ChevronDown } from "lucide-react-native";
import Svg, { Path, Circle } from "react-native-svg";
import { PRIMARY, systemShortName } from "../lib/constants.js";
import { TODAY, money, expenseYears, expensesBySystemForYear, timeSpentBySystemForYear } from "../lib/forecast.js";
import SelectModal from "../components/SelectModal.js";

// Validated 8-slot categorical palette (see the dataviz skill) — passes
// adjacent-pair colorblind-safety checks in this fixed order, which is
// exactly what a pie chart's touching slices need. A 9th system folds into
// "Other" rather than generating a new hue.
const CATEGORICAL = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#4a3aa7", "#e34948"];
const OTHER_COLOR = "#9C978C";

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y} Z`;
}

function toSlices(rows, labelFor) {
  const top = rows.slice(0, 8);
  const rest = rows.slice(8);
  // "Other" folds multiple systems together, so there's no single system
  // to jump to — key stays null and that slice/legend row isn't pressable.
  const slices = top.map((r, i) => ({ key: r.key, label: labelFor(r.key), value: r.value, color: CATEGORICAL[i] }));
  if (rest.length) {
    slices.push({ key: null, label: "Other", value: rest.reduce((s, r) => s + r.value, 0), color: OTHER_COLOR });
  }
  return slices;
}

// Pie + legend — a single series needs no legend box per se, but this is a
// categorical (per-system) breakdown, so identity can't be color-alone:
// every slice gets a direct label and value in the legend list. Tapping a
// slice (or its legend row) drills into that system's expenses.
function PieChart({ rows, labelFor, formatValue, emptyText, onSlicePress }) {
  const [selectedKey, setSelectedKey] = useState(null);

  if (rows.length === 0) {
    return <Text className="py-2 text-[12.5px] text-stone-400">{emptyText}</Text>;
  }
  const slices = toSlices(rows, labelFor);
  const total = slices.reduce((s, sl) => s + sl.value, 0);
  const size = 120;
  const r = size / 2;
  // Slices sit a bit inside the full radius at rest, leaving room for the
  // tapped one to "pop" outward as its highlight, without clipping at the
  // SVG's edge.
  const baseR = r * 0.9;
  const selectedR = r * 0.98;
  // Running sums as a derived array (no mutated accumulator) so each
  // slice's start/end angle comes from where the previous ones left off.
  const cumulativeSums = slices.reduce((sums, s) => [...sums, (sums[sums.length - 1] || 0) + s.value], []);
  const arcs = slices.map((s, i) => {
    const prevSum = i === 0 ? 0 : cumulativeSums[i - 1];
    const startAngle = (prevSum / total) * 360;
    const endAngle = (cumulativeSums[i] / total) * 360;
    return { ...s, startAngle, endAngle };
  });

  function handlePress(key) {
    if (key == null) return;
    setSelectedKey(key);
    onSlicePress(key);
  }

  return (
    <View className="flex-row items-center gap-4">
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {arcs.length === 1 ? (
            <Circle
              cx={r}
              cy={r}
              r={baseR}
              fill={arcs[0].color}
              stroke={arcs[0].key === selectedKey ? "white" : undefined}
              strokeWidth={arcs[0].key === selectedKey ? 1.5 : 0}
              onPress={arcs[0].key != null ? () => handlePress(arcs[0].key) : undefined}
            />
          ) : (
            arcs.map((a, i) => {
              const selected = a.key != null && a.key === selectedKey;
              return (
                <Path
                  key={i}
                  d={arcPath(r, r, selected ? selectedR : baseR, a.startAngle, a.endAngle)}
                  fill={a.color}
                  stroke={selected ? "white" : undefined}
                  strokeWidth={selected ? 1.5 : 0}
                  onPress={a.key != null ? () => handlePress(a.key) : undefined}
                />
              );
            })
          )}
          <Circle cx={r} cy={r} r={r * 0.58} fill="white" />
        </Svg>
        {/* Donut hole doubles as the total — ties the headline number
            directly to the chart it summarizes, instead of a separate
            label competing for space above it. */}
        <View
          style={{ position: "absolute", top: 0, left: 0, width: size, height: size, alignItems: "center", justifyContent: "center" }}
        >
          <Text className="text-[9.5px] font-semibold text-stone-400" style={{ letterSpacing: 0.5 }}>TOTAL</Text>
          <Text className="text-[13.5px] font-bold text-stone-900" numberOfLines={1} style={{ maxWidth: size * 0.62 }}>
            {formatValue(total)}
          </Text>
        </View>
      </View>
      <View className="flex-1 min-w-0">
        {slices.map((s, i) => {
          const Row = s.key != null ? Pressable : View;
          const selected = s.key != null && s.key === selectedKey;
          return (
            <Row
              key={i}
              onPress={s.key != null ? () => handlePress(s.key) : undefined}
              className="flex-row items-center gap-1.5 mb-1.5 px-1.5 py-0.5 -mx-1.5 rounded-md"
              style={{ backgroundColor: selected ? `${s.color}26` : "transparent" }}
            >
              <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: s.color }} />
              <Text
                className="text-[11.5px] text-stone-700 flex-1 min-w-0"
                numberOfLines={1}
                style={{ fontWeight: selected ? "700" : "400" }}
              >
                {s.label}
              </Text>
              <Text className="text-[11.5px] font-semibold text-stone-800">{formatValue(s.value)}</Text>
            </Row>
          );
        })}
      </View>
    </View>
  );
}

export default function CostsScreen({ expenses, systemById, spentThisYear, next12mo, monthlyReserve, onAdd, onViewLog }) {
  const insets = useSafeAreaInsets();
  const years = expenseYears(expenses);
  const [selectedYear, setSelectedYear] = useState(years.includes(TODAY.getFullYear()) ? TODAY.getFullYear() : years[0]);
  const [yearDropdownOpen, setYearDropdownOpen] = useState(false);

  const labelFor = (key) => (key === "general" ? "General" : systemShortName(systemById(key)));
  const expenseRows = selectedYear != null ? expensesBySystemForYear(expenses, selectedYear) : [];
  const timeRows = selectedYear != null ? timeSpentBySystemForYear(expenses, selectedYear) : [];
  const onSlicePress = (systemKey) => onViewLog({ systemId: systemKey, year: selectedYear });

  return (
    <ScrollView className="flex-1 bg-[#F5F8F0] px-4" style={{ paddingTop: insets.top + 20 }} showsVerticalScrollIndicator={false}>
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-[17px] font-semibold text-stone-900">Costs</Text>
        <Pressable onPress={onAdd} className="rounded-full p-1.5" style={{ backgroundColor: PRIMARY }}>
          <Plus size={16} color="white" />
        </Pressable>
      </View>

      <Text className="text-[12px] font-semibold text-stone-500 mb-1">Financial outlook</Text>
      <View className="flex-row gap-2 mb-2">
        <View className="flex-1 rounded-xl bg-white p-3" style={{ borderWidth: 1, borderColor: "#E0E8D3" }}>
          <Text className="text-[11px] text-stone-400">Spent this year</Text>
          <Text className="text-[18px] font-semibold text-stone-900">{money(spentThisYear)}</Text>
        </View>
        <View className="flex-1 rounded-xl bg-white p-3" style={{ borderWidth: 1, borderColor: "#E0E8D3" }}>
          <Text className="text-[11px] text-stone-400">Next 12 months</Text>
          <Text className="text-[18px] font-semibold text-stone-900">{money(Math.round(next12mo))}</Text>
        </View>
      </View>
      <View className="rounded-xl bg-white p-3 mb-4" style={{ borderWidth: 1, borderColor: "#E0E8D3" }}>
        <Text className="text-[11px] text-stone-400">Recommended monthly reserve</Text>
        <Text className="text-[18px] font-semibold text-stone-900">{money(monthlyReserve)}/mo</Text>
      </View>

      {selectedYear != null ? (
        <>
          <Pressable
            onPress={() => setYearDropdownOpen(true)}
            className="flex-row items-center justify-between px-3 py-2 rounded-lg mb-3 self-start"
            style={{ borderWidth: 1, borderColor: "#E0E8D3", backgroundColor: "white", minWidth: 100 }}
          >
            <Text className="text-[13.5px] font-semibold text-stone-800 mr-2">{selectedYear}</Text>
            <ChevronDown size={14} color="#78716c" />
          </Pressable>
          <SelectModal
            visible={yearDropdownOpen}
            title="Choose a year"
            options={years.map((y) => ({ value: y, label: String(y) }))}
            selectedValue={selectedYear}
            onSelect={(value) => {
              setSelectedYear(value);
              setYearDropdownOpen(false);
            }}
            onClose={() => setYearDropdownOpen(false)}
          />

          <Text className="text-[12px] font-semibold text-stone-500 mb-1">Expenses by system</Text>
          <View className="rounded-xl bg-white p-3 mb-4" style={{ borderWidth: 1, borderColor: "#E0E8D3" }}>
            <PieChart
              rows={expenseRows}
              labelFor={labelFor}
              formatValue={money}
              emptyText="No expenses logged for this year."
              onSlicePress={onSlicePress}
            />
          </View>

          <Text className="text-[12px] font-semibold text-stone-500 mb-1">Time spent on maintenance by system</Text>
          <View className="rounded-xl bg-white p-3 mb-4" style={{ borderWidth: 1, borderColor: "#E0E8D3" }}>
            <PieChart
              rows={timeRows}
              labelFor={labelFor}
              formatValue={(h) => `${h % 1 === 0 ? h : h.toFixed(1)}h`}
              emptyText="No DIY time logged for this year."
              onSlicePress={onSlicePress}
            />
          </View>
        </>
      ) : (
        <Text className="text-[12.5px] text-stone-400 mb-4">Add an expense to see yearly breakdowns.</Text>
      )}

      <Pressable
        onPress={() => onViewLog(null)}
        className="rounded-xl bg-white p-3 mb-6 flex-row items-center justify-between"
        style={{ borderWidth: 1, borderColor: "#E0E8D3" }}
      >
        <View>
          <Text className="text-[13.5px] font-semibold text-stone-900">Expense log</Text>
          <Text className="text-[11.5px] text-stone-400">{expenses.length} entr{expenses.length === 1 ? "y" : "ies"}</Text>
        </View>
        <ChevronRight size={16} color="#B8B4A8" />
      </Pressable>
    </ScrollView>
  );
}
