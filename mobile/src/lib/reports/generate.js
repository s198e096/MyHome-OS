// Builds a report PDF on the phone from the user's own data and hands it to the
// share sheet (Save to Files, AirDrop, Mail, Print…). Nothing is generated or
// stored on a server, so producing a report costs nothing per use.

import { Platform } from "react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { CATEGORY_META, isBillCategory } from "../constants.js";
import { buildHomeSaleReport } from "./home-sale.js";
import { buildInsuranceReport } from "./insurance.js";
import { collectReportImages, loadReportImages } from "./images.js";
import { reportInfo } from "./catalog.js";

const helpers = {
  categoryLabel: (sys) => CATEGORY_META[sys.category]?.label || "System",
  isBill: isBillCategory,
};

// Returns the file URI of the finished PDF. `onStatus` receives short progress
// messages ("Preparing photos (3/12)") for the screen to show.
export async function createReportPdf(type, data, onStatus = () => {}) {
  if (Platform.OS === "web") throw new Error("Reports are created in the phone app.");
  const info = reportInfo(type);
  if (!info) throw new Error("Unknown report");

  const generatedOn = new Date();
  let html;
  if (type === "insurance_inventory") {
    const wanted = collectReportImages(data);
    let images = {};
    if (wanted.length > 0) {
      onStatus(`Preparing photos (0/${wanted.length})`);
      images = await loadReportImages(wanted, (done, total) => onStatus(`Preparing photos (${done}/${total})`));
    }
    onStatus("Building your report…");
    html = buildInsuranceReport({ ...data, generatedOn, images }, helpers);
  } else {
    onStatus("Building your report…");
    html = buildHomeSaleReport({ ...data, generatedOn }, helpers);
  }

  const { uri } = await Print.printToFileAsync({
    html,
    width: info.page.width,
    height: info.page.height,
    margins: { top: 32, bottom: 32, left: 32, right: 32 },
  });
  return uri;
}

export async function shareReportPdf(uri, type) {
  if (!(await Sharing.isAvailableAsync())) throw new Error("Sharing isn't available on this device.");
  await Sharing.shareAsync(uri, {
    mimeType: "application/pdf",
    UTI: "com.adobe.pdf",
    dialogTitle: reportInfo(type)?.title,
  });
}
