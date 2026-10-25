// A manual can be stored two ways: a PDF copy in the user's own storage, or —
// when no downloadable PDF was found — just a link to the manual's page on
// ManualsLib, which the user opens in their browser. The scan only ever links
// to ManualsLib (it never copies anything from there), so documents pointing
// at it have to open as web links, not render as images or go to an edit form.

const MANUALSLIB_URL = /^https?:\/\/(?:www\.)?manualslib\.com\//i;

export const MANUALSLIB_NAME = "ManualsLib";

export function isManualsLibUrl(url) {
  return typeof url === "string" && MANUALSLIB_URL.test(url);
}

// The storage path of a manual PDF the label scan saved to the user's own
// folder ("<userId>/manuals/<id>.pdf" in the photos bucket), or null for any
// other URL — a ManualsLib link, a manufacturer link, an uploaded photo. Used
// to clean up the file when its document is deleted, and only ever matches
// that exact manuals folder, so nothing else can be removed by mistake.
export function storedManualPath(url) {
  if (typeof url !== "string") return null;
  const m = url.match(/\/storage\/v1\/object\/public\/photos\/([^/?#]+\/manuals\/[^/?#]+\.pdf)(?:[?#].*)?$/i);
  return m ? decodeURIComponent(m[1]) : null;
}

// True for a document that should open straight in the browser: a stored PDF
// manual or a ManualsLib page link.
export function opensInBrowser(url) {
  return typeof url === "string" && (url.toLowerCase().endsWith(".pdf") || isManualsLibUrl(url));
}
