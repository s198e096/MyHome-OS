import { useState } from "react";
import { View, Text, Pressable, Image } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Camera, Upload, Image as ImageIcon } from "lucide-react-native";
import { STATUS_COLOR } from "../lib/constants.js";
import { uploadPhoto } from "../lib/db.js";

export default function PhotoPicker({ photoUrl, onChange }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleResult(result) {
    if (result.canceled) return;
    setError("");
    setUploading(true);
    try {
      const url = await uploadPhoto(result.assets[0]);
      onChange(url);
    } catch {
      setError("Couldn't upload photo. Try again.");
    } finally {
      setUploading(false);
    }
  }

  async function handleCamera() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      setError("Camera permission is required.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.8 });
    await handleResult(result);
  }

  async function handleUpload() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      setError("Photo library permission is required.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8 });
    await handleResult(result);
  }

  return (
    <View className="rounded-xl bg-white p-3 mb-3 items-center" style={{ borderWidth: 1, borderColor: "#E0E8D3" }}>
      {photoUrl ? (
        <Image source={{ uri: photoUrl }} style={{ width: "100%", height: 140, borderRadius: 8 }} resizeMode="cover" />
      ) : (
        <ImageIcon size={28} color="#B9B4A6" />
      )}
      <Text className="text-[12px] text-stone-500 mt-2 mb-2">
        {uploading ? "Uploading..." : photoUrl ? "Replace photo" : "Take a photo or upload one"}
      </Text>
      {error && <Text className="text-[11px] mb-2" style={{ color: STATUS_COLOR.red }}>{error}</Text>}
      <View className="flex-row gap-2">
        <Pressable
          onPress={handleCamera}
          disabled={uploading}
          className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-lg"
          style={{ borderWidth: 1, borderColor: "#D8D5CB" }}
        >
          <Camera size={14} color="#5F5B50" />
          <Text className="text-[12px] text-stone-600">Camera</Text>
        </Pressable>
        <Pressable
          onPress={handleUpload}
          disabled={uploading}
          className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-lg"
          style={{ borderWidth: 1, borderColor: "#D8D5CB" }}
        >
          <Upload size={14} color="#5F5B50" />
          <Text className="text-[12px] text-stone-600">Upload</Text>
        </Pressable>
      </View>
    </View>
  );
}
