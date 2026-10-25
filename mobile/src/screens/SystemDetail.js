import { useState, createElement } from "react";
import { View, Text, Pressable, Image, Modal, ScrollView, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { ChevronLeft, ChevronRight, Pencil, Shield, Clock, FileText, Image as ImageIcon, X } from "lucide-react-native";
import { PRIMARY, CATEGORY_META, STATUS_COLOR, STATUS_BG, systemName, systemIcon } from "../lib/constants.js";
import { TODAY, money, estimatedReplacementYear, replacementPlan, formatMonths, systemStatus } from "../lib/forecast.js";
import LedgerRow from "../components/LedgerRow.js";

const MONO_FONT = Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" });

// Brighter variants of STATUS_COLOR for use on the dark hero panel, where
// the normal (darker) status colors wouldn't read clearly.
const STATUS_BRIGHT = { green: "#8FD169", yellow: "#F0C14B", red: "#E2726B" };
const STATUS_LABEL = { green: "On track", yellow: "Needs attention", red: "Overdue" };

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

export default function SystemDetail({ sys, tasks, documents, warranties, onBack, onEdit }) {
  const meta = CATEGORY_META[sys.category];
  const Icon = systemIcon(sys);
  const hasEstimate = !!sys.purchaseDate && sys.expectedLifeYears != null && sys.replacementCost != null;
  const plan = replacementPlan(sys);
  const insets = useSafeAreaInsets();
  const status = systemStatus(sys, tasks);
  const [photoViewerOpen, setPhotoViewerOpen] = useState(false);

  // The life bar only needs the install date and expected life, not a replacement cost.
  const hasLife = !!sys.purchaseDate && sys.expectedLifeYears > 0;
  let lifePct = null;
  let ageYears = null;
  if (hasLife) {
    ageYears = Math.max(0, (TODAY - new Date(sys.purchaseDate)) / (365.25 * 86400000));
    lifePct = Math.max(0, Math.min(100, Math.round((ageYears / sys.expectedLifeYears) * 100)));
  }
  const subtitle = [meta.label, sys.location].filter(Boolean).join(" · ");
  const showPhoto = !!sys.photoUrl && !/\.pdf$/i.test(sys.photoUrl);
  const lifeColor = lifePct == null ? "#D9E8C4" : lifePct >= 90 ? STATUS_BRIGHT.red : lifePct >= 60 ? STATUS_BRIGHT.yellow : STATUS_BRIGHT.green;

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

      {/* Outer view carries the shadow; the gradient inside clips the photo to the rounded corners. */}
      <View
        className="mb-4"
        style={{
          borderRadius: 18,
          shadowColor: "#0A0F07",
          shadowOpacity: 0.22,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 6 },
          elevation: 5,
        }}
      >
        <LinearGradient
          colors={["#1C2B14", "#0A0F07"]}
          style={{ borderRadius: 18, overflow: "hidden", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" }}
        >
          {showPhoto && (
            <Pressable
              onPress={() => setPhotoViewerOpen(true)}
              className="flex-row items-center justify-between px-4 py-2.5"
              style={{ borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.08)" }}
            >
              <View className="flex-row items-center gap-2">
                <ImageIcon size={14} color="#D9E8C4" />
                <Text className="text-[12.5px] font-semibold" style={{ color: "#D9E8C4" }}>View photo</Text>
              </View>
              <ChevronRight size={14} color="#9FB08A" />
            </Pressable>
          )}

          <View className="p-4">
            <View className="flex-row items-start justify-between gap-2">
              <View className="flex-row items-center gap-3 flex-1 min-w-0">
                <View
                  className="rounded-xl items-center justify-center"
                  style={{ width: 46, height: 46, backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.16)" }}
                >
                  {createElement(Icon, { size: 22, color: "#D9E8C4" })}
                </View>
                <View className="flex-1 min-w-0">
                  <Text className="text-[17px] font-bold text-white" numberOfLines={2}>{systemName(sys)}</Text>
                  {!!subtitle && (
                    <Text className="text-[12px] mt-0.5" style={{ color: "#9FB08A" }} numberOfLines={1}>{subtitle}</Text>
                  )}
                </View>
              </View>
              <View className="rounded-full px-2.5 py-1 flex-row items-center gap-1.5" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: STATUS_BRIGHT[status] }} />
                <Text className="text-[11px] font-semibold" style={{ color: "#D9E8C4" }}>{STATUS_LABEL[status]}</Text>
              </View>
            </View>

            <View className="mt-4 pt-3.5" style={{ borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.08)" }}>
              <View className="flex-row items-center justify-between mb-1.5">
                <Text className="text-[11px]" style={{ color: "#9FB08A" }}>Expected life used</Text>
                <Text className="text-[12px] font-bold" style={{ color: "#D9E8C4" }}>{lifePct != null ? `${lifePct}%` : "—"}</Text>
              </View>
              <View className="rounded-full overflow-hidden" style={{ height: 6, backgroundColor: "rgba(255,255,255,0.12)" }}>
                <View style={{ width: `${lifePct ?? 0}%`, height: 6, backgroundColor: lifeColor, borderRadius: 999 }} />
              </View>
              <Text className="text-[11px] mt-1.5" style={{ color: "#9FB08A" }}>
                {lifePct != null
                  ? `${Number(ageYears.toFixed(1))} of ${sys.expectedLifeYears} years`
                  : "Add the install date and expected life to track this."}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </View>

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
      </View>

      {plan && (
        <View className="rounded-xl p-3 mb-4" style={{ backgroundColor: STATUS_BG.yellow, borderWidth: 1, borderColor: "#F0DDB3" }}>
          <Text className="text-[11px]" style={{ color: STATUS_COLOR.yellow, fontWeight: "600" }}>Recommended savings</Text>
          <Text className="text-[15px]" style={{ color: STATUS_COLOR.yellow, fontWeight: "600" }}>{money(plan.monthly)}/mo toward replacement</Text>
          <Text className="text-[11.5px] mt-1" style={{ color: STATUS_COLOR.yellow }}>
            {plan.months === 1
              ? "Based on expected life, replacement is due now."
              : `Based on expected life: replacement due ${plan.year}, ${formatMonths(plan.months)} away.`}
          </Text>
        </View>
      )}

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

      {showPhoto && (
        <Modal transparent visible={photoViewerOpen} animationType="fade" onRequestClose={() => setPhotoViewerOpen(false)}>
          <Pressable
            onPress={() => setPhotoViewerOpen(false)}
            style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.92)", alignItems: "center", justifyContent: "center" }}
          >
            <Image source={{ uri: sys.photoUrl }} style={{ width: "92%", height: "70%" }} resizeMode="contain" />
            <Pressable
              onPress={() => setPhotoViewerOpen(false)}
              hitSlop={10}
              style={{ position: "absolute", top: insets.top + 16, right: 20 }}
            >
              <X size={24} color="white" />
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </ScrollView>
  );
}
