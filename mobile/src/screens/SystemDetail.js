import { useState, createElement } from "react";
import { View, Text, Pressable, Image, ScrollView, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { ChevronLeft, Pencil, Shield, Clock, FileText } from "lucide-react-native";
import { PRIMARY, CATEGORY_META, STATUS_COLOR, STATUS_BG, systemName, systemIcon } from "../lib/constants.js";
import { TODAY, money, estimatedReplacementYear, replacementPlan, formatMonths, yearsFromToday, systemStatus } from "../lib/forecast.js";
import LedgerRow from "../components/LedgerRow.js";

const PLAN_YEARS = [5, 10, 15, 20];
const MONO_FONT = Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" });

// Brighter variants of STATUS_COLOR for use on the dark hero panel, where
// the normal (darker) status colors wouldn't read clearly.
const STATUS_BRIGHT = { green: "#8FD169", yellow: "#F0C14B", red: "#E2726B" };
const STATUS_LABEL = { green: "On track", yellow: "Needs attention", red: "Overdue" };

const monthYear = (year, month) =>
  new Date(year, month - 1, 1).toLocaleDateString("en-US", { month: "short", year: "numeric" });

function SpecTile({ label, value, valueColor, mono }) {
  return (
    <View className="rounded-xl p-3" style={{ flexBasis: "48%", flexGrow: 1, backgroundColor: "white", borderWidth: 1, borderColor: "#E0E8D3" }}>
      <Text className="text-[10px] font-semibold text-stone-400" style={{ letterSpacing: 0.6 }}>{label.toUpperCase()}</Text>
      <Text
        className="text-[14px] font-semibold mt-1"
        numberOfLines={1}
        style={{ color: valueColor || "#1C2B14", fontFamily: mono ? MONO_FONT : undefined }}
      >
        {value}
      </Text>
    </View>
  );
}

export default function SystemDetail({ sys, tasks, documents, warranties, onBack, onEdit, onSetPlan }) {
  const meta = CATEGORY_META[sys.category];
  const Icon = systemIcon(sys);
  const hasEstimate = !!sys.purchaseDate && sys.expectedLifeYears != null && sys.replacementCost != null;
  const plan = replacementPlan(sys);
  const planPassed =
    plan?.source === "plan" && plan.year * 12 + plan.month - 1 < TODAY.getFullYear() * 12 + TODAY.getMonth();
  const [planError, setPlanError] = useState("");
  const insets = useSafeAreaInsets();
  const status = systemStatus(sys, tasks);

  let lifePct = null;
  if (hasEstimate) {
    const ageYears = (TODAY - new Date(sys.purchaseDate)) / (365.25 * 86400000);
    lifePct = Math.max(0, Math.min(100, Math.round((ageYears / sys.expectedLifeYears) * 100)));
  }
  const lifeColor = lifePct == null ? "#D9E8C4" : lifePct >= 90 ? STATUS_BRIGHT.red : lifePct >= 60 ? STATUS_BRIGHT.yellow : STATUS_BRIGHT.green;

  async function setPlan(date) {
    setPlanError("");
    try {
      await onSetPlan(date);
    } catch (err) {
      setPlanError(
        err?.message?.includes("schema cache")
          ? "Couldn't save the plan — the database is missing the planned_replacement_date column. Run the latest Supabase migration (0013), then try again."
          : "Couldn't save the plan. Try again."
      );
    }
  }

  return (
    <ScrollView className="flex-1 bg-[#F5F8F0] px-4" style={{ paddingTop: insets.top + 20 }} showsVerticalScrollIndicator={false}>
      <View className="flex-row items-center justify-between mb-3">
        <Pressable onPress={onBack} className="flex-row items-center gap-1">
          <ChevronLeft size={16} color="#78716c" />
          <Text className="text-[13px] text-stone-500">Systems</Text>
        </Pressable>
        <Pressable onPress={onEdit} className="flex-row items-center gap-1">
          <Pencil size={14} color={PRIMARY} />
          <Text className="text-[13px] font-semibold" style={{ color: PRIMARY }}>Edit</Text>
        </Pressable>
      </View>

      {sys.photoUrl && (
        <View className="rounded-xl bg-white p-2 mb-3" style={{ borderWidth: 1, borderColor: "#E0E8D3" }}>
          <Image source={{ uri: sys.photoUrl }} style={{ width: "100%", height: 180, borderRadius: 8 }} resizeMode="cover" />
        </View>
      )}

      <LinearGradient colors={["#1C2B14", "#0A0F07"]} className="rounded-2xl p-4 mb-4" style={{ overflow: "hidden" }}>
        <View className="flex-row items-start justify-between gap-2">
          <View className="flex-row items-center gap-3 flex-1 min-w-0">
            <View
              className="rounded-xl items-center justify-center"
              style={{ width: 46, height: 46, backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.16)" }}
            >
              {createElement(Icon, { size: 22, color: "#D9E8C4" })}
            </View>
            <View className="flex-1 min-w-0">
              <Text className="text-[17px] font-bold text-white" numberOfLines={1}>{systemName(sys)}</Text>
              <Text className="text-[12px]" style={{ color: "#9FB08A" }} numberOfLines={1}>{meta.label} · {sys.location}</Text>
            </View>
          </View>
          <View className="rounded-full px-2.5 py-1 flex-row items-center gap-1.5" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: STATUS_BRIGHT[status] }} />
            <Text className="text-[11px] font-semibold" style={{ color: "#D9E8C4" }}>{STATUS_LABEL[status]}</Text>
          </View>
        </View>

        <View className="mt-4">
          <View className="flex-row items-center justify-between mb-1.5">
            <Text className="text-[11px]" style={{ color: "#9FB08A" }}>Expected life used</Text>
            <Text className="text-[11px] font-semibold" style={{ color: "#D9E8C4" }}>{lifePct != null ? `${lifePct}%` : "Not enough data"}</Text>
          </View>
          <View className="rounded-full overflow-hidden" style={{ height: 6, backgroundColor: "rgba(255,255,255,0.12)" }}>
            <View style={{ width: `${lifePct ?? 0}%`, height: 6, backgroundColor: lifeColor, borderRadius: 999 }} />
          </View>
        </View>
      </LinearGradient>

      <View className="flex-row flex-wrap gap-2 mb-4">
        {!!sys.serialNumber && <SpecTile label="Serial" value={sys.serialNumber} mono />}
        <SpecTile
          label="Installed"
          value={sys.purchaseDate ? new Date(sys.purchaseDate).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "Not set"}
        />
        <SpecTile label="Purchase price" value={sys.purchasePrice != null ? money(sys.purchasePrice) : "Not set"} />
        <SpecTile label="Expected life" value={sys.expectedLifeYears != null ? `${sys.expectedLifeYears} yrs` : "Not set"} />
        <SpecTile
          label="Est. replacement"
          value={hasEstimate ? `${money(sys.replacementCost)} · ${estimatedReplacementYear(sys)}` : "Not set"}
        />
        <SpecTile
          label="Warranty"
          value={sys.warrantyExpiration && new Date(sys.warrantyExpiration) > TODAY ? "Active" : "Expired"}
          valueColor={sys.warrantyExpiration && new Date(sys.warrantyExpiration) > TODAY ? STATUS_COLOR.green : STATUS_COLOR.red}
        />
        <SpecTile
          label="Registered"
          value={sys.warrantyRegistered ? "Yes" : "No"}
          valueColor={sys.warrantyRegistered ? STATUS_COLOR.green : "#9C978C"}
        />
        <SpecTile
          label="Planned replacement"
          value={
            sys.plannedReplacementDate
              ? monthYear(...sys.plannedReplacementDate.split("-").slice(0, 2).map(Number))
              : "Not planned"
          }
          valueColor={sys.plannedReplacementDate ? PRIMARY : "#9C978C"}
        />
      </View>

      {plan && (
        <View className="rounded-xl p-3 mb-4" style={{ backgroundColor: STATUS_BG.yellow, borderWidth: 1, borderColor: "#F0DDB3" }}>
          <Text className="text-[11px]" style={{ color: STATUS_COLOR.yellow, fontWeight: "600" }}>Recommended savings</Text>
          <Text className="text-[15px]" style={{ color: STATUS_COLOR.yellow, fontWeight: "600" }}>{money(plan.monthly)}/mo toward replacement</Text>
          <Text className="text-[11.5px] mt-1" style={{ color: STATUS_COLOR.yellow }}>
            {plan.source === "plan"
              ? planPassed
                ? `Your planned date (${monthYear(plan.year, plan.month)}) has passed — pick a new one below.`
                : `To replace it in ${monthYear(plan.year, plan.month)}, ${formatMonths(plan.months)} from now.`
              : plan.months === 1
                ? "Based on expected life, replacement is due now. Pick a later date below to spread the cost."
                : `Based on expected life: replacement due ${plan.year}, ${formatMonths(plan.months)} away.`}
          </Text>
        </View>
      )}

      <View className="rounded-xl bg-white p-3 mb-4" style={{ borderWidth: 1, borderColor: "#E0E8D3" }}>
        <Text className="text-[13.5px] font-semibold text-stone-900">Plan your replacement</Text>
        <Text className="text-[11.5px] text-stone-500 mt-0.5 mb-2.5">
          Pick when you'd like to replace it and we'll work out a monthly amount to save. A plan overrides expected life.
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {PLAN_YEARS.map((years) => {
            const date = yearsFromToday(years);
            const active = sys.plannedReplacementDate === date;
            return (
              <Pressable
                key={years}
                onPress={() => setPlan(date)}
                className="rounded-full px-3 py-1.5"
                style={{ backgroundColor: active ? PRIMARY : "#F5F8F0", borderWidth: 1, borderColor: active ? PRIMARY : "#E0E8D3" }}
              >
                <Text className="text-[12.5px] font-semibold" style={{ color: active ? "white" : PRIMARY }}>{years} yrs</Text>
              </Pressable>
            );
          })}
          <Pressable
            onPress={onEdit}
            className="rounded-full px-3 py-1.5"
            style={{ backgroundColor: "#F5F8F0", borderWidth: 1, borderColor: "#E0E8D3" }}
          >
            <Text className="text-[12.5px] font-semibold" style={{ color: PRIMARY }}>Custom date</Text>
          </Pressable>
        </View>
        {!!sys.plannedReplacementDate && (
          <Pressable onPress={() => setPlan(null)} className="self-start mt-2.5" hitSlop={8}>
            <Text className="text-[12px] font-semibold" style={{ color: STATUS_COLOR.red }}>Clear plan</Text>
          </Pressable>
        )}
        {sys.replacementCost == null && (
          <Text className="text-[11.5px] mt-2.5" style={{ color: STATUS_COLOR.yellow }}>
            Add an estimated replacement cost (tap Edit) to see the monthly amount.
          </Text>
        )}
        {!!planError && <Text className="text-[12px] mt-2.5" style={{ color: STATUS_COLOR.red }}>{planError}</Text>}
      </View>

      {warranties.length > 0 && (
        <>
          <View className="flex-row items-center gap-1.5 mb-1">
            <Shield size={13} color="#78716c" />
            <Text className="text-[12px] font-semibold text-stone-500">Warranty details</Text>
          </View>
          <View className="rounded-xl bg-white px-3 mb-4" style={{ borderWidth: 1, borderColor: "#E0E8D3" }}>
            {warranties.map((w) => (
              <LedgerRow
                key={w.id}
                label={w.type}
                sub={w.estimated ? "Estimated" : undefined}
                value={w.expirationDate ? `Expires ${new Date(w.expirationDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })}` : "Not set"}
                valueColor={w.expirationDate && new Date(w.expirationDate) > TODAY ? STATUS_COLOR.green : STATUS_COLOR.red}
              />
            ))}
          </View>
        </>
      )}

      <View className="flex-row items-center gap-1.5 mb-1">
        <Clock size={13} color="#78716c" />
        <Text className="text-[12px] font-semibold text-stone-500">Upcoming tasks</Text>
      </View>
      <View className="rounded-xl bg-white px-3 mb-4" style={{ borderWidth: 1, borderColor: "#E0E8D3" }}>
        {tasks.length === 0 && <Text className="py-3 text-[13px] text-stone-400">No tasks scheduled.</Text>}
        {tasks.map((t) => (
          <LedgerRow key={t.id} label={t.title} value={new Date(t.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} />
        ))}
      </View>

      <View className="flex-row items-center gap-1.5 mb-1">
        <FileText size={13} color="#78716c" />
        <Text className="text-[12px] font-semibold text-stone-500">Documents</Text>
      </View>
      <View className="rounded-xl bg-white px-3 mb-6" style={{ borderWidth: 1, borderColor: "#E0E8D3" }}>
        {documents.length === 0 && <Text className="py-3 text-[13px] text-stone-400">No documents attached.</Text>}
        {documents.map((d) => (
          <LedgerRow key={d.id} label={d.label} sub={d.type} value="" />
        ))}
      </View>
    </ScrollView>
  );
}
