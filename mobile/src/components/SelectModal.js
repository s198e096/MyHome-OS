import { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable, Modal, Animated } from "react-native";
import { Check, Plus } from "lucide-react-native";
import { PRIMARY } from "../lib/constants.js";
import { KEYBOARD_ACCESSORY_ID } from "./KeyboardDoneBar.js";

const fieldStyle = { borderWidth: 1, borderColor: "#E0E8D3" };

// Centered, animated option picker used in place of a native Picker wheel
// wherever a short list of choices needs to feel lighter than a full-screen
// control. Pass `allowCustom` to also offer a free-text entry for values
// not in the preset list.
export default function SelectModal({
  visible,
  title,
  options,
  selectedValue,
  onSelect,
  onClose,
  allowCustom,
  customLabel = "Custom...",
  customTitle = "Custom value",
  customPlaceholder = "Type a value",
}) {
  const [dropdownAnim] = useState(() => new Animated.Value(0));
  const [customDraft, setCustomDraft] = useState(null);

  useEffect(() => {
    if (visible) {
      dropdownAnim.setValue(0);
      Animated.spring(dropdownAnim, { toValue: 1, useNativeDriver: true, friction: 9, tension: 80 }).start();
    }
  }, [visible, dropdownAnim]);

  function handleClose() {
    setCustomDraft(null);
    onClose();
  }

  function handleSelect(value) {
    setCustomDraft(null);
    onSelect(value);
  }

  function confirmCustom() {
    const trimmed = customDraft.trim();
    if (!trimmed) return;
    handleSelect(trimmed);
  }

  // The current value might not be one of the preset options (e.g. a custom
  // one chosen earlier, or something an AI scan filled in) — show it as a
  // selectable row instead of silently dropping it.
  const current = options.some((o) => o.value === selectedValue) ? null : selectedValue;
  const allOptions = current ? [...options, { value: current, label: current }] : options;

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={handleClose}>
      <Pressable
        onPress={handleClose}
        style={{ flex: 1, backgroundColor: "rgba(22,36,15,0.35)", alignItems: "center", justifyContent: "center", padding: 28 }}
      >
        <Animated.View
          style={{
            width: "100%",
            maxWidth: 340,
            opacity: dropdownAnim,
            transform: [{ scale: dropdownAnim.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) }],
          }}
        >
          <Pressable
            onPress={() => {}}
            className="bg-white rounded-2xl p-4"
            style={{ shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 10 }}
          >
            <Text className="text-[15px] font-semibold text-stone-900 mb-3">
              {customDraft !== null ? customTitle : title}
            </Text>
            {customDraft !== null ? (
              <View>
                <TextInput
                  value={customDraft}
                  onChangeText={setCustomDraft}
                  placeholder={customPlaceholder}
                  autoFocus
                  className="w-full px-3 py-2.5 rounded-lg text-[13.5px] mb-3"
                  style={fieldStyle}
                  inputAccessoryViewID={KEYBOARD_ACCESSORY_ID}
                  returnKeyType="done"
                  onSubmitEditing={confirmCustom}
                />
                <View className="flex-row gap-2">
                  <Pressable onPress={() => setCustomDraft(null)} className="flex-1 py-2.5 rounded-lg items-center" style={fieldStyle}>
                    <Text className="text-[13px] font-semibold text-stone-600">Back</Text>
                  </Pressable>
                  <Pressable
                    onPress={confirmCustom}
                    disabled={!customDraft.trim()}
                    className="flex-1 py-2.5 rounded-lg items-center"
                    style={{ backgroundColor: PRIMARY, opacity: customDraft.trim() ? 1 : 0.5 }}
                  >
                    <Text className="text-[13px] font-semibold text-white">Use this</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <>
                {allOptions.map((opt) => {
                  const selected = opt.value === selectedValue;
                  return (
                    <Pressable
                      key={opt.value}
                      onPress={() => handleSelect(opt.value)}
                      className="flex-row items-center justify-between py-2.5 px-3 rounded-lg mb-1"
                      style={{ backgroundColor: selected ? "#F0F5E8" : "transparent" }}
                    >
                      <Text className="text-[13.5px]" style={{ color: selected ? PRIMARY : "#44403c", fontWeight: selected ? "600" : "400" }}>
                        {opt.label}
                      </Text>
                      {selected && <Check size={16} color={PRIMARY} />}
                    </Pressable>
                  );
                })}
                {allowCustom && (
                  <Pressable onPress={() => setCustomDraft("")} className="flex-row items-center gap-1.5 py-2.5 px-3 mt-1">
                    <Plus size={14} color={PRIMARY} />
                    <Text className="text-[13.5px] font-semibold" style={{ color: PRIMARY }}>{customLabel}</Text>
                  </Pressable>
                )}
              </>
            )}
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}
