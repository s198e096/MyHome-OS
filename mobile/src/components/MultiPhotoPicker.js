import { View, Text, Image, Pressable } from "react-native";
import { X } from "lucide-react-native";
import PhotoPicker from "./PhotoPicker.js";

// Lets the user attach one or more photos under a single label — e.g. a
// multi-page receipt or warranty certificate. Each already-added page shows
// as a thumbnail with a remove button; the PhotoPicker below is always
// empty, so tapping it adds another page rather than replacing the last one.
export default function MultiPhotoPicker({ label, photoUrls, onChange }) {
  function addPhoto(url) {
    onChange([...photoUrls, url]);
  }

  function removePhoto(index) {
    onChange(photoUrls.filter((_, i) => i !== index));
  }

  return (
    <View>
      {label && <Text className="text-[11px] text-stone-500 mb-1">{label}</Text>}
      {photoUrls.map((url, i) => (
        <View key={`${url}-${i}`} className="mb-2" style={{ position: "relative" }}>
          <Image source={{ uri: url }} style={{ width: "100%", height: 100, borderRadius: 8 }} resizeMode="cover" />
          <Pressable
            onPress={() => removePhoto(i)}
            hitSlop={8}
            className="items-center justify-center rounded-full"
            style={{ position: "absolute", top: 6, right: 6, width: 22, height: 22, backgroundColor: "rgba(0,0,0,0.55)" }}
          >
            <X size={13} color="white" />
          </Pressable>
        </View>
      ))}
      <PhotoPicker photoUrl="" onChange={addPhoto} />
    </View>
  );
}
