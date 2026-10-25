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

// True for a document that should open straight in the browser: a stored PDF
// manual or a ManualsLib page link.
export function opensInBrowser(url) {
  return typeof url === "string" && (url.toLowerCase().endsWith(".pdf") || isManualsLibUrl(url));
}
