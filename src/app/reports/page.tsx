export default function Reports() {
  return (
    <div className="mx-auto max-w-6xl px-8 py-10">
      <header className="mb-8">
        <p className="ms-eyebrow">Operations reporting</p>
        <h1 className="mt-1 font-heading text-3xl font-semibold text-navy">
          Reports
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-muted">
          Reporting grows after the core action workflows are stable. Early ideas
          include charges vs. received, delinquency candidates by month, and POV
          drafts by month.
        </p>
      </header>

      <section className="ms-card">
        <h2 className="ms-card-title">Reports</h2>
        <p className="mt-5 text-sm text-ink-muted">
          Placeholder — report views will be added after the action workflows
          land.
        </p>
      </section>
    </div>
  );
}
