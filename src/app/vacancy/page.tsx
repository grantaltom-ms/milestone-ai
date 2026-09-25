import { fmtNumber, shortDate } from "@/lib/format";
import { getVacancyData } from "@/lib/operations";

export const dynamic = "force-dynamic";

export default async function VacancyPage() {
  const result = await getVacancyData();

  return (
    <div className="mx-auto max-w-7xl px-8 py-10">
      <header className="mb-8">
        <p className="ms-eyebrow">Rent roll operating view</p>
        <h1 className="mt-1 font-heading text-3xl font-semibold text-navy">
          Vacancy
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-ink-muted">
          Vacant and notice unit counts from the latest AppFolio Unit Vacancy
          Detail snapshot.
        </p>
      </header>

      {!result.ok && (
        <section className="ms-card border-red-200 bg-red-50 text-sm text-red-700">
          Could not load vacancy data: {result.error}
        </section>
      )}

      {result.ok && (
        <div className="space-y-6">
          <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
            {[
              ["Vacant units", fmtNumber(result.data.vacantUnits), `Snapshot ${shortDate(result.data.snapshotDate)}`],
              ["Notice units", fmtNumber(result.data.noticeUnits), "Upcoming vacancy rows"],
              ["Unrented units", fmtNumber(result.data.unrentedUnits), "Vacant or notice-unrented"],
              ["Snapshot rows", fmtNumber(result.data.totalUnits), "Rows in vacancy detail feed"],
            ].map(([label, value, sub]) => (
              <div key={label} className="rounded-lg border border-line bg-paper-raised p-5">
                <p className="ms-eyebrow">{label}</p>
                <p className="mt-2 font-heading text-2xl font-semibold text-navy">{value}</p>
                <p className="mt-1 text-xs text-ink-muted">{sub}</p>
              </div>
            ))}
          </section>

          <section className="ms-card">
            <h2 className="ms-card-title">Property vacancy watchlist</h2>
            <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
              {result.data.properties.filter((row) => row.vacantUnits > 0).slice(0, 12).map((property) => (
                <div key={property.propertyName} className="rounded-md border border-line bg-paper p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-navy">{property.propertyName}</p>
                      <p className="mt-1 text-xs text-ink-muted">
                        {[
                          `${fmtNumber(property.vacantUnits)} vacant`,
                          `${fmtNumber(property.noticeUnits)} notice`,
                          property.maxDaysVacant !== null
                            ? `${fmtNumber(property.maxDaysVacant)} max days vacant`
                            : null,
                        ].filter(Boolean).join(", ")}
                      </p>
                    </div>
                    <p className="font-heading text-xl font-semibold text-navy">
                      {fmtNumber(property.unrentedUnits)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="ms-card">
            <h2 className="ms-card-title">Vacancy detail statuses</h2>
            <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
              {result.data.statusCounts.map((row) => (
                <div key={row.status} className="flex items-center justify-between rounded-md border border-line bg-paper p-3 text-sm">
                  <span className="font-medium text-navy">{row.status}</span>
                  <span className="text-ink-muted">{fmtNumber(row.count)} units</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
