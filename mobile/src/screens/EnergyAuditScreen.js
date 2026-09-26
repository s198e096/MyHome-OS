import { View, Text, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft, CheckCircle2, XCircle, HelpCircle } from "lucide-react-native";
import { PRIMARY, STATUS_COLOR } from "../lib/constants.js";
import { computeAutoChecks, computeEnergyScore, FAIL_TASK_TITLES } from "../lib/energyAudit.js";

const STATUS_CYCLE = { unknown: "pass", pass: "fail", fail: "unknown" };

function StatusIcon({ status }) {
  if (status === "pass") return <CheckCircle2 size={18} color={STATUS_COLOR.green} />;
  if (status === "fail") return <XCircle size={18} color={STATUS_COLOR.red} />;
  return <HelpCircle size={18} color="#B8B4A8" />;
}

function FailTaskAction({ title, taskExists, onCreate }) {
  if (taskExists) {
    return <Text className="text-[11px] mt-1.5" style={{ color: STATUS_COLOR.green }}>Task added: {title}</Text>;
  }
  return (
    <Pressable onPress={onCreate}>
      <Text className="text-[11px] font-semibold mt-1.5" style={{ color: PRIMARY }}>+ Add task: {title}</Text>
    </Pressable>
  );
}

export default function EnergyAuditScreen({ systems, energyChecks, tasks, onBack, onUpdateCheck, onCreateTask }) {
  const autoChecks = computeAutoChecks(systems);
  const { passed, total } = computeEnergyScore(autoChecks, energyChecks);
  const pct = total > 0 ? Math.round((passed / total) * 100) : 0;

  const hasTask = (title) => tasks.some((t) => t.title === title);
  const insets = useSafeAreaInsets();

  return (
    <ScrollView className="flex-1 bg-[#F5F8F0] px-4" style={{ paddingTop: insets.top + 20 }} showsVerticalScrollIndicator={false}>
      <Pressable onPress={onBack} className="flex-row items-center gap-1 mb-3">
        <ChevronLeft size={16} color="#78716c" />
        <Text className="text-[13px] text-stone-500">Home</Text>
      </Pressable>

      <Text className="text-[17px] font-semibold text-stone-900 mb-1">Energy audit</Text>
      <Text className="text-[12.5px] text-stone-400 mb-3">{passed} of {total} checks passed</Text>

      <View className="rounded-full overflow-hidden mb-5" style={{ height: 8, backgroundColor: "#EAF3DE" }}>
        <View style={{ width: `${pct}%`, height: "100%", backgroundColor: PRIMARY, borderRadius: 999 }} />
      </View>

      <Text className="text-[12px] font-semibold text-stone-500 mb-1">From your systems</Text>
      <View className="rounded-xl bg-white px-3 mb-5" style={{ borderWidth: 1, borderColor: "#E0E8D3" }}>
        {autoChecks.map((c, i) => (
          <View key={c.key} className="py-2.5" style={{ borderBottomWidth: i < autoChecks.length - 1 ? 1 : 0, borderBottomColor: "#E7EEDB" }}>
            <View className="flex-row items-center justify-between gap-2">
              <View className="flex-1">
                <Text className="text-[13.5px] text-stone-800">{c.label}</Text>
                <Text className="text-[11.5px] text-stone-400">{c.context}</Text>
              </View>
              <StatusIcon status={c.status} />
            </View>
            {c.status === "fail" && (
              <FailTaskAction title={c.failTask} taskExists={hasTask(c.failTask)} onCreate={() => onCreateTask(c.failTask)} />
            )}
          </View>
        ))}
      </View>

      <Text className="text-[12px] font-semibold text-stone-500 mb-1">Quick checklist</Text>
      <View className="rounded-xl bg-white px-3 mb-5" style={{ borderWidth: 1, borderColor: "#E0E8D3" }}>
        {energyChecks.map((c, i) => {
          const failTitle = FAIL_TASK_TITLES[c.key];
          return (
            <View key={c.id} className="py-2.5" style={{ borderBottomWidth: i < energyChecks.length - 1 ? 1 : 0, borderBottomColor: "#E7EEDB" }}>
              <Pressable onPress={() => onUpdateCheck(c.id, STATUS_CYCLE[c.status])} className="flex-row items-center justify-between gap-2">
                <Text className="text-[13.5px] text-stone-800">{c.label}</Text>
                <StatusIcon status={c.status} />
              </Pressable>
              {c.status === "fail" && (
                <FailTaskAction title={failTitle} taskExists={hasTask(failTitle)} onCreate={() => onCreateTask(failTitle)} />
              )}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}
