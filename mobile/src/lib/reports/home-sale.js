// "Home Sale" report: a property history PDF for buyers and realtors — the
// home's details, every system and appliance with age and warranty status,
// maintenance and repair history, and the records kept on file.
//
// A pure function from the user's data to an HTML string (rendered to PDF by
// the phone's print engine). `h` supplies the app's naming rules:
//   h.categoryLabel(sys) -> "HVAC - Indoor Unit", h.isBill(category) -> boolean
// so this file needs no app or React Native imports.

import { buildFeatureSummary } from "../propertyFeatures.js";
import { escapeHtml as e, fmtMoney, fmtDate, fmtMonthYear, fmtYear, fmtLongDate, fmtAddress, fmtPropertyName, yearsSince, daysSince, sum, plural } from "./format.js";
import { groupSystems, describeSystem, systemGroup } from "./groups.js";
import { htmlDocument } from "./styles.js";

const MAX_TASK_ROWS = 40;
const MAX_EXPENSE_ROWS = 120;
const MAX_DOC_ROWS = 60;
const MAX_UPCOMING_ROWS = 20;

function warrantyCell(sys, warranties, today) {
  const rows = warranties.filter((w) => w.systemId === sys.id && w.expirationDate);
  const list = rows.length
    ? rows.map((w) => ({ type: w.type, date: w.expirationDate }))
    : sys.warrantyExpiration
      ? [{ type: "Warranty", date: sys.warrantyExpiration }]
      : [];
  if (list.length === 0) return `<span class="pill none">None on file</span>`;
  return list
    .map((w) => {
      const expired = daysSince(w.date, today) > 0;
      return `${e(w.type)}: <span class="pill ${expired ? "bad" : "ok"}">${expired ? "Expired" : "Active"}</span> ${expired ? "" : "to "}${fmtMonthYear(w.date)}`;
    })
    .join("<br>");
}

function lifeCells(sys, today) {
  const age = yearsSince(sys.purchaseDate, today);
  const ageText = age == null ? "—" : `${age.toFixed(1)} yrs`;
  if (age == null || !sys.expectedLifeYears) return { ageText, status: "—" };
  const left = sys.expectedLifeYears - age;
  if (left <= 0) return { ageText, status: `<span class="pill bad">Past expected life</span>` };
  const n = Math.max(1, Math.round(left));
  return { ageText, status: `<span class="pill ${left <= 2 ? "warn" : "ok"}">~${n} yr${n === 1 ? "" : "s"} left</span>` };
}

function itemLabel(sys, h) {
  if (!sys) return "General";
  return describeSystem(sys, h.categoryLabel).item;
}

function table(headers, rows, numCols = []) {
  const head = headers.map((t, i) => `<th${numCols.includes(i) ? ' class="num"' : ""}>${e(t)}</th>`).join("");
  return `<table><thead><tr>${head}</tr></thead><tbody>${rows.join("")}</tbody></table>`;
}

function propertySection(profile) {
  const garage = profile.hasGarage ? [profile.garageType, profile.garageSpaces ? `${profile.garageSpaces}-car` : null].filter(Boolean).join(", ") || "Yes" : null;
  const items = [
    ["Property type", profile.propertyType],
    ["Year built", profile.yearBuilt],
    ["Bedrooms", profile.bedrooms],
    ["Bathrooms", profile.bathrooms],
    ["Living area", profile.squareFootage != null ? `${Number(profile.squareFootage).toLocaleString("en-US")} sq ft` : null],
    ["Lot size", profile.lotSize != null ? `${Number(profile.lotSize).toLocaleString("en-US")} sq ft` : null],
    ["Stories", profile.floorCount],
    ["Roof", profile.roofType],
    ["Heating", profile.heatingType],
    ["Cooling", profile.coolingType],
    ["Foundation", profile.foundationType],
    ["Exterior", profile.exteriorType],
    ["Garage", garage],
    ["Pool", profile.hasPool ? profile.poolType || "Yes" : null],
    ["Fireplace", profile.hasFireplace ? profile.fireplaceType || "Yes" : null],
  ].filter(([, v]) => v != null && v !== "");
  if (profile.propertyValue != null) {
    const src = [profile.propertyValueSource, profile.propertyValueUpdatedAt ? `updated ${fmtDate(String(profile.propertyValueUpdatedAt).slice(0, 10))}` : null].filter(Boolean).join(", ");
    items.push(["Estimated value", `${fmtMoney(profile.propertyValue)}${src ? ` (${src})` : ""}`]);
  }
  if (items.length === 0) return "";
  const cells = items.map(([k, v]) => `<div class="item"><div class="k">${e(k)}</div><div class="v">${e(v)}</div></div>`).join("");
  return `<h2>Property details</h2><div class="kv">${cells}</div>`;
}

export function buildHomeSaleReport(data, h) {
  const { profile, tasks = [], expenses = [], documents = [], warranties = [], generatedOn } = data;
  const today = generatedOn;
  const allSystems = data.systems || [];
  const active = allSystems.filter((s) => !s.archived);
  const retired = allSystems.filter((s) => s.archived);
  const systemsById = new Map(allSystems.map((s) => [s.id, s]));
  const upkeep = expenses.filter((x) => !h.isBill(x.category));

  // --- at a glance ---
  const majorAges = active.filter((s) => systemGroup(s) === "Major systems").map((s) => yearsSince(s.purchaseDate, today)).filter((a) => a != null);
  const avgMajor = majorAges.length ? `${(majorAges.reduce((a, b) => a + b, 0) / majorAges.length).toFixed(1)} yrs` : "—";
  const completed = tasks.filter((t) => t.completed);
  const upkeepTotal = sum(upkeep, (x) => x.amount);
  const glance = [
    ["Systems & appliances", String(active.length), "currently tracked"],
    ["Avg. age, major systems", avgMajor, `${majorAges.length} with an install date`],
    ["Upkeep & repairs logged", fmtMoney(upkeepTotal), plural(upkeep.length, "expense")],
    ["Maintenance completed", String(completed.length), "tasks on record"],
  ]
    .map(([l, v, s]) => `<div class="card"><div class="label">${e(l)}</div><div class="value">${e(v)}</div><div class="sub">${e(s)}</div></div>`)
    .join("");

  // --- systems & appliances ---
  const groupsHtml = groupSystems(active)
    .map(({ group, items }) => {
      const rows = items
        .slice()
        .sort((a, b) => (a.purchaseDate || "9999").localeCompare(b.purchaseDate || "9999"))
        .map((s) => {
          const d = describeSystem(s, h.categoryLabel);
          const life = lifeCells(s, today);
          return `<tr>
            <td><b>${e(d.item)}</b>${s.location ? `<div class="muted small">${e(s.location)}</div>` : ""}</td>
            <td>${e(d.makeModel || "—")}${s.serialNumber ? `<div class="muted small">S/N ${e(s.serialNumber)}</div>` : ""}</td>
            <td class="nowrap">${fmtMonthYear(s.purchaseDate)}</td>
            <td class="nowrap">${life.ageText}</td>
            <td class="nowrap">${s.expectedLifeYears ? `${e(s.expectedLifeYears)} yrs` : "—"}</td>
            <td>${life.status}</td>
            <td>${warrantyCell(s, warranties, today)}</td>
          </tr>`;
        });
      return `<h3>${e(group)}</h3>${table(["Item", "Make / model", "Installed", "Age", "Expected life", "Status", "Warranty"], rows)}`;
    })
    .join("");
  const systemsSection = active.length
    ? `<h2>Systems &amp; appliances</h2>${groupsHtml}`
    : `<h2>Systems &amp; appliances</h2><p class="muted">No systems have been recorded yet.</p>`;

  // --- replaced systems ---
  const retiredSection = retired.length
    ? `<h2>Replaced systems</h2><p class="muted small">Earlier equipment that has since been replaced or upgraded.</p>` +
      table(
        ["Item", "Make / model", "Installed"],
        retired.map((s) => {
          const d = describeSystem(s, h.categoryLabel);
          return `<tr><td>${e(d.item)}${s.location ? `<span class="muted small"> · ${e(s.location)}</span>` : ""}</td><td>${e(d.makeModel || "—")}</td><td class="nowrap">${fmtMonthYear(s.purchaseDate)}</td></tr>`;
        })
      )
    : "";

  // --- maintenance history ---
  const doneSorted = completed.slice().sort((a, b) => (b.completedDate || "").localeCompare(a.completedDate || ""));
  const doneShown = doneSorted.slice(0, MAX_TASK_ROWS);
  const historySection = doneSorted.length
    ? `<h2>Maintenance history</h2>` +
      table(
        ["Completed", "Task", "System"],
        doneShown.map((t) => `<tr><td class="nowrap">${t.completedDate ? fmtDate(t.completedDate) : "—"}</td><td>${e(t.title)}</td><td>${e(itemLabel(systemsById.get(t.systemId), h))}</td></tr>`)
      ) +
      (doneSorted.length > doneShown.length ? `<p class="muted small">…and ${doneSorted.length - doneShown.length} earlier completed tasks.</p>` : "")
    : `<h2>Maintenance history</h2><p class="muted">No completed maintenance has been recorded yet.</p>`;

  // --- repairs, replacements & upgrades ---
  const byYear = new Map();
  for (const x of upkeep.slice().sort((a, b) => (b.date || "").localeCompare(a.date || "")).slice(0, MAX_EXPENSE_ROWS)) {
    const y = fmtYear(x.date);
    if (!byYear.has(y)) byYear.set(y, []);
    byYear.get(y).push(x);
  }
  const expenseRows = [];
  for (const [year, list] of byYear) {
    for (const x of list) {
      expenseRows.push(`<tr>
        <td class="nowrap">${fmtDate(x.date)}</td>
        <td>${e(itemLabel(systemsById.get(x.systemId), h))}</td>
        <td>${e(x.category || "—")}</td>
        <td>${e(x.note || "")}${x.vendor ? `<div class="muted small">${e(x.vendor)}</div>` : ""}</td>
        <td class="num">${fmtMoney(x.amount)}</td>
      </tr>`);
    }
    expenseRows.push(`<tr class="subtotal"><td colspan="4">${e(year)} total</td><td class="num">${fmtMoney(sum(list, (x) => x.amount))}</td></tr>`);
  }
  expenseRows.push(`<tr class="total"><td colspan="4">Total documented</td><td class="num">${fmtMoney(upkeepTotal)}</td></tr>`);
  const spendSection = upkeep.length
    ? `<h2>Repairs, replacements &amp; upgrades</h2>` + table(["Date", "System", "Type", "Details", "Amount"], expenseRows, [4])
    : "";

  // --- records on file ---
  const docs = documents.slice();
  const docCounts = ["Manual", "Receipt", "Warranty", "Invoice"]
    .map((t) => [t, docs.filter((d) => d.type === t).length])
    .filter(([, n]) => n > 0)
    .map(([t, n]) => `${plural(n, t.toLowerCase())}`);
  const docsSection = docs.length
    ? `<h2>Records on file</h2><p class="muted">${e(docCounts.join(" · ") || plural(docs.length, "document"))} are stored with this home’s records.</p>` +
      table(
        ["Document", "Type", "Linked to"],
        docs.slice(0, MAX_DOC_ROWS).map((d) => `<tr><td>${e(d.label)}</td><td>${e(d.type)}</td><td>${e(itemLabel(systemsById.get(d.systemId), h))}</td></tr>`)
      ) +
      (docs.length > MAX_DOC_ROWS ? `<p class="muted small">…and ${docs.length - MAX_DOC_ROWS} more documents.</p>` : "")
    : "";

  // --- upcoming maintenance ---
  // Open tasks due within the next 12 months, plus anything already overdue
  // (daysSince is positive once the due date has passed).
  const upcoming = tasks
    .filter((t) => !t.completed && t.dueDate)
    .map((t) => ({ t, days: daysSince(t.dueDate, today) }))
    .filter(({ days }) => days != null && days >= -365)
    .sort((a, b) => a.t.dueDate.localeCompare(b.t.dueDate))
    .slice(0, MAX_UPCOMING_ROWS);
  const upcomingSection = upcoming.length
    ? `<h2>Upcoming maintenance</h2><p class="muted small">Scheduled upkeep a new owner can expect in the next 12 months.</p>` +
      table(
        ["Due", "Task", "System"],
        upcoming.map(({ t, days }) => `<tr><td class="nowrap">${fmtDate(t.dueDate)}${days > 0 ? ' <span class="pill warn">Overdue</span>' : ""}</td><td>${e(t.title)}</td><td>${e(itemLabel(systemsById.get(t.systemId), h))}</td></tr>`)
      )
    : "";

  const features = buildFeatureSummary(profile);
  const header = `<header class="report-head">
      <div class="brand">MyHome OS · Home Sale</div>
      <h1>Property History Report</h1>
      <div class="addr">${e(fmtPropertyName(profile.propertyName) || "Home")}${profile.address ? ` — ${e(fmtAddress(profile.address))}` : ""}</div>
      <div class="meta">Prepared ${e(fmtLongDate(generatedOn))}${features.length ? ` · ${e(features.join(" · "))}` : ""}</div>
    </header>`;

  const footer = `<footer class="report-foot">Prepared with MyHome OS on ${e(fmtLongDate(generatedOn))} from records entered, scanned and uploaded by the homeowner. It is provided for information only and is not an appraisal, inspection, or warranty. Buyers should verify details independently.</footer>`;

  const body = [
    header,
    propertySection(profile),
    `<h2>At a glance</h2><div class="cards">${glance}</div>`,
    systemsSection,
    retiredSection,
    historySection,
    spendSection,
    docsSection,
    upcomingSection,
    footer,
  ].join("");

  return htmlDocument("Property History Report", body);
}
