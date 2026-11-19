import { useState } from "react";
import { Modal, View, Text, Pressable, ActivityIndicator } from "react-native";
import { TriangleAlert } from "lucide-react-native";
import { PRIMARY, STATUS_COLOR } from "../lib/constants.js";

// Singular / plural name for each kind of document a system can have, in the
// order they're listed.
const DOC_NOUNS = [
  ["Warranty", "warranty", "warranties"],
  ["Receipt", "receipt", "receipts"],
  ["Manual", "manual", "manuals"],
  ["Invoice", "invoice", "invoices"],
  ["Maintenance Invoice", "maintenance invoice", "maintenance invoices"],
];

// "1 warranty, 2 receipts and 1 manual" - what's about to be affected, spelled
// out so the user can see exactly which documents the choice is about.
export function summarizeDocuments(documents) {
  const known = DOC_NOUNS.map(([type, one, many]) => {
    const n = documents.filter((d) => d.type === type).length;
    return n > 0 ? `${n} ${n === 1 ? one : many}` : null;
  }).filter(Boolean);
  const otherCount = documents.filter((d) => !DOC_NOUNS.some(([type]) => type === d.type)).length;
  if (otherCount > 0) known.push(`${otherCount} other ${otherCount === 1 ? "document" : "documents"}`);
  if (known.length <= 1) return known[0] || "";
  return `${known.slice(0, -1).join(", ")} and ${known[known.length - 1]}`;
}

// Shown when a system that still has documents is deleted. Deleting a system
// never silently decides what happens to its manuals, receipts and warranty
// papers: the user picks whether they go with it or stay in Documents (under
// General). `onChoose(deleteDocuments)` does the delete; if it throws, nothing
// was removed and the dialog says so and stays open.
export default function DeleteSystemModal({ visible, name, documents, onChoose, onClose }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const count = documents.length;
  const summary = summarizeDocuments(documents);

  async function choose(deleteDocuments) {
    if (busy) return;
    setError("");
    setBusy(true);
    try {
      await onChoose(deleteDocuments);
      // Success leaves this screen (the system is gone), so nothing to reset.
    } catch {
      setError("Couldn't delete. Nothing was removed - try again.");
      setBusy(false);
    }
  }

  function close() {
    if (busy) return;
    setError("");
    onClose();
  }

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={close}>
      <Pressable
        onPress={close}
        style={{ flex: 1, backgroundColor: "rgba(22,36,15,0.35)", alignItems: "center", justifyContent: "center", padding: 24 }}
      >
        {/* An inner Pressable so taps on the card don't fall through to the backdrop. */}
        <Pressable onPress={() => {}} style={{ width: "100%", maxWidth: 380 }}>
          <View className="rounded-2xl bg-white p-4" style={{ borderWidth: 1, borderColor: "#E0E8D3" }}>
            <View className="flex-row items-center gap-2 mb-1.5">
              <TriangleAlert size={18} color={STATUS_COLOR.red} />
              <Text className="text-[15px] font-semibold text-stone-900 flex-1" numberOfLines={2}>Delete {name}?</Text>
            </View>
            <Text className="text-[13px] text-stone-700 mb-1" style={{ lineHeight: 18 }}>
              This system has {count} {count === 1 ? "document" : "documents"}: {summary}.
            </Text>
            <Text className="text-[12px] text-stone-500 mb-3.5" style={{ lineHeight: 17 }}>
              Its warranty dates are removed with it either way. Tasks and expenses stay, but are no longer tied to a system.
            </Text>

            <Pressable
              onPress={() => choose(true)}
              disabled={busy}
              className="w-full rounded-lg px-3 py-2.5 mb-2"
              style={{ backgroundColor: STATUS_COLOR.red, opacity: busy ? 0.5 : 1 }}
            >
              <Text className="text-[13.5px] font-semibold text-white text-center">Delete system and its documents</Text>
              <Text className="text-[11.5px] text-white text-center mt-0.5" style={{ opacity: 0.85 }}>
                The {count === 1 ? "document is" : `${count} documents are`} deleted for good.
              </Text>
            </Pressable>

            <Pressable
              onPress={() => choose(false)}
              disabled={busy}
              className="w-full rounded-lg px-3 py-2.5 mb-2"
              style={{ borderWidth: 1, borderColor: "#E0E8D3", backgroundColor: "white", opacity: busy ? 0.5 : 1 }}
            >
              <Text className="text-[13.5px] font-semibold text-center" style={{ color: PRIMARY }}>Delete system, keep documents</Text>
              <Text className="text-[11.5px] text-stone-500 text-center mt-0.5">
                {count === 1 ? "It stays" : "They stay"} in Documents under General.
              </Text>
            </Pressable>

            {!!error && <Text className="text-[12px] mb-2 text-center" style={{ color: STATUS_COLOR.red }}>{error}</Text>}

            <Pressable onPress={close} disabled={busy} className="w-full py-2 items-center flex-row justify-center gap-2">
              {busy && <ActivityIndicator size="small" color="#78716c" />}
              <Text className="text-[13px] text-stone-500">{busy ? "Deleting..." : "Cancel"}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
