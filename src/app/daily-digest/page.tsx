import { fmtMoney, fmtNumber, shortDate } from "@/lib/format";
import {
  getAssetWatchData,
  getCollectionsData,
  getFinancialData,
  getReceivablesActivityData,
  getVacancyData,
} from "@/lib/operations";

export const dynamic = "force-dynamic";

export default async function DailyDigestPage() {
  const [collections, financials, vacancy, assets, receivables] = await Promise.all([
    getCollectionsData(),
    getFinancialData(),
    getVacancyData(),
    getAssetWatchData(),
    getReceivablesActivityData(),
  ]);

  const digestItems = [
    collections.ok
      ? {
          title: "Collections exposure",
          value: fmtMoney(collections.data.totals.balanceDue),
          body: `${fmtNumber(collections.data.totals.activeCases)} active cases; ${fmtMoney(collections.data.totals.balance30Plus)} is 30+.`,
        }
      : { title: "Collections exposure", value: "Needs setup", body: collections.error },
    financials.ok
      ? {
          title: "Latest NOI",
          value: fmtMoney(financials.data.portfolio.noi),
          body: `Period ${shortDate(financials.data.periodStart)} to ${shortDate(financials.data.periodEnd)}.`,
        }
      : { title: "Latest NOI", value: "Needs setup", body: financials.error },
    receivables.ok
      ? {
          title: "Receivables activity",
          value: fmtMoney(receivables.data.totals.receiptAmount),
          body: `${fmtNumber(receivables.data.totals.transactionCount)} payments month-to-date; latest receipt ${shortDate(receivables.data.latestReceiptDate)}.`,
        }
      : { title: "Receivables activity", value: "Needs setup", body: receivables.error },
    vacancy.ok
      ? {
          title: "Vacancy watchlist",
          value: fmtNumber(vacancy.data.unrentedUnits),
          body: `${fmtNumber(vacancy.data.vacantUnits)} vacant and ${fmtNumber(vacancy.data.noticeUnits)} notice units from vacancy detail snapshot ${shortDate(vacancy.data.snapshotDate)}.`,
        }
      : { title: "Vacancy watchlist", value: "Needs setup", body: vacancy.error },
    assets.ok
      ? {
          title: "Cash watch",
          value: fmtMoney(assets.data.portfolio.cash),
          body: `Balance sheet as of ${shortDate(assets.data.asOfDate)}; ${fmtMoney(assets.data.portfolio.accountsReceivable)} in A/R.`,
        }
      : { title: "Cash watch", value: "Needs setup", body: assets.error },
  ];

  return (
    <div className="mx-auto max-w-6xl px-8 py-10">
      <header className="mb-8">
        <p className="ms-eyebrow">Morning briefing</p>
        <h1 className="mt-1 font-heading text-3xl font-semibold text-navy">
          Daily digest
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-ink-muted">
          A single page for what changed operational attention today. The first
          version summarizes current live feeds; true day-over-day deltas will
          use retained daily snapshots once available.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {digestItems.map((item) => (
          <article key={item.title} className="ms-card">
            <p className="ms-eyebrow">{item.title}</p>
            <h2 className="mt-3 font-heading text-3xl font-semibold text-navy">
              {item.value}
            </h2>
            <p className="mt-3 text-sm text-ink-muted">{item.body}</p>
          </article>
        ))}
      </section>

      <section className="ms-card mt-6">
        <h2 className="ms-card-title">Snapshot plan</h2>
        <p className="mt-2 text-sm text-ink-muted">
          Daily snapshots are the chosen source for true new-since-yesterday,
          paid-down, and resolved cards. This digest stays on current live feed
          summaries until the retained snapshot tables and scheduled jobs are
          added.
        </p>
      </section>
    </div>
  );
}
