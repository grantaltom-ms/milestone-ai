export default function Reports() {
  const reports = [
    {
      title: "Daily digest",
      href: "/daily-digest",
      body: "Current-state briefing across collections, vacancy, financials, and assets.",
    },
    {
      title: "Financial performance",
      href: "/financials",
      body: "Portfolio NOI and property-level income statement summary.",
    },
    {
      title: "Receivables activity",
      href: "/receivables",
      body: "Month-to-date cash receipt activity, method mix, recent payments, and delinquency cross-check.",
    },
    {
      title: "Asset watch",
      href: "/asset-watch",
      body: "Cash, A/R, liabilities, equity, and mortgage exposure.",
    },
    {
      title: "Manager scorecards",
      href: "/manager-scorecards",
      body: "Collections and vacancy grouped by manager assignment.",
    },
  ];

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

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {reports.map((report) => (
          <a key={report.href} href={report.href} className="ms-card block transition-colors hover:bg-paper">
            <h2 className="ms-card-title">{report.title}</h2>
            <p className="mt-3 text-sm text-ink-muted">{report.body}</p>
          </a>
        ))}
      </section>

      <section className="ms-card mt-6">
        <h2 className="ms-card-title">Reports</h2>
        <p className="mt-5 text-sm text-ink-muted">
          Heavy-lift reports such as GL anomaly detection and generated owner
          packets are intentionally deferred until the core AppFolio dashboards
          are stable.
        </p>
      </section>
    </div>
  );
}
