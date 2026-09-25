import { fmtMoney, fmtNumber } from "@/lib/format";
import { getManagerScorecards } from "@/lib/operations";

export const dynamic = "force-dynamic";

export default async function ManagerScorecardsPage() {
  const result = await getManagerScorecards();

  return (
    <div className="mx-auto max-w-7xl px-8 py-10">
      <header className="mb-8">
        <p className="ms-eyebrow">Manager operating view</p>
        <h1 className="mt-1 font-heading text-3xl font-semibold text-navy">
          Manager scorecards
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-ink-muted">
          Delinquency, aged balance, action cases, and vacancy-detail counts
          grouped by the Supabase property manager assignments.
        </p>
      </header>

      {!result.ok && (
        <section className="ms-card border-red-200 bg-red-50 text-sm text-red-700">
          Could not load manager scorecards: {result.error}
        </section>
      )}

      {result.ok && (
        <section className="ms-card overflow-x-auto">
          <h2 className="ms-card-title">Scorecards</h2>
          <table className="mt-5 w-full min-w-[820px]">
            <thead>
              <tr className="border-b border-line">
                {["Manager", "Properties", "Cases", "Balance", "30+", "Action", "Vacant", "Notice", "Unrented"].map((heading) => (
                  <th key={heading} className="pb-2 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-ink-muted">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.data.map((row) => (
                <tr key={row.managerName} className="border-b border-line/70 last:border-0">
                  <td className="py-3 pr-4 text-sm font-medium text-navy">{row.managerName}</td>
                  <td className="py-3 pr-4 text-sm text-ink-muted">{fmtNumber(row.propertyCount)}</td>
                  <td className="py-3 pr-4 text-sm text-ink-muted">{fmtNumber(row.delinquencyCases)}</td>
                  <td className="py-3 pr-4 text-sm font-semibold text-ink">{fmtMoney(row.delinquencyBalance)}</td>
                  <td className="py-3 pr-4 text-sm text-ink-muted">{fmtMoney(row.balance30Plus)}</td>
                  <td className="py-3 pr-4 text-sm text-ink-muted">{fmtNumber(row.urgentCases)}</td>
                  <td className="py-3 pr-4 text-sm text-ink-muted">{fmtNumber(row.vacantUnits)}</td>
                  <td className="py-3 pr-4 text-sm text-ink-muted">{fmtNumber(row.noticeUnits)}</td>
                  <td className="py-3 pr-4 text-sm text-ink-muted">{fmtNumber(row.unrentedUnits)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
