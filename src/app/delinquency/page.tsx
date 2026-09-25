import CollectionsQueue from "./CollectionsQueue";

export const dynamic = "force-dynamic";

export default function DelinquencyReview() {
  return (
    <div className="mx-auto max-w-6xl px-8 py-10">
      <header className="mb-8">
        <p className="ms-eyebrow">Collections</p>
        <h1 className="mt-1 font-heading text-3xl font-semibold text-navy">Delinquency review</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-muted">
          Everyone who owes money today, sorted by who matters most, with one suggested next step each.
          The suggestion respects how each tenant normally pays: mail payers get their usual window, a
          check in hand pauses reminders, and a promise to pay is checked against what actually arrives.
          Log what you did so the list stays honest.
        </p>
      </header>
      <CollectionsQueue />
    </div>
  );
}
