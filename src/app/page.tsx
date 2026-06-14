export default function Home() {
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
        <section className="ms-card lg:col-span-2">
          <h2 className="ms-card-title">Money movement</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Month-to-date charges assessed vs. money received.
          </p>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { label: "Charges assessed", value: "—" },
              { label: "Money received", value: "—" },
              { label: "Collection rate", value: "—" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-md border border-line bg-paper p-4">
                <p className="ms-eyebrow">{stat.label}</p>
                <p className="mt-2 font-heading text-2xl font-semibold text-navy">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-ink-muted">
            Placeholder — to be wired to Supabase next.
          </p>
        </section>

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
            Total vacant, ready-to-rent, and in-progress units.
          </p>
          <div className="mt-5 grid grid-cols-3 gap-4">
            {[
              { label: "Vacant", value: "—" },
              { label: "Ready", value: "—" },
              { label: "In progress", value: "—" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-md border border-line bg-paper p-4">
                <p className="ms-eyebrow">{stat.label}</p>
                <p className="mt-2 font-heading text-2xl font-semibold text-navy">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-ink-muted">
            Placeholder — to be sourced from AppFolio.
          </p>
        </section>
      </div>
    </div>
  );
}
