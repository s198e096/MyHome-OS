// The paid reports offered on the Account page. The price shown here is for
// display only — what a customer is actually charged is the Stripe price
// configured on the server (STRIPE_PRICE_HOME_SALE / STRIPE_PRICE_INSURANCE_INVENTORY),
// so keep the two in step.

// How long a purchase keeps working: pay once, then generate and re-download
// the report as often as needed during this window. The server stamps the real
// expiry (supabase/functions/stripe-webhook); this only words the screen.
export const REPORT_ACCESS_DAYS = 30;

export const REPORT_CATALOG = [
  {
    type: "home_sale",
    title: "Home Sale",
    tagline: "Property history report for buyers and realtors",
    price: 14.99,
    // Letter, portrait
    page: { width: 612, height: 792 },
    highlights: [
      "Every system and appliance with age, expected life and warranty status",
      "Maintenance history and repair and replacement spending",
      "Replaced equipment and the records on file",
    ],
  },
  {
    type: "insurance_inventory",
    title: "Insurance inventory report",
    tagline: "Documented list of your home and belongings, formatted for a claim",
    price: 29.99,
    // Letter, landscape — the inventory tables are wide
    page: { width: 792, height: 612 },
    highlights: [
      "Systems, appliances and furniture with serial numbers, values and photos",
      "Receipts and warranties gathered in one place",
      "Totals by room plus a signed policyholder statement",
    ],
  },
];

export const reportInfo = (type) => REPORT_CATALOG.find((r) => r.type === type);

export const priceLabel = (report) => `$${report.price.toFixed(2)}`;
