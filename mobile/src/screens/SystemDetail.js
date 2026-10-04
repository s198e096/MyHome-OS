import { useState } from "react";
import { View, Text, Pressable, Image, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft, Pencil } from "lucide-react-native";
import { PRIMARY, CATEGORY_META, STATUS_COLOR, STATUS_BG, systemName } from "../lib/constants.js";
import { TODAY, money, estimatedReplacementYear, replacementPlan, formatMonths, yearsFromToday } from "../lib/forecast.js";
import LedgerRow from "../components/LedgerRow.js";

const PLAN_YEARS = [5, 10, 15, 20];

const monthYear = (year, month) =>
  new Date(year, month - 1, 1).toLocaleDateString("en-US", { month: "short", year: "numeric" });

export default function SystemDetail({ sys, tasks, documents, onBack, onEdit, onSetPlan }) {
  const meta = CATEGORY_META[sys.category];
  const Icon = meta.icon;
  const hasEstimate = !!sys.purchaseDate && sys.expectedLifeYears != null && sys.replacementCost != null;
  const plan = replacementPlan(sys);
  const planPassed =
    plan?.source === "plan" && plan.year * 12 + plan.month - 1 < TODAY.getFullYear() * 12 + TODAY.getMonth();
  const [planError, setPlanError] = useState("");
  const insets = useSafeAreaInsets();

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
        <View className="rounded-xl bg-white p-2 mb-4" style={{ borderWidth: 1, borderColor: "#E0E8D3" }}>
          <Image source={{ uri: sys.photoUrl }} style={{ width: "100%", height: 180, borderRadius: 8 }} resizeMode="cover" />
        </View>
      )}

      <View className="flex-row items-center gap-3 mb-4">
        <View className="rounded-lg p-2.5 bg-[#F5F8F0]">
          <Icon size={20} color="#5F5B50" />
        </View>
        <View>
          <Text className="text-[17px] font-semibold text-stone-900">{systemName(sys)}</Text>
          <Text className="text-[12px] text-stone-400">{meta.label} · {sys.location}</Text>
        </View>
      </View>

      <View className="rounded-xl bg-white px-3 mb-4" style={{ borderWidth: 1, borderColor: "#E0E8D3" }}>
        {!!sys.serialNumber && <LedgerRow label="Serial number" value={sys.serialNumber} />}
        <LedgerRow
          label="Installed"
          value={sys.purchaseDate ? new Date(sys.purchaseDate).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "Not set"}
        />
        <LedgerRow label="Purchase price" value={sys.purchasePrice != null ? money(sys.purchasePrice) : "Not set"} />
        <LedgerRow label="Expected life" value={sys.expectedLifeYears != null ? `${sys.expectedLifeYears} years` : "Not set"} />
        <LedgerRow
          label="Est. replacement"
          value={hasEstimate ? `${money(sys.replacementCost)}, ${estimatedReplacementYear(sys)}` : "Not set"}
        />
        <LedgerRow
          label="Warranty"
          value={sys.warrantyExpiration && new Date(sys.warrantyExpiration) > TODAY ? "Active" : "Expired"}
          valueColor={sys.warrantyExpiration && new Date(sys.warrantyExpiration) > TODAY ? STATUS_COLOR.green : STATUS_COLOR.red}
        />
        <LedgerRow
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

      <Text className="text-[12px] font-semibold text-stone-500 mb-1">Upcoming tasks</Text>
      <View className="rounded-xl bg-white px-3 mb-4" style={{ borderWidth: 1, borderColor: "#E0E8D3" }}>
        {tasks.length === 0 && <Text className="py-3 text-[13px] text-stone-400">No tasks scheduled.</Text>}
        {tasks.map((t) => (
          <LedgerRow key={t.id} label={t.title} value={new Date(t.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} />
        ))}
      </View>

      <Text className="text-[12px] font-semibold text-stone-500 mb-1">Documents</Text>
      <View className="rounded-xl bg-white px-3 mb-6" style={{ borderWidth: 1, borderColor: "#E0E8D3" }}>
        {documents.length === 0 && <Text className="py-3 text-[13px] text-stone-400">No documents attached.</Text>}
        {documents.map((d) => (
          <LedgerRow key={d.id} label={d.label} sub={d.type} value="" />
        ))}
      </View>
    </ScrollView>
  );
}
