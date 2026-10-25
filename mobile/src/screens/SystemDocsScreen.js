import { useState } from "react";
import * as Linking from "expo-linking";
import { View, Text, Pressable, Image, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft, FileText, ExternalLink, Trash2 } from "lucide-react-native";
import { STATUS_COLOR } from "../lib/constants.js";
import { isManualsLibUrl, opensInBrowser, MANUALSLIB_NAME } from "../lib/manual-links.js";

// Second page of Documents, reached by tapping a system (or "General") on
// the first page — just that bucket's documents.
export default function SystemDocsScreen({ title, documents, onBack, onEdit, onDelete }) {
  const insets = useSafeAreaInsets();
  const [confirmingId, setConfirmingId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  function handlePress(d) {
    // Manuals are stored as a PDF link or a ManualsLib page link, not an
    // uploaded photo — there's nothing to edit, so open it directly rather
    // than sending the user to a metadata form that can't preview it.
    if (opensInBrowser(d.photoUrl)) Linking.openURL(d.photoUrl);
    else onEdit(d);
  }

  function askDelete(id) {
    setDeleteError("");
    setConfirmingId(id);
  }

  async function confirmDelete(d) {
    setDeleting(true);
    setDeleteError("");
    try {
      await onDelete(d.id);
      setConfirmingId(null);
    } catch {
      setDeleteError("Couldn't delete. Try again.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <ScrollView className="flex-1 bg-[#F5F8F0] px-4" style={{ paddingTop: insets.top + 20 }} showsVerticalScrollIndicator={false}>
      <Pressable onPress={onBack} className="flex-row items-center gap-1 mb-3">
        <ChevronLeft size={16} color="#78716c" />
        <Text className="text-[13px] text-stone-500">Documents</Text>
      </Pressable>
      <Text className="text-[17px] font-semibold text-stone-900 mb-3">{title}</Text>
      <View className="rounded-xl bg-white px-3 mb-6" style={{ borderWidth: 1, borderColor: "#E0E8D3" }}>
        {documents.map((d, i) => {
          const linksOut = opensInBrowser(d.photoUrl);
          // Manuals open straight in the browser (never the edit form, which
          // is where other documents get their delete button), so they carry
          // their own trash button here.
          const canDelete = !!onDelete && (d.type === "Manual" || linksOut);
          const confirming = confirmingId === d.id;
          return (
            <View
              key={d.id}
              style={{ borderBottomWidth: i < documents.length - 1 ? 1 : 0, borderBottomColor: "#E7EEDB" }}
            >
              <View className="flex-row items-center">
                <Pressable
                  onPress={() => handlePress(d)}
                  className="flex-row items-center justify-between gap-3 py-2.5 flex-1 min-w-0"
                >
                  <View className="flex-row items-center gap-3 flex-1 min-w-0">
                    {d.photoUrl && !linksOut ? (
                      <Image source={{ uri: d.photoUrl }} style={{ width: 34, height: 34, borderRadius: 8, borderWidth: 1, borderColor: "#E0E8D3" }} />
                    ) : (
                      <FileText size={17} color="#5F5B50" />
                    )}
                    <View className="flex-1 min-w-0">
                      <Text className="text-[13.5px] text-stone-800" numberOfLines={1}>{d.label}</Text>
                      <Text className="text-[11.5px] text-stone-400">
                        {d.type}{isManualsLibUrl(d.photoUrl) ? ` · opens on ${MANUALSLIB_NAME}` : ""}
                      </Text>
                    </View>
                  </View>
                  {linksOut && <ExternalLink size={14} color="#B8B4A8" />}
                </Pressable>
                {canDelete && !confirming && (
                  <Pressable
                    onPress={() => askDelete(d.id)}
                    hitSlop={8}
                    accessibilityLabel={`Delete ${d.label}`}
                    className="pl-3 py-2.5"
                  >
                    <Trash2 size={16} color="#9C978C" />
                  </Pressable>
                )}
              </View>

              {confirming && (
                <View className="pb-2.5">
                  <View className="flex-row items-center gap-2">
                    <Text className="flex-1 text-[12.5px] text-stone-600">
                      {isManualsLibUrl(d.photoUrl) ? "Remove this manual link?" : "Delete this manual?"}
                    </Text>
                    <Pressable
                      onPress={() => setConfirmingId(null)}
                      disabled={deleting}
                      className="rounded-full px-3 py-1.5"
                      style={{ borderWidth: 1, borderColor: "#D8D5CB", opacity: deleting ? 0.5 : 1 }}
                    >
                      <Text className="text-[12px] font-semibold text-stone-700">Cancel</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => confirmDelete(d)}
                      disabled={deleting}
                      className="rounded-full px-3 py-1.5"
                      style={{ backgroundColor: STATUS_COLOR.red, opacity: deleting ? 0.6 : 1 }}
                    >
                      <Text className="text-[12px] font-semibold text-white">{deleting ? "Deleting..." : "Delete"}</Text>
                    </Pressable>
                  </View>
                  {!!deleteError && <Text className="text-[12px] mt-1.5" style={{ color: STATUS_COLOR.red }}>{deleteError}</Text>}
                </View>
              )}
            </View>
          );
        })}
        {documents.length === 0 && <Text className="py-3 text-[13px] text-stone-400">No documents here yet.</Text>}
      </View>
    </ScrollView>
  );
}
