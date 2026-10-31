import { View, Text } from "react-native";
import { PRIMARY, AVATAR_TYPES } from "../lib/constants.js";

// The user's chosen avatar: their initial on a solid background by default,
// or one of the two standard emoji avatars (man/woman) on a soft background.
export default function Avatar({ profile, size = 64 }) {
  const type = AVATAR_TYPES.find((a) => a.key === profile.avatarType) || AVATAR_TYPES[0];
  return (
    <View
      className="rounded-full items-center justify-center"
      style={{ width: size, height: size, backgroundColor: type.emoji ? "#EAF1E3" : PRIMARY }}
    >
      {type.emoji ? (
        <Text style={{ fontSize: size * 0.58 }}>{type.emoji}</Text>
      ) : (
        <Text style={{ color: "white", fontSize: size * 0.37, fontWeight: "700" }}>{profile.name.charAt(0).toUpperCase()}</Text>
      )}
    </View>
  );
}
