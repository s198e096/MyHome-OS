import { View, Text, Platform } from "react-native";
import { parseBlocks, parseInline } from "../lib/chat-markdown.js";

const TEXT_STYLE = { fontSize: 13.5, lineHeight: 19, color: "#292524" };
const MONO = Platform.select({ ios: "Menlo", default: "monospace" });

// One line's text with its **bold**, *italic* and `code` pieces styled.
function Inline({ text, bold }) {
  return parseInline(text).map((p, i) => (
    <Text
      key={i}
      style={{
        fontWeight: bold || p.bold ? "700" : undefined,
        fontStyle: p.italic ? "italic" : undefined,
        ...(p.code ? { fontFamily: MONO, fontSize: 12.5, backgroundColor: "#F0F5E8" } : null),
      }}
    >
      {p.text}
    </Text>
  ));
}

// An assistant reply shown as formatted text (bold, lists, headings) instead of
// raw markdown with its asterisks.
export default function ChatMessageText({ text }) {
  return (
    <View>
      {parseBlocks(text).map((b, i) => {
        if (b.type === "gap") return <View key={i} style={{ height: 6 }} />;
        if (b.type === "bullet" || b.type === "number") {
          return (
            <View key={i} style={{ flexDirection: "row", paddingLeft: b.indent * 12 }}>
              <Text style={[TEXT_STYLE, { width: b.type === "number" ? 22 : 14 }]}>{b.type === "number" ? `${b.n}.` : "•"}</Text>
              <Text style={[TEXT_STYLE, { flex: 1 }]}>
                <Inline text={b.text} />
              </Text>
            </View>
          );
        }
        return (
          <Text key={i} style={TEXT_STYLE}>
            <Inline text={b.text} bold={b.type === "heading"} />
          </Text>
        );
      })}
    </View>
  );
}
