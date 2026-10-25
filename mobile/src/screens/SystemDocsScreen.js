import { useState } from "react";
import * as Linking from "expo-linking";
import { View, Text, Pressable, Image, Modal, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft, ChevronRight, FileText, Receipt, Shield, BookOpen, Pencil, ExternalLink, X } from "lucide-react-native";
import { isManualsLibUrl, opensInBrowser, MANUALSLIB_NAME } from "../lib/manual-links.js";

const CATEGORY_ICON = { Warranty: Shield, Receipt: Receipt, Manual: BookOpen, Invoice: FileText };
const CATEGORY_ORDER = ["Warranty", "Receipt", "Manual", "Invoice"];

// Second page of Documents, reached by tapping a system (or "General") on
// the first page. Shows that bucket's document categories first (Warranty,
// Receipts, Manuals, Invoices) rather than one flat list — picking a
// category lists just its documents, and tapping one opens the full
// image/document directly. Editing (type, photo) lives behind the Edit
// button on that full view, not inline on the list.
export default function SystemDocsScreen({ title, documents, onBack, onEdit }) {
  const insets = useSafeAreaInsets();
  const [category, setCategory] = useState(null);
  const [viewingDoc, setViewingDoc] = useState(null);

  const known = CATEGORY_ORDER.map((type) => ({ type, docs: documents.filter((d) => d.type === type) })).filter((g) => g.docs.length > 0);
  const other = documents.filter((d) => !CATEGORY_ORDER.includes(d.type));
  const groups = other.length ? [...known, { type: "Other", docs: other }] : known;

  function handlePress(d) {
    // Manuals are often stored as a PDF link or a ManualsLib page link, not
    // an uploaded photo — there's nothing to preview in-app, so open it
    // directly rather than a viewer that can't show it.
    if (opensInBrowser(d.photoUrl)) Linking.openURL(d.photoUrl);
    else if (d.photoUrl) setViewingDoc(d);
    else onEdit(d);
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
                    {type === "Receipt" ? "Receipts" : type === "Manual" ? "Manuals" : type === "Invoice" ? "Invoices" : type}
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

  return (
    <ScrollView className="flex-1 bg-[#F5F8F0] px-4" style={{ paddingTop: insets.top + 20 }} showsVerticalScrollIndicator={false}>
      <Pressable onPress={() => setCategory(null)} className="flex-row items-center gap-1 mb-3">
        <ChevronLeft size={16} color="#78716c" />
        <Text className="text-[13px] text-stone-500">{title}</Text>
      </Pressable>
      <Text className="text-[17px] font-semibold text-stone-900 mb-3">
        {category === "Receipt" ? "Receipts" : category === "Manual" ? "Manuals" : category === "Invoice" ? "Invoices" : category}
      </Text>
      <View className="rounded-xl bg-white px-3 mb-6" style={{ borderWidth: 1, borderColor: "#E0E8D3" }}>
        {categoryDocs.map((d, i) => {
          const linksOut = opensInBrowser(d.photoUrl);
          return (
            <Pressable
              key={d.id}
              onPress={() => handlePress(d)}
              className="flex-row items-center justify-between gap-3 py-2.5"
              style={{ borderBottomWidth: i < categoryDocs.length - 1 ? 1 : 0, borderBottomColor: "#E7EEDB" }}
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
          );
        })}
        {categoryDocs.length === 0 && <Text className="py-3 text-[13px] text-stone-400">No documents here yet.</Text>}
      </View>

      <Modal transparent visible={!!viewingDoc} animationType="fade" onRequestClose={() => setViewingDoc(null)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.92)" }}>
          <Pressable
            onPress={() => setViewingDoc(null)}
            style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
          >
            {viewingDoc && <Image source={{ uri: viewingDoc.photoUrl }} style={{ width: "92%", height: "70%" }} resizeMode="contain" />}
          </Pressable>
          <Pressable onPress={() => setViewingDoc(null)} hitSlop={10} style={{ position: "absolute", top: insets.top + 16, right: 20 }}>
            <X size={24} color="white" />
          </Pressable>
          <Pressable
            onPress={() => {
              const d = viewingDoc;
              setViewingDoc(null);
              onEdit(d);
            }}
            hitSlop={10}
            className="flex-row items-center gap-1"
            style={{ position: "absolute", top: insets.top + 16, left: 20 }}
          >
            <Pencil size={16} color="white" />
            <Text className="text-[13px] font-semibold" style={{ color: "white" }}>Edit</Text>
          </Pressable>
          {!!viewingDoc && (
            <Text
              numberOfLines={1}
              className="text-[12.5px] font-semibold text-center"
              style={{ color: "white", position: "absolute", bottom: insets.bottom + 20, left: 20, right: 20 }}
            >
              {viewingDoc.label}{isManualsLibUrl(viewingDoc.photoUrl) ? ` · opens on ${MANUALSLIB_NAME}` : ""}
            </Text>
          )}
        </View>
      </Modal>
    </ScrollView>
  );
}
