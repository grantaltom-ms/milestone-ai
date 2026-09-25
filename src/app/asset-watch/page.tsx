import { fmtMoney, shortDate } from "@/lib/format";
import { getAssetWatchData } from "@/lib/operations";

export const dynamic = "force-dynamic";

export default async function AssetWatchPage() {
  const result = await getAssetWatchData();

  return (
    <div className="mx-auto max-w-7xl px-8 py-10">
      <header className="mb-8">
        <p className="ms-eyebrow">Balance sheet and loans</p>
        <h1 className="mt-1 font-heading text-3xl font-semibold text-navy">
          Asset watch
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-ink-muted">
          Cash, receivables, liabilities, equity, and mortgage exposure from the
          AppFolio balance sheet feed on a monthly refresh cadence.
        </p>
      </header>

      {!result.ok && (
        <section className="ms-card border-red-200 bg-red-50 text-sm text-red-700">
          Could not load asset watch data: {result.error}
        </section>
      )}

      {result.ok && (
        <div className="space-y-6">
          <section className="ms-card">
            <h2 className="ms-card-title">Portfolio position</h2>
            <p className="mt-1 text-sm text-ink-muted">As of {shortDate(result.data.asOfDate)}</p>
            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
              {[
                ["Cash", fmtMoney(result.data.portfolio.cash)],
                ["Accounts receivable", fmtMoney(result.data.portfolio.accountsReceivable)],
                ["Mortgage balance", fmtMoney(result.data.portfolio.mortgage)],
                ["Assets", fmtMoney(result.data.portfolio.assets)],
                ["Liabilities", fmtMoney(result.data.portfolio.liabilities)],
                ["Equity", fmtMoney(result.data.portfolio.equity)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-md border border-line bg-paper p-4">
                  <p className="ms-eyebrow">{label}</p>
                  <p className="mt-2 font-heading text-2xl font-semibold text-navy">{value}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="ms-card overflow-x-auto">
            <h2 className="ms-card-title">Lowest cash properties</h2>
            <table className="mt-5 w-full min-w-[780px]">
              <thead>
                <tr className="border-b border-line">
                  {["Property", "Cash", "A/R", "Mortgage", "Assets", "Liabilities", "Equity"].map((heading) => (
                    <th key={heading} className="pb-2 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-ink-muted">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.data.properties.slice(0, 25).map((property) => (
                  <tr key={property.propertyId} className="border-b border-line/70 last:border-0">
                    <td className="py-3 pr-4 text-sm font-medium text-navy">{property.propertyName}</td>
                    <td className="py-3 pr-4 text-sm font-semibold text-ink">{fmtMoney(property.cash)}</td>
                    <td className="py-3 pr-4 text-sm text-ink-muted">{fmtMoney(property.accountsReceivable)}</td>
                    <td className="py-3 pr-4 text-sm text-ink-muted">{fmtMoney(property.mortgage)}</td>
                    <td className="py-3 pr-4 text-sm text-ink-muted">{fmtMoney(property.assets)}</td>
                    <td className="py-3 pr-4 text-sm text-ink-muted">{fmtMoney(property.liabilities)}</td>
                    <td className="py-3 pr-4 text-sm text-ink-muted">{fmtMoney(property.equity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      )}
    </div>
  );
}
