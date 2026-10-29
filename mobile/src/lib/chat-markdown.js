// Turns the assistant's markdown-style replies ("**filter** replacement",
// "- item", "1. step", "## Heading") into plain pieces the chat screen can
// render as real formatting instead of showing the asterisks. Pure functions
// with no React Native imports, so they can be tested anywhere.
//
// Only what the assistant actually produces is handled: bold, italics, inline
// code, headings, bullet and numbered lists. Anything else stays as written.

// **bold**, `code`, *italic* (not "2 * 3": the opening * must touch the word).
const INLINE = /\*\*([^*]+?)\*\*|`([^`\n]+?)`|\*([^\s*][^*\n]*?)\*/g;
const LINK = /\[([^\]]+)\]\((?:https?:\/\/|mailto:)[^)\s]+\)/g;

// "plain **bold** text" -> [{ text: "plain " }, { text: "bold", bold: true }, { text: " text" }]
export function parseInline(raw) {
  const text = String(raw ?? "").replace(LINK, "$1");
  const parts = [];
  let last = 0;
  for (const m of text.matchAll(INLINE)) {
    if (m.index > last) parts.push({ text: text.slice(last, m.index) });
    if (m[1] != null) parts.push({ text: m[1], bold: true });
    else if (m[2] != null) parts.push({ text: m[2], code: true });
    else parts.push({ text: m[3], italic: true });
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last) });
  return parts;
}

// One entry per line: { type: "text" | "heading" | "bullet" | "number" | "gap", text, n?, indent? }.
// Blank lines become a single "gap"; horizontal rules and edge gaps are dropped.
export function parseBlocks(raw) {
  const blocks = [];
  for (const line of String(raw ?? "").replace(/\r/g, "").split("\n")) {
    let m;
    if (!line.trim()) {
      if (blocks.length && blocks[blocks.length - 1].type !== "gap") blocks.push({ type: "gap" });
    } else if (/^\s*([-*_]\s*){3,}$/.test(line)) {
      continue; // --- / *** / ___
    } else if ((m = line.match(/^\s*#{1,6}\s+(.*)$/))) {
      blocks.push({ type: "heading", text: m[1].trim() });
    } else if ((m = line.match(/^(\s*)[-*•]\s+(.*)$/))) {
      blocks.push({ type: "bullet", text: m[2].trim(), indent: Math.min(3, Math.floor(m[1].length / 2)) });
    } else if ((m = line.match(/^(\s*)(\d+)[.)]\s+(.*)$/))) {
      blocks.push({ type: "number", n: m[2], text: m[3].trim(), indent: Math.min(3, Math.floor(m[1].length / 2)) });
    } else {
      blocks.push({ type: "text", text: line.trim() });
    }
  }
  while (blocks.length && blocks[blocks.length - 1].type === "gap") blocks.pop();
  return blocks;
}
