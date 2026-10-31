import { useState } from "react";
import { View, Text, Pressable, ScrollView, Modal } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Pencil, ChevronRight } from "lucide-react-native";
import { PRIMARY, STATUS_COLOR, PLANS, AVATAR_TYPES } from "../lib/constants.js";
import { money } from "../lib/forecast.js";
import { fmtAddress, fmtPropertyName } from "../lib/address-format.js";
import { buildFeatureSummary } from "../lib/propertyFeatures.js";
import LedgerRow from "../components/LedgerRow.js";
import ReportsSection from "../components/ReportsSection.js";
import Avatar from "../components/Avatar.js";

const AVATAR_LABEL = { initials: "Initials", man: "Man", woman: "Woman" };

export default function AccountScreen({ profile, reports, onBuyReport, onGenerateReport, onRecheckReport, onEdit, onManagePlan, onSignOut, onChangeAvatar }) {
  const planName = PLANS.find((p) => p.id === profile.plan)?.name || "Free";
  const insets = useSafeAreaInsets();
  const featureChips = buildFeatureSummary(profile);
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);
  const avatarType = profile.avatarType || "initials";

  function selectAvatarType(type) {
    setAvatarPickerOpen(false);
    onChangeAvatar(type);
  }

  return (
    <ScrollView className="flex-1 bg-[#F5F8F0] px-4" style={{ paddingTop: insets.top + 20 }} showsVerticalScrollIndicator={false}>
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-[17px] font-semibold text-stone-900">Account</Text>
        <Pressable onPress={onEdit} className="flex-row items-center gap-1">
          <Pencil size={14} color={PRIMARY} />
          <Text className="text-[13px] font-semibold" style={{ color: PRIMARY }}>Edit</Text>
        </Pressable>
      </View>

      <View className="items-center mb-5">
        <Pressable onPress={() => setAvatarPickerOpen(true)} accessibilityLabel="Change avatar" className="mb-2">
          <Avatar profile={profile} size={64} />
        </Pressable>
        <Text className="text-[15px] font-semibold text-stone-900">{profile.name}</Text>
        <Text className="text-[12.5px] text-stone-400">{profile.email}</Text>
      </View>

      <Modal transparent visible={avatarPickerOpen} animationType="fade" onRequestClose={() => setAvatarPickerOpen(false)}>
        <Pressable
          onPress={() => setAvatarPickerOpen(false)}
          style={{ flex: 1, backgroundColor: "rgba(22,36,15,0.35)", alignItems: "center", justifyContent: "center", padding: 28 }}
        >
          <Pressable
            onPress={() => {}}
            className="bg-white rounded-2xl p-4"
            style={{ width: "100%", maxWidth: 340, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 10 }}
          >
            <Text className="text-[15px] font-semibold text-stone-900 mb-3">Choose an avatar</Text>
            <View className="flex-row justify-center gap-4">
              {AVATAR_TYPES.map(({ key }) => {
                const selected = key === avatarType;
                return (
                  <Pressable key={key} onPress={() => selectAvatarType(key)} className="items-center gap-1.5">
                    <View
                      className="rounded-full items-center justify-center"
                      style={{ width: 56, height: 56, borderWidth: selected ? 3 : 0, borderColor: PRIMARY }}
                    >
                      <Avatar profile={{ ...profile, avatarType: key }} size={selected ? 50 : 56} />
                    </View>
                    <Text className="text-[11.5px]" style={{ color: selected ? PRIMARY : "#78716c", fontWeight: selected ? "700" : "400" }}>
                      {AVATAR_LABEL[key]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Text className="text-[12px] font-semibold text-stone-500 mb-1">
        {fmtPropertyName(profile.propertyName) || "Home"}
      </Text>
      <View className="rounded-xl bg-white px-3 mb-4" style={{ borderWidth: 1, borderColor: "#E0E8D3" }}>
        <View className="py-2.5" style={{ borderBottomWidth: 1, borderBottomColor: "#E7EEDB" }}>
          <Text className="text-[13.5px] text-stone-800">Address</Text>
          <Text className="text-[12px] text-stone-500 mt-0.5">{fmtAddress(profile.address)}</Text>
        </View>
        {(profile.bedrooms != null || profile.yearBuilt != null) && (
          <LedgerRow
            label="Details"
            value={[profile.bedrooms != null ? `${profile.bedrooms} bed` : null, profile.yearBuilt != null ? `Built ${profile.yearBuilt}` : null]
              .filter(Boolean)
              .join(" · ")}
          />
        )}
        {profile.purchasePrice != null && <LedgerRow label="Purchase price" value={money(profile.purchasePrice)} />}
        {profile.propertyValue != null && (
          <LedgerRow
            label="Home value"
            sub={[
              profile.propertyValueSource ? `Source: ${profile.propertyValueSource}` : null,
              profile.propertyValueUpdatedAt
                ? `Updated ${new Date(profile.propertyValueUpdatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                : null,
            ].filter(Boolean).join(" · ") || undefined}
            value={money(profile.propertyValue)}
          />
        )}
        <Pressable onPress={onManagePlan} className="flex-row items-center justify-between py-2.5">
          <Text className="text-[13.5px] text-stone-800">Plan</Text>
          <View className="flex-row items-center gap-1">
            <Text className="text-[13.5px] font-semibold" style={{ color: PRIMARY }}>{planName}</Text>
            <ChevronRight size={15} color="#B8B4A8" />
          </View>
        </Pressable>
      </View>

      {featureChips.length > 0 && (
        <>
          <Text className="text-[12px] font-semibold text-stone-500 mb-1">Property features</Text>
          <View className="rounded-xl bg-white p-3 mb-4" style={{ borderWidth: 1, borderColor: "#E0E8D3" }}>
            <Text className="text-[12.5px] text-stone-600 leading-relaxed">{featureChips.join(" · ")}</Text>
          </View>
        </>
      )}

      <ReportsSection reports={reports} onBuy={onBuyReport} onGenerate={onGenerateReport} onRecheck={onRecheckReport} />

      <Pressable onPress={onSignOut} className="w-full py-2.5 rounded-lg items-center mb-6" style={{ borderWidth: 1, borderColor: "#E0E8D3" }}>
        <Text className="text-[13.5px] font-semibold" style={{ color: STATUS_COLOR.red }}>Sign out</Text>
      </Pressable>
    </ScrollView>
  );
}
