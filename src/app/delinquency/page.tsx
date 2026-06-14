export default function DelinquencyReview() {
  return (
    <div className="mx-auto max-w-6xl px-8 py-10">
      <header className="mb-8">
        <p className="ms-eyebrow">Human review queue</p>
        <h1 className="mt-1 font-heading text-3xl font-semibold text-navy">
          Delinquency review
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-muted">
          Candidates surfaced from AppFolio delinquency reports. Managers decide
          what happens before any email, SMS, or POV draft is created.
        </p>
      </header>

      <section className="ms-card">
        <h2 className="ms-card-title">Review queue</h2>
        <p className="mt-5 text-sm text-ink-muted">
          Placeholder — the Supabase-backed candidate queue and action endpoints
          come next.
        </p>
      </section>
    </div>
  );
}
