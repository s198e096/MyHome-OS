import { View, Text, Pressable, Image, ScrollView } from "react-native";
import { ChevronLeft, Pencil } from "lucide-react-native";
import { PRIMARY, CATEGORY_META, STATUS_COLOR, STATUS_BG } from "../lib/constants.js";
import { TODAY, money, replacementYear } from "../lib/forecast.js";
import LedgerRow from "../components/LedgerRow.js";

export default function SystemDetail({ sys, tasks, documents, onBack, onEdit }) {
  const meta = CATEGORY_META[sys.category];
  const Icon = meta.icon;
  const repYear = replacementYear(sys);
  const monthsOut = Math.max(1, (repYear - TODAY.getFullYear()) * 12 - TODAY.getMonth());
  const reserve = Math.round(sys.replacementCost / monthsOut);

  return (
    <ScrollView className="flex-1 bg-[#F5F8F0] px-4 pt-5" showsVerticalScrollIndicator={false}>
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
          <Text className="text-[17px] font-semibold text-stone-900">{sys.brand} {sys.model}</Text>
          <Text className="text-[12px] text-stone-400">{meta.label} · {sys.location}</Text>
        </View>
      </View>

      <View className="rounded-xl bg-white px-3 mb-4" style={{ borderWidth: 1, borderColor: "#E0E8D3" }}>
        <LedgerRow label="Installed" value={new Date(sys.purchaseDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })} />
        <LedgerRow label="Purchase price" value={money(sys.purchasePrice)} />
        <LedgerRow label="Expected life" value={`${sys.expectedLifeYears} years`} />
        <LedgerRow label="Est. replacement" value={`${money(sys.replacementCost)}, ${repYear}`} />
        <LedgerRow
          label="Warranty"
          value={sys.warrantyExpiration && new Date(sys.warrantyExpiration) > TODAY ? "Active" : "Expired"}
          valueColor={sys.warrantyExpiration && new Date(sys.warrantyExpiration) > TODAY ? STATUS_COLOR.green : STATUS_COLOR.red}
        />
      </View>

      <View className="rounded-xl p-3 mb-4" style={{ backgroundColor: STATUS_BG.yellow, borderWidth: 1, borderColor: "#F0DDB3" }}>
        <Text className="text-[11px]" style={{ color: STATUS_COLOR.yellow, fontWeight: "600" }}>Recommended savings</Text>
        <Text className="text-[15px]" style={{ color: STATUS_COLOR.yellow, fontWeight: "600" }}>{money(reserve)}/mo toward replacement</Text>
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
