import Link from "next/link";
import { fmtMoney, fmtNumber, shortDate } from "@/lib/format";
import { getCollectionsData } from "@/lib/operations";

export const dynamic = "force-dynamic";

export default async function CollectionsPage() {
  const result = await getCollectionsData();

  return (
    <div className="mx-auto max-w-7xl px-8 py-10">
      <header className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="ms-eyebrow">Collections command center</p>
          <h1 className="mt-1 font-heading text-3xl font-semibold text-navy">
            Collections
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-ink-muted">
            A working queue for the AppFolio aged receivables feed: high
            balances, 30+ exposure, property concentration, and tenants that
            should be handled before routine follow-up.
          </p>
        </div>
        <Link
          href="/delinquency-dashboard"
          className="inline-flex w-fit items-center rounded-md border border-line bg-paper-raised px-4 py-2 text-sm font-semibold text-navy transition-colors hover:bg-paper"
        >
          Four-item view
        </Link>
      </header>

      {!result.ok && (
        <section className="ms-card border-red-200 bg-red-50 text-sm text-red-700">
          Could not load collections data: {result.error}
        </section>
      )}

      {result.ok && (
        <div className="space-y-6">
          <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
            {[
              ["Active cases", fmtNumber(result.data.totals.activeCases), "Positive receivable balance"],
              ["Total balance", fmtMoney(result.data.totals.balanceDue), "Open delinquency exposure"],
              ["30+ balance", fmtMoney(result.data.totals.balance30Plus), "Aged receivable exposure"],
              ["Action cases", fmtNumber(result.data.totals.urgentCases), "$1k+, notice, legal, escalated, or 30+"],
            ].map(([label, value, sub]) => (
              <div key={label} className="rounded-lg border border-line bg-paper-raised p-5">
                <p className="ms-eyebrow">{label}</p>
                <p className="mt-2 font-heading text-2xl font-semibold text-navy">{value}</p>
                <p className="mt-1 text-xs text-ink-muted">{sub}</p>
              </div>
            ))}
          </section>

          <section className="ms-card">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="ms-card-title">Morning action list</h2>
                <p className="mt-1 text-sm text-ink-muted">
                  Latest import: {shortDate(result.data.latestImport?.importedAt ?? null)}
                </p>
              </div>
              <span className="text-xs text-ink-muted">
                Top {Math.min(25, result.data.cases.length)} by balance
              </span>
            </div>
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[840px]">
                <thead>
                  <tr className="border-b border-line">
                    {["Tenant", "Property / Unit", "Balance", "30+", "Days", "Status", "Last payment"].map((heading) => (
                      <th key={heading} className="pb-2 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-ink-muted">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.data.cases.slice(0, 25).map((row) => (
                    <tr key={`${row.appfolio_tenant_id}-${row.property_name}-${row.unit_id}`} className="border-b border-line/70 last:border-0">
                      <td className="py-3 pr-4 text-sm font-medium text-navy">{row.tenant_name || "Unknown"}</td>
                      <td className="py-3 pr-4 text-sm text-ink-muted">
                        {row.property_name || "Unassigned"}
                        {row.unit_id ? ` / ${row.unit_id}` : ""}
                      </td>
                      <td className="py-3 pr-4 text-sm font-semibold text-ink">{fmtMoney(Number(row.balance_due ?? 0))}</td>
                      <td className="py-3 pr-4 text-sm text-ink-muted">{fmtMoney(Number(row.balance_30_plus ?? 0))}</td>
                      <td className="py-3 pr-4 text-sm text-ink-muted">{row.days_past_due ? `${row.days_past_due}d` : "-"}</td>
                      <td className="py-3 pr-4 text-sm text-ink-muted">{row.status || "open"}</td>
                      <td className="py-3 pr-4 text-sm text-ink-muted">{shortDate(row.last_payment_date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="ms-card">
            <h2 className="ms-card-title">Property concentration</h2>
            <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
              {result.data.properties.slice(0, 8).map((property) => (
                <div key={property.propertyName} className="rounded-md border border-line bg-paper p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-navy">{property.propertyName}</p>
                      <p className="mt-1 text-xs text-ink-muted">
                        {fmtNumber(property.caseCount)} cases, {fmtNumber(property.urgentCount)} action cases
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-heading text-xl font-semibold text-navy">
                        {fmtMoney(property.balanceDue)}
                      </p>
                      <p className="text-xs text-ink-muted">{fmtMoney(property.balance30Plus)} 30+</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
