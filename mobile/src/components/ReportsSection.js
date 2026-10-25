import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { Home, ShieldCheck, Check } from "lucide-react-native";
import { PRIMARY, STATUS_COLOR } from "../lib/constants.js";
import { priceLabel, REPORT_ACCESS_DAYS } from "../lib/reports/catalog.js";

const ICONS = { home_sale: Home, insurance_inventory: ShieldCheck };

const expiryLabel = (iso) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });

function ReportCard({ report, onBuy, onGenerate, onRecheck }) {
  const Icon = ICONS[report.type] || Home;
  const { purchase, busy, status, error, paymentPending } = report;

  return (
    <View className="rounded-xl bg-white p-3" style={{ borderWidth: 1, borderColor: "#E0E8D3" }}>
      <View className="flex-row items-start justify-between gap-2">
        <View className="flex-row items-center gap-2.5 flex-1 min-w-0">
          <View className="rounded-lg items-center justify-center" style={{ width: 34, height: 34, backgroundColor: "#F5F8F0" }}>
            <Icon size={17} color={PRIMARY} />
          </View>
          <View className="flex-1 min-w-0">
            <Text className="text-[14px] font-semibold text-stone-900">{report.title}</Text>
            <Text className="text-[11.5px] text-stone-500">{report.tagline}</Text>
          </View>
        </View>
        {!purchase && (
          <View className="rounded-full px-2.5 py-1" style={{ backgroundColor: "#EAF3DE" }}>
            <Text className="text-[12px] font-bold" style={{ color: "#3B6D11" }}>{priceLabel(report)}</Text>
          </View>
        )}
      </View>

      <View className="mt-2.5 gap-1">
        {report.highlights.map((line) => (
          <View key={line} className="flex-row items-start gap-1.5">
            <Check size={12} color="#3B6D11" style={{ marginTop: 3 }} />
            <Text className="flex-1 text-[11.5px] text-stone-600">{line}</Text>
          </View>
        ))}
      </View>

      <Pressable
        onPress={purchase ? onGenerate : onBuy}
        disabled={busy}
        className="w-full py-2.5 rounded-lg items-center justify-center flex-row gap-2 mt-3"
        style={{ backgroundColor: PRIMARY, opacity: busy ? 0.7 : 1 }}
      >
        {busy && <ActivityIndicator size="small" color="white" />}
        <Text className="text-[13.5px] font-semibold text-white">
          {busy ? status || "Working…" : purchase ? "Generate PDF" : `Buy report · ${priceLabel(report)}`}
        </Text>
      </Pressable>

      {purchase && !busy && (
        <Text className="text-[11px] text-stone-400 mt-1.5 text-center">
          Purchased · generate and re-download as often as you like until {expiryLabel(purchase.expiresAt)} ({REPORT_ACCESS_DAYS} days)
        </Text>
      )}
      {!!error && <Text className="text-[12px] mt-2" style={{ color: STATUS_COLOR.red }}>{error}</Text>}
      {paymentPending && !busy && (
        <Pressable onPress={onRecheck} className="self-start mt-1.5" hitSlop={8}>
          <Text className="text-[12px] font-semibold" style={{ color: PRIMARY }}>I&apos;ve paid — check again</Text>
        </Pressable>
      )}
    </View>
  );
}

export default function ReportsSection({ reports, onBuy, onGenerate, onRecheck }) {
  return (
    <>
      <Text className="text-[12px] font-semibold text-stone-500 mb-1">Reports</Text>
      <View className="gap-3 mb-4">
        {reports.map((r) => (
          <ReportCard
            key={r.type}
            report={r}
            onBuy={() => onBuy(r.type)}
            onGenerate={() => onGenerate(r.type)}
            onRecheck={() => onRecheck(r.type)}
          />
        ))}
      </View>
    </>
  );
}
