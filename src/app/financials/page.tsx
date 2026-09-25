import { fmtMoney, fmtPct, shortDate } from "@/lib/format";
import { getFinancialData } from "@/lib/operations";

export const dynamic = "force-dynamic";

export default async function FinancialsPage() {
  const result = await getFinancialData();

  return (
    <div className="mx-auto max-w-7xl px-8 py-10">
      <header className="mb-8">
        <p className="ms-eyebrow">AppFolio income statement</p>
        <h1 className="mt-1 font-heading text-3xl font-semibold text-navy">
          Financial performance
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-ink-muted">
          Portfolio and property-level operating performance from the scheduled
          AppFolio income statement feed.
        </p>
      </header>

      {!result.ok && (
        <section className="ms-card border-red-200 bg-red-50 text-sm text-red-700">
          Could not load financial data: {result.error}
        </section>
      )}

      {result.ok && (
        <div className="space-y-6">
          <section className="ms-card">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="ms-card-title">Portfolio NOI</h2>
                <p className="mt-1 text-sm text-ink-muted">
                  Period: {shortDate(result.data.periodStart)} to {shortDate(result.data.periodEnd)}
                </p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-4">
              {[
                ["Operating income", fmtMoney(result.data.portfolio.operatingIncome)],
                ["Operating expense", fmtMoney(result.data.portfolio.operatingExpense)],
                ["NOI", fmtMoney(result.data.portfolio.noi)],
                ["Net income", fmtMoney(result.data.portfolio.netIncome)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-md border border-line bg-paper p-4">
                  <p className="ms-eyebrow">{label}</p>
                  <p className="mt-2 font-heading text-2xl font-semibold text-navy">{value}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="ms-card overflow-x-auto">
            <h2 className="ms-card-title">Property performance</h2>
            <table className="mt-5 w-full min-w-[760px]">
              <thead>
                <tr className="border-b border-line">
                  {["Property", "Income", "Expense", "NOI", "Margin", "Net income"].map((heading) => (
                    <th key={heading} className="pb-2 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-ink-muted">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.data.properties.slice(0, 30).map((property) => (
                  <tr key={property.propertyId} className="border-b border-line/70 last:border-0">
                    <td className="py-3 pr-4 text-sm font-medium text-navy">{property.propertyName}</td>
                    <td className="py-3 pr-4 text-sm text-ink">{fmtMoney(property.operatingIncome)}</td>
                    <td className="py-3 pr-4 text-sm text-ink-muted">{fmtMoney(property.operatingExpense)}</td>
                    <td className="py-3 pr-4 text-sm font-semibold text-ink">{fmtMoney(property.noi)}</td>
                    <td className="py-3 pr-4 text-sm text-ink-muted">{fmtPct(property.marginPct)}</td>
                    <td className="py-3 pr-4 text-sm text-ink-muted">{fmtMoney(property.netIncome)}</td>
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
