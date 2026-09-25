import { getMonthlyMoneyMovement } from "@/lib/dashboard";
import { getReceivablesActivityData, getVacancyData } from "@/lib/operations";
import { fmtNumber } from "@/lib/format";

function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function pct(n: number) {
  return `${n.toFixed(1)}%`;
}

function shortDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function Home() {
  const [mm, vacancy] = await Promise.all([
    getMonthlyMoneyMovement().catch(() => null),
    getVacancyData(),
  ]);
  const receivables = await getReceivablesActivityData();

  const moneyStats = mm
    ? [
        { label: "Charges assessed", value: fmt(mm.chargesAssessed), sub: `Rent roll as of ${shortDate(mm.rentRollSnapshotDate)}` },
        { label: "Money received", value: fmt(mm.moneyReceived), sub: `Latest receipt ${shortDate(mm.latestReceiptDate)}` },
        { label: "Collection rate", value: pct(mm.collectionRate), sub: `Variance ${fmt(mm.variance)}` },
      ]
    : [
        { label: "Charges assessed", value: "—", sub: "" },
        { label: "Money received", value: "—", sub: "" },
        { label: "Collection rate", value: "—", sub: "" },
      ];

  return (
    <div className="mx-auto max-w-6xl px-8 py-10">
      <header className="mb-8">
        <p className="ms-eyebrow">Milestone Properties</p>
        <h1 className="mt-1 font-heading text-3xl font-semibold text-navy">
          Home
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-muted">
          The morning operating view. Money movement, the bulletin board, and
          current vacancy at a glance.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Money movement */}
        <section className="ms-card lg:col-span-2">
          <h2 className="ms-card-title">Money movement</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Month-to-date charges assessed vs. money received.
          </p>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {moneyStats.map((stat) => (
              <div key={stat.label} className="rounded-md border border-line bg-paper p-4">
                <p className="ms-eyebrow">{stat.label}</p>
                <p className="mt-2 font-heading text-2xl font-semibold text-navy">
                  {stat.value}
                </p>
                {stat.sub && (
                  <p className="mt-1 text-xs text-ink-muted">{stat.sub}</p>
                )}
              </div>
            ))}
          </div>
          {!mm && (
            <p className="mt-4 text-xs text-ink-muted">
              Could not load data — check Supabase environment variables.
            </p>
          )}
          {receivables.ok && (
            <a
              href="/receivables"
              className="mt-4 inline-flex text-sm font-semibold text-navy hover:underline"
            >
              View receivables activity details
            </a>
          )}
        </section>

        {/* Bulletin board */}
        <section className="ms-card">
          <h2 className="ms-card-title">Bulletin board</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Significant events, due items, birthdays, and timely notes.
          </p>
          <p className="mt-5 text-sm text-ink-muted">
            Placeholder — Supabase-backed entries coming soon.
          </p>
        </section>

        <section className="ms-card">
          <h2 className="ms-card-title">Vacancy</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Vacant and notice units from the latest vacancy detail feed.
          </p>
          <div className="mt-5 grid grid-cols-3 gap-4">
            {(vacancy.ok
              ? [
                  { label: "Vacant", value: fmtNumber(vacancy.data.vacantUnits) },
                  { label: "Notice", value: fmtNumber(vacancy.data.noticeUnits) },
                  { label: "Unrented", value: fmtNumber(vacancy.data.unrentedUnits) },
                ]
              : [
                  { label: "Vacant", value: "—" },
                  { label: "Notice", value: "—" },
                  { label: "Unrented", value: "—" },
                ]
            ).map((stat) => (
              <div key={stat.label} className="rounded-md border border-line bg-paper p-4">
                <p className="ms-eyebrow">{stat.label}</p>
                <p className="mt-2 font-heading text-2xl font-semibold text-navy">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-ink-muted">
            {vacancy.ok
              ? `Vacancy detail snapshot ${shortDate(vacancy.data.snapshotDate)}.`
              : "Could not load vacancy data from the vacancy detail feed."}
          </p>
        </section>
      </div>
    </div>
  );
}
