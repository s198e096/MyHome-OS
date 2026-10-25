// Print stylesheet for the PDF reports. Plain CSS in a string, rendered by the
// phone's print engine (WebKit on iOS), so it sticks to widely supported rules.
//
// The sizes below are written the way a desktop browser prints them (1px =
// 0.75pt). The phone's engine instead lays the page out at 1px = 1pt, which
// would print everything a third larger, so every px value is scaled down once
// at load to keep the page looking like the design.
const PX_TO_PT = 0.75;
const scalePx = (css) => css.replace(/(\d*\.?\d+)px/g, (_, n) => `${+(parseFloat(n) * PX_TO_PT).toFixed(2)}px`);

const DESIGN_CSS = `
  /* Print the colour fills (header band, cards, pills, table heads); WebKit drops them by default. */
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 0;
    font-family: -apple-system, "Helvetica Neue", Helvetica, Arial, sans-serif;
    font-size: 10.5px;
    line-height: 1.45;
    color: #1c1917;
  }
  .page-pad { padding: 4px 2px; }
  header.report-head {
    background: #16240F;
    color: #fff;
    border-radius: 10px;
    padding: 18px 20px;
    margin-bottom: 14px;
  }
  header.report-head .brand { font-size: 9px; letter-spacing: 1.4px; text-transform: uppercase; color: #BEE1A5; }
  header.report-head h1 { margin: 4px 0 2px; font-size: 22px; font-weight: 700; }
  header.report-head .addr { font-size: 11.5px; color: #D9E8C4; }
  header.report-head .meta { margin-top: 8px; font-size: 9.5px; color: #9FB08A; }
  h2 {
    font-size: 13px;
    margin: 18px 0 6px;
    padding-bottom: 3px;
    border-bottom: 2px solid #BEE1A5;
    color: #16240F;
    page-break-after: avoid;
  }
  h3 { font-size: 11px; margin: 12px 0 4px; color: #44403c; page-break-after: avoid; }
  p { margin: 4px 0; }
  .muted { color: #78716c; }
  .small { font-size: 9px; }
  .cards { display: flex; flex-wrap: wrap; gap: 8px; margin: 6px 0 4px; }
  .card {
    flex: 1 1 22%;
    min-width: 110px;
    border: 1px solid #E0E8D3;
    background: #F5F8F0;
    border-radius: 8px;
    padding: 8px 10px;
    page-break-inside: avoid;
  }
  .card .label { font-size: 8.5px; letter-spacing: 0.6px; text-transform: uppercase; color: #78716c; }
  .card .value { font-size: 15px; font-weight: 700; color: #16240F; margin-top: 2px; }
  .card .sub { font-size: 8.5px; color: #78716c; }
  table { width: 100%; border-collapse: collapse; margin: 4px 0 8px; }
  thead { display: table-header-group; }
  th {
    text-align: left;
    font-size: 8.5px;
    letter-spacing: 0.4px;
    text-transform: uppercase;
    color: #57534e;
    background: #EEF3E6;
    padding: 5px 6px;
    border-bottom: 1px solid #D4DEC5;
  }
  td { padding: 5px 6px; border-bottom: 1px solid #ECEFE5; vertical-align: top; }
  tr { page-break-inside: avoid; }
  tbody tr:nth-child(even) td { background: #FAFBF7; }
  td.num, th.num { text-align: right; white-space: nowrap; }
  td.nowrap { white-space: nowrap; }
  tr.total td { font-weight: 700; border-top: 2px solid #BEE1A5; background: #F5F8F0; }
  tr.subtotal td { font-weight: 600; background: #F5F8F0; }
  .kv { display: flex; flex-wrap: wrap; border: 1px solid #E0E8D3; border-radius: 8px; overflow: hidden; }
  .kv .item { width: 50%; padding: 6px 10px; border-bottom: 1px solid #ECEFE5; }
  .kv .item .k { font-size: 8.5px; text-transform: uppercase; letter-spacing: 0.5px; color: #78716c; }
  .kv .item .v { font-size: 11px; font-weight: 600; }
  .pill { display: inline-block; padding: 1px 7px; border-radius: 999px; font-size: 8.5px; font-weight: 600; }
  .pill.ok { background: #EAF3DE; color: #3B6D11; }
  .pill.warn { background: #FAEEDA; color: #8A5A0F; }
  .pill.bad { background: #FBE9E7; color: #A32D2D; }
  .pill.none { background: #F0EFEA; color: #78716c; }
  .box {
    border: 1px solid #E0E8D3;
    background: #F9FBF5;
    border-radius: 8px;
    padding: 10px 12px;
    margin: 8px 0;
    page-break-inside: avoid;
  }
  .box ul { margin: 4px 0 0 16px; padding: 0; }
  .appendix { page-break-before: always; }
  .photo-grid { margin: 4px 0 8px; }
  .photo {
    display: inline-block;
    vertical-align: top;
    width: 32%;
    margin: 0 0.5% 10px;
    border: 1px solid #E0E8D3;
    border-radius: 8px;
    padding: 6px;
    page-break-inside: avoid;
  }
  .photo.wide { width: 48.5%; }
  .photo img { width: 100%; max-height: 190px; object-fit: contain; display: block; background: #FAFBF7; border-radius: 4px; }
  .photo.wide img { max-height: 400px; }
  .photo .cap { font-size: 9px; margin-top: 4px; }
  .sig { display: flex; gap: 30px; margin-top: 26px; page-break-inside: avoid; }
  .sig .line { flex: 1; border-top: 1px solid #44403c; padding-top: 3px; font-size: 9px; color: #57534e; }
  footer.report-foot {
    margin-top: 18px;
    padding-top: 8px;
    border-top: 1px solid #E0E8D3;
    font-size: 8.5px;
    color: #78716c;
  }
`;

export const REPORT_CSS = scalePx(DESIGN_CSS);

export function htmlDocument(title, body) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title><style>${REPORT_CSS}</style></head><body><div class="page-pad">${body}</div></body></html>`;
}
