import * as Linking from "expo-linking";
import { View, Text, Pressable, Image, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft, FileText, ExternalLink } from "lucide-react-native";
import { isManualsLibUrl, opensInBrowser, MANUALSLIB_NAME } from "../lib/manual-links.js";

// Second page of Documents, reached by tapping a system (or "General") on
// the first page — just that bucket's documents.
export default function SystemDocsScreen({ title, documents, onBack, onEdit }) {
  const insets = useSafeAreaInsets();

  function handlePress(d) {
    // Manuals are stored as a PDF link or a ManualsLib page link, not an
    // uploaded photo — there's nothing to edit, so open it directly rather
    // than sending the user to a metadata form that can't preview it.
    if (opensInBrowser(d.photoUrl)) Linking.openURL(d.photoUrl);
    else onEdit(d);
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
          return (
            <Pressable
              key={d.id}
              onPress={() => handlePress(d)}
              className="flex-row items-center justify-between gap-3 py-2.5"
              style={{ borderBottomWidth: i < documents.length - 1 ? 1 : 0, borderBottomColor: "#E7EEDB" }}
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
          );
        })}
        {documents.length === 0 && <Text className="py-3 text-[13px] text-stone-400">No documents here yet.</Text>}
      </View>
    </ScrollView>
  );
}
