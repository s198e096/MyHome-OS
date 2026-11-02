import { useState } from "react";
import * as Linking from "expo-linking";
import { View, Text, Pressable, Image, Modal, ScrollView, FlatList, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft, ChevronRight, FileText, Receipt, Shield, BookOpen, Wrench, Pencil, ExternalLink, Trash2, X } from "lucide-react-native";
import { STATUS_COLOR } from "../lib/constants.js";
import { isManualsLibUrl, opensInBrowser, MANUALSLIB_NAME } from "../lib/manual-links.js";

const CATEGORY_ICON = { Warranty: Shield, Receipt: Receipt, Manual: BookOpen, Invoice: FileText, "Maintenance Invoice": Wrench };
const CATEGORY_LABEL = { Receipt: "Receipts", Manual: "Manuals", Invoice: "Invoices", "Maintenance Invoice": "Maintenance Invoices" };
const CATEGORY_ORDER = ["Warranty", "Receipt", "Manual", "Invoice", "Maintenance Invoice"];

// Second page of Documents, reached by tapping a system (or "General") on
// the first page. Shows that bucket's document categories first (Warranty,
// Receipts, Manuals, Invoices, Maintenance Invoices) rather than one flat
// list — picking a category lists just its documents, and tapping one opens
// a full-screen viewer that can be swiped left/right between every other
// previewable document in that same category, instead of exiting back to
// the list to open the next one. Editing (type, photo) lives behind the
// Edit button on that viewer, not inline on the list. Manuals open straight
// in the browser (so never reach the viewer), which means they carry their
// own trash button on the list, with an inline "Delete this manual?" confirm.
export default function SystemDocsScreen({ title, documents, onBack, onEdit, onDelete }) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const [category, setCategory] = useState(null);
  // The swipeable set behind the viewer: every doc in the current category
  // with an in-app-previewable photo (so swiping never leaves the category
  // it was opened from), plus which one is currently showing.
  const [viewerDocs, setViewerDocs] = useState([]);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [confirmingId, setConfirmingId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const known = CATEGORY_ORDER.map((type) => ({ type, docs: documents.filter((d) => d.type === type) })).filter((g) => g.docs.length > 0);
  const other = documents.filter((d) => !CATEGORY_ORDER.includes(d.type));
  const groups = other.length ? [...known, { type: "Other", docs: other }] : known;

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
      // Deleting a category's last document leaves nothing to list, so go back.
      const stillInCategory = documents.some(
        (x) => x.id !== d.id && (category === "Other" ? !CATEGORY_ORDER.includes(x.type) : x.type === category)
      );
      if (!stillInCategory) setCategory(null);
    } catch {
      setDeleteError("Couldn't delete. Try again.");
    } finally {
      setDeleting(false);
    }
  }

  if (!category) {
    return (
      <ScrollView className="flex-1 bg-[#F5F8F0] px-4" style={{ paddingTop: insets.top + 20 }} showsVerticalScrollIndicator={false}>
        <Pressable onPress={onBack} className="flex-row items-center gap-1 mb-3">
          <ChevronLeft size={16} color="#78716c" />
          <Text className="text-[13px] text-stone-500">Documents</Text>
        </Pressable>
        <Text className="text-[17px] font-semibold text-stone-900 mb-3">{title}</Text>
        <View className="rounded-xl bg-white px-3 mb-6" style={{ borderWidth: 1, borderColor: "#E0E8D3" }}>
          {groups.map(({ type, docs }, i) => {
            const Icon = CATEGORY_ICON[type] || FileText;
            return (
              <Pressable
                key={type}
                onPress={() => setCategory(type)}
                className="flex-row items-center justify-between py-2.5"
                style={{ borderBottomWidth: i < groups.length - 1 ? 1 : 0, borderBottomColor: "#E7EEDB" }}
              >
                <View className="flex-row items-center gap-3 flex-1 min-w-0">
                  <View className="rounded-lg p-2 bg-[#F5F8F0]">
                    <Icon size={17} color="#5F5B50" />
                  </View>
                  <Text className="text-[13.5px] text-stone-800 flex-1 min-w-0" numberOfLines={1}>
                    {CATEGORY_LABEL[type] || type}
                  </Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <Text className="text-[12px] text-stone-400">{docs.length}</Text>
                  <ChevronRight size={15} color="#B8B4A8" />
                </View>
              </Pressable>
            );
          })}
          {groups.length === 0 && <Text className="py-3 text-[13px] text-stone-400">No documents here yet.</Text>}
        </View>
      </ScrollView>
    );
  }

  const categoryDocs = groups.find((g) => g.type === category)?.docs || [];
  // Manuals are often stored as a PDF link or a ManualsLib page link, not an
  // uploaded photo — nothing to preview in-app, so they're excluded from the
  // swipeable set and just open directly in the browser instead.
  const viewableDocs = categoryDocs.filter((d) => d.photoUrl && !opensInBrowser(d.photoUrl));

  function handlePress(d) {
    if (opensInBrowser(d.photoUrl)) {
      Linking.openURL(d.photoUrl);
    } else if (d.photoUrl) {
      const idx = viewableDocs.findIndex((x) => x.id === d.id);
      setViewerDocs(viewableDocs);
      setViewerIndex(idx === -1 ? 0 : idx);
      setViewerOpen(true);
    } else {
      onEdit(d);
    }
  }

  return (
    <ScrollView className="flex-1 bg-[#F5F8F0] px-4" style={{ paddingTop: insets.top + 20 }} showsVerticalScrollIndicator={false}>
      <Pressable onPress={() => setCategory(null)} className="flex-row items-center gap-1 mb-3">
        <ChevronLeft size={16} color="#78716c" />
        <Text className="text-[13px] text-stone-500">{title}</Text>
      </Pressable>
      <Text className="text-[17px] font-semibold text-stone-900 mb-3">
        {CATEGORY_LABEL[category] || category}
      </Text>
      <View className="rounded-xl bg-white px-3 mb-6" style={{ borderWidth: 1, borderColor: "#E0E8D3" }}>
        {categoryDocs.map((d, i) => {
          const linksOut = opensInBrowser(d.photoUrl);
          const canDelete = !!onDelete && (d.type === "Manual" || linksOut);
          const confirming = confirmingId === d.id;
          return (
            <View key={d.id} style={{ borderBottomWidth: i < categoryDocs.length - 1 ? 1 : 0, borderBottomColor: "#E7EEDB" }}>
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
                    <Text className="text-[13.5px] text-stone-800 flex-1 min-w-0" numberOfLines={1}>{d.label}</Text>
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
        {categoryDocs.length === 0 && <Text className="py-3 text-[13px] text-stone-400">No documents here yet.</Text>}
      </View>

      <Modal transparent visible={viewerOpen} animationType="fade" onRequestClose={() => setViewerOpen(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.92)" }}>
          <FlatList
            data={viewerDocs}
            keyExtractor={(d) => d.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={viewerIndex}
            getItemLayout={(_, index) => ({ length: screenWidth, offset: screenWidth * index, index })}
            onMomentumScrollEnd={(e) => setViewerIndex(Math.round(e.nativeEvent.contentOffset.x / screenWidth))}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => setViewerOpen(false)}
                style={{ width: screenWidth, alignItems: "center", justifyContent: "center" }}
              >
                <Image source={{ uri: item.photoUrl }} style={{ width: "92%", height: "70%" }} resizeMode="contain" />
              </Pressable>
            )}
          />
          <Pressable onPress={() => setViewerOpen(false)} hitSlop={10} style={{ position: "absolute", top: insets.top + 16, right: 20 }}>
            <X size={24} color="white" />
          </Pressable>
          <Pressable
            onPress={() => {
              const d = viewerDocs[viewerIndex];
              setViewerOpen(false);
              if (d) onEdit(d);
            }}
            hitSlop={10}
            className="flex-row items-center gap-1"
            style={{ position: "absolute", top: insets.top + 16, left: 20 }}
          >
            <Pencil size={16} color="white" />
            <Text className="text-[13px] font-semibold" style={{ color: "white" }}>Edit</Text>
          </Pressable>
          {!!viewerDocs[viewerIndex] && (
            <View style={{ position: "absolute", bottom: insets.bottom + 20, left: 20, right: 20, alignItems: "center" }}>
              <Text numberOfLines={1} className="text-[12.5px] font-semibold text-center" style={{ color: "white" }}>
                {viewerDocs[viewerIndex].label}
                {isManualsLibUrl(viewerDocs[viewerIndex].photoUrl) ? ` · opens on ${MANUALSLIB_NAME}` : ""}
              </Text>
              {viewerDocs.length > 1 && (
                <Text className="text-[11px] mt-1" style={{ color: "rgba(255,255,255,0.65)" }}>
                  {viewerIndex + 1} of {viewerDocs.length}
                </Text>
              )}
            </View>
          )}
        </View>
      </Modal>
    </ScrollView>
  );
}
