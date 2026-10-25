// Photos for the insurance report. The print engine can't be trusted to fetch
// remote images before it renders the page, so every photo is downloaded,
// shrunk, and embedded in the report as a data URI up front.

import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { opensInBrowser } from "../manual-links.js";

const MAX_IMAGES = 80;
const CONCURRENCY = 4;
const PROOF_TYPES = ["Receipt", "Invoice", "Warranty"];

const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

// Standard base64 for a byte array. Written out here so nothing depends on
// which globals the JS engine happens to provide.
export function bytesToBase64(bytes) {
  let out = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i];
    const b = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const c = i + 2 < bytes.length ? bytes[i + 2] : 0;
    out += B64[a >> 2] + B64[((a & 3) << 4) | (b >> 4)];
    out += i + 1 < bytes.length ? B64[((b & 15) << 2) | (c >> 6)] : "=";
    out += i + 2 < bytes.length ? B64[c & 63] : "=";
  }
  return out;
}

const isPhoto = (url) => !!url && !opensInBrowser(url);

// The photos a report should embed, most useful first, as { url, maxWidth }:
// receipts and warranties at a legible size, then item photos at a size that
// still looks sharp three to a page.
export function collectReportImages({ systems = [], furniture = [], documents = [] }) {
  const wanted = [];
  const seen = new Set();
  const add = (url, maxWidth) => {
    if (isPhoto(url) && !seen.has(url)) {
      seen.add(url);
      wanted.push({ url, maxWidth });
    }
  };
  documents.filter((d) => PROOF_TYPES.includes(d.type)).forEach((d) => add(d.photoUrl, 900));
  systems.filter((s) => !s.archived).forEach((s) => add(s.photoUrl, 640));
  furniture.forEach((f) => add(f.photoUrl, 640));
  return wanted.slice(0, MAX_IMAGES);
}

async function downloadAsDataUri(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Photo download failed (${res.status})`);
  const bytes = new Uint8Array(await res.arrayBuffer());
  const type = (res.headers.get("content-type") || "image/jpeg").split(";")[0];
  return `data:${type};base64,${bytesToBase64(bytes)}`;
}

// One photo as a small JPEG data URI, or null if it can't be loaded at all.
async function loadOne({ url, maxWidth }) {
  let original;
  try {
    original = await downloadAsDataUri(url);
  } catch {
    return null;
  }
  try {
    const context = ImageManipulator.manipulate(original);
    context.resize({ width: maxWidth });
    const rendered = await context.renderAsync();
    const out = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: 0.65, base64: true });
    return `data:image/jpeg;base64,${out.base64}`;
  } catch {
    // Couldn't shrink it — the full-size copy still prints fine, just larger.
    return original;
  }
}

// { [url]: dataUri } for every photo that loaded. A photo that fails is left
// out so the report prints without it instead of failing.
export async function loadReportImages(wanted, onProgress = () => {}) {
  const images = {};
  let next = 0;
  let done = 0;
  async function worker() {
    while (next < wanted.length) {
      const item = wanted[next++];
      const dataUri = await loadOne(item);
      if (dataUri) images[item.url] = dataUri;
      onProgress(++done, wanted.length);
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, wanted.length) }, worker));
  return images;
}
