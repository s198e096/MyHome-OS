import { useState } from "react";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useAppData } from "../../../lib/app-data-context.js";
import { useSession } from "../../../lib/auth-context.js";
import { REPORT_CATALOG } from "../../../lib/reports/catalog.js";
import { createReportPdf, shareReportPdf } from "../../../lib/reports/generate.js";
import AnimatedTabScreen from "../../../components/AnimatedTabScreen.js";
import AccountScreen from "../../../screens/AccountScreen.js";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default function Account() {
  const router = useRouter();
  const {
    profile, systems, tasks, expenses, documents, warranties, furniture,
    activeReportPurchase, buyReport, refreshReportPurchases,
  } = useAppData();
  const { signOut } = useSession();

  // Per-report screen state: { busy, status, error, paymentPending }
  const [ui, setUi] = useState({});
  const patch = (type, next) => setUi((u) => ({ ...u, [type]: { ...u[type], ...next } }));

  const reports = REPORT_CATALOG.map((r) => ({ ...r, purchase: activeReportPurchase(r.type), ...ui[r.type] }));

  // The webhook records a purchase a moment after Stripe confirms payment, so
  // look for it a few times before telling the user it hasn't arrived.
  async function waitForPurchase(type) {
    for (let attempt = 0; attempt < 8; attempt++) {
      const list = await refreshReportPurchases();
      if (list.some((p) => p.reportType === type && new Date(p.expiresAt).getTime() > Date.now())) return true;
      await sleep(1500);
    }
    return false;
  }

  async function handleBuy(type) {
    patch(type, { busy: true, status: "Opening checkout…", error: "", paymentPending: false });
    try {
      const url = await buyReport(type);
      // Resolves when the user closes the checkout page, paid or not.
      await WebBrowser.openBrowserAsync(url);
      patch(type, { status: "Confirming your payment…" });
      const paid = await waitForPurchase(type);
      patch(
        type,
        paid
          ? { error: "", paymentPending: false }
          : { error: "We haven't received your payment yet. If you completed it, it can take a minute to arrive.", paymentPending: true }
      );
    } catch {
      patch(type, { error: "Couldn't start checkout. Try again." });
    } finally {
      patch(type, { busy: false, status: "" });
    }
  }

  async function handleRecheck(type) {
    patch(type, { busy: true, status: "Checking…", error: "" });
    try {
      const paid = await waitForPurchase(type);
      patch(type, paid ? { paymentPending: false } : { error: "Still nothing yet. Give it a minute and try again.", paymentPending: true });
    } catch {
      patch(type, { error: "Couldn't check. Try again." });
    } finally {
      patch(type, { busy: false, status: "" });
    }
  }

  async function handleGenerate(type) {
    patch(type, { busy: true, status: "Preparing…", error: "" });
    try {
      const uri = await createReportPdf(
        type,
        { profile, systems, tasks, expenses, documents, warranties, furniture },
        (status) => patch(type, { status })
      );
      await shareReportPdf(uri, type);
    } catch (err) {
      patch(type, { error: err?.message?.startsWith("Reports are created") ? err.message : "Couldn't create the report. Try again." });
    } finally {
      patch(type, { busy: false, status: "" });
    }
  }

  return (
    <AnimatedTabScreen tabKey="account">
      <AccountScreen
        profile={profile}
        reports={reports}
        onBuyReport={handleBuy}
        onGenerateReport={handleGenerate}
        onRecheckReport={handleRecheck}
        onEdit={() => router.push("/account/edit")}
        onManagePlan={() => router.push("/account/plan")}
        onSignOut={signOut}
      />
    </AnimatedTabScreen>
  );
}
