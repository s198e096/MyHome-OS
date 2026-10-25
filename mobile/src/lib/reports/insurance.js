// "Insurance inventory report": a documented list of the home's systems,
// appliances, belongings and receipts, formatted for a claim after a storm or
// fire — what each item is, where it was, what it cost, what it would cost to
// replace, and what proof exists — with a signed statement at the end.
//
// A pure function from the user's data to an HTML string (rendered to PDF by
// the phone's print engine). `data.images` maps a photo URL to a small
// data-URI copy already downloaded by the caller; an item whose photo isn't in
// the map is simply printed without one. `h` supplies the app's naming rule:
//   h.categoryLabel(sys) -> "HVAC - Indoor Unit"
// so this file needs no app or React Native imports.

import { escapeHtml as e, fmtMoney, fmtMonthYear, fmtLongDate, sum, plural } from "./format.js";
import { groupSystems, describeSystem } from "./groups.js";
import { htmlDocument } from "./styles.js";

const PROOF_TYPES = ["Receipt", "Invoice", "Warranty"];

function table(headers, rows, numCols = []) {
  const head = headers.map((t, i) => `<th${numCols.includes(i) ? ' class="num"' : ""}>${e(t)}</th>`).join("");
  return `<table><thead><tr>${head}</tr></thead><tbody>${rows.join("")}</tbody></table>`;
}

export function buildInsuranceReport(data, h) {
  const { profile, furniture = [], documents = [], warranties = [], generatedOn, images = {} } = data;
  const active = (data.systems || []).filter((s) => !s.archived);
  const systemsById = new Map((data.systems || []).map((s) => [s.id, s]));
  const hasImage = (url) => !!url && !!images[url];
  const showPhotos = active.some((s) => hasImage(s.photoUrl)) || furniture.some((f) => hasImage(f.photoUrl));
  const photoCell = (url) =>
    showPhotos ? `<td>${hasImage(url) ? `<img class="thumb" src="${images[url]}" alt="">` : '<span class="muted small">—</span>'}</td>` : "";
  const photoHead = showPhotos ? ["Photo"] : [];

  const proofDocs = documents.filter((d) => PROOF_TYPES.includes(d.type));
  const hasReceipt = (systemId) => documents.some((d) => d.systemId === systemId && (d.type === "Receipt" || d.type === "Invoice"));

  // --- totals ---
  const systemsReplacement = sum(active, (s) => s.replacementCost);
  const systemsCost = sum(active, (s) => s.purchasePrice);
  const furnitureValue = sum(furniture, (f) => f.value);
  const itemCount = active.length + furniture.length;

  const cards = [
    ["Items documented", String(itemCount), `${plural(active.length, "system")} · ${plural(furniture.length, "belonging")}`],
    ["Est. replacement value", fmtMoney(systemsReplacement + furnitureValue), "systems + belongings"],
    ["Original cost recorded", fmtMoney(systemsCost), "systems & appliances"],
    ["Proof on file", String(proofDocs.length), "receipts, invoices, warranties"],
  ]
    .map(([l, v, s]) => `<div class="card"><div class="label">${e(l)}</div><div class="value">${e(v)}</div><div class="sub">${e(s)}</div></div>`)
    .join("");

  // --- systems & appliances ---
  const warrantyText = (s) => {
    const mine = warranties.filter((w) => w.systemId === s.id && w.expirationDate).map((w) => w.expirationDate).sort();
    const date = mine.length ? mine[mine.length - 1] : s.warrantyExpiration;
    return date ? `to ${fmtMonthYear(date)}` : "—";
  };
  const systemsSection = active.length
    ? `<h2>Systems &amp; appliances</h2>` +
      groupSystems(active)
        .map(({ group, items }) => {
          const rows = items
            .slice()
            .sort((a, b) => (a.location || "").localeCompare(b.location || ""))
            .map((s) => {
              const d = describeSystem(s, h.categoryLabel);
              return `<tr>
                ${photoCell(s.photoUrl)}
                <td><b>${e(d.item)}</b>${s.location ? `<div class="muted small">${e(s.location)}</div>` : ""}</td>
                <td>${e(d.makeModel || "—")}</td>
                <td>${e(s.serialNumber || "—")}</td>
                <td class="nowrap">${fmtMonthYear(s.purchaseDate)}</td>
                <td class="num">${fmtMoney(s.purchasePrice)}</td>
                <td class="num">${fmtMoney(s.replacementCost)}</td>
                <td>${hasReceipt(s.id) ? '<span class="pill ok">Yes</span>' : '<span class="pill none">No</span>'}</td>
                <td class="nowrap">${warrantyText(s)}</td>
              </tr>`;
            });
          const cols = photoHead.concat(["Item / location", "Make / model", "Serial #", "Purchased", "Cost paid", "Replacement cost", "Receipt", "Warranty"]);
          const moneyCols = [photoHead.length + 4, photoHead.length + 5];
          rows.push(
            `<tr class="subtotal"><td colspan="${photoHead.length + 4}">${e(group)} subtotal</td><td class="num">${fmtMoney(sum(items, (s) => s.purchasePrice))}</td><td class="num">${fmtMoney(sum(items, (s) => s.replacementCost))}</td><td colspan="2"></td></tr>`
          );
          return `<h3>${e(group)}</h3>${table(cols, rows, moneyCols)}`;
        })
        .join("")
    : `<h2>Systems &amp; appliances</h2><p class="muted">No systems or appliances have been recorded yet.</p>`;

  // --- furniture & belongings, one table per room ---
  const rooms = [...new Set(furniture.map((f) => f.room || "Other"))].sort();
  const furnitureSection = furniture.length
    ? `<h2>Furniture &amp; belongings</h2>` +
      rooms
        .map((room) => {
          const items = furniture.filter((f) => (f.room || "Other") === room).sort((a, b) => (a.name || "").localeCompare(b.name || ""));
          const rows = items.map(
            (f) => `<tr>${photoCell(f.photoUrl)}<td><b>${e(f.name)}</b>${f.note ? `<div class="muted small">${e(f.note)}</div>` : ""}</td><td class="num">${fmtMoney(f.value)}</td></tr>`
          );
          rows.push(`<tr class="subtotal"><td colspan="${photoHead.length + 1}">${e(room)} subtotal</td><td class="num">${fmtMoney(sum(items, (f) => f.value))}</td></tr>`);
          return `<h3>${e(room)}</h3>${table(photoHead.concat(["Item", "Estimated value"]), rows, [photoHead.length + 1])}`;
        })
        .join("") +
      `<table><tbody><tr class="total"><td>Total furniture &amp; belongings</td><td class="num">${fmtMoney(furnitureValue)}</td></tr></tbody></table>`
    : "";

  const grandTotal = `<div class="box"><b>Total estimated replacement value: ${fmtMoney(systemsReplacement + furnitureValue)}</b>
      <div class="muted small">Systems &amp; appliances ${fmtMoney(systemsReplacement)} + furniture &amp; belongings ${fmtMoney(furnitureValue)}. Values are the owner’s estimates.</div></div>`;

  // --- receipts & documentation ---
  const linkedTo = (d) => {
    const s = systemsById.get(d.systemId);
    return s ? describeSystem(s, h.categoryLabel).item : "General";
  };
  const proofList = proofDocs.length
    ? `<h2>Receipts &amp; documentation</h2>` +
      table(
        ["Document", "Type", "Linked to"],
        proofDocs.map((d) => `<tr><td>${e(d.label)}</td><td>${e(d.type)}</td><td>${e(linkedTo(d))}</td></tr>`)
      )
    : "";
  const receiptImages = proofDocs.filter((d) => hasImage(d.photoUrl));
  const receiptGrid = receiptImages.length
    ? `<h3>Receipt &amp; warranty images</h3><div class="receipt-grid">` +
      receiptImages
        .map((d) => `<div class="receipt"><img src="${images[d.photoUrl]}" alt=""><div class="cap"><b>${e(d.label)}</b><br><span class="muted">${e(d.type)} · ${e(linkedTo(d))}</span></div></div>`)
        .join("") +
      `</div>`
    : "";

  const howTo = `<div class="box"><b>Using this report</b><ul>
      <li>Keep a copy somewhere other than the house — email it to yourself or save it to cloud storage.</li>
      <li>Give your insurer or adjuster this list together with the photos and receipt images it contains.</li>
      <li>Values are your own estimates of replacement cost. Update them after major purchases and run a new report.</li>
    </ul></div>`;

  const attestation = `<h2>Statement of the policyholder</h2>
    <p>I confirm that this inventory is a true and accurate record of the items listed, to the best of my knowledge.</p>
    <div class="sig"><div class="line">Policyholder: ${e(profile.name || "")}</div><div class="line">Signature</div><div class="line">Date</div></div>
    <div class="sig"><div class="line">Insurance company</div><div class="line">Policy number</div><div class="line">Claim number (if any)</div></div>`;

  const header = `<header class="report-head">
      <div class="brand">MyHome OS · Insurance inventory</div>
      <h1>Home Inventory Report</h1>
      <div class="addr">${e(profile.propertyName || "Home")}${profile.address ? ` — ${e(profile.address)}` : ""}</div>
      <div class="meta">Policyholder: ${e(profile.name || "—")}${profile.email ? ` · ${e(profile.email)}` : ""} · Prepared ${e(fmtLongDate(generatedOn))}</div>
    </header>`;

  const footer = `<footer class="report-foot">Prepared with MyHome OS on ${e(fmtLongDate(generatedOn))} from records entered, scanned and uploaded by the homeowner. Values are owner estimates, not appraisals. Insurers’ documentation requirements vary — confirm what your policy needs.</footer>`;

  const body = [
    header,
    `<h2>Summary</h2><div class="cards">${cards}</div>`,
    howTo,
    systemsSection,
    furnitureSection,
    itemCount ? grandTotal : "",
    proofList,
    receiptGrid,
    attestation,
    footer,
  ].join("");

  return htmlDocument("Home Inventory Report", body);
}
