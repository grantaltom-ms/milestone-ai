import { fmtMoney, fmtNumber, shortDate } from "@/lib/format";
import { getReceivablesActivityData } from "@/lib/operations";

export const dynamic = "force-dynamic";

export default async function ReceivablesActivityPage() {
  const receivables = await getReceivablesActivityData();

  if (!receivables.ok) {
    return (
      <div className="mx-auto max-w-6xl px-8 py-10">
        <header className="mb-8">
          <p className="ms-eyebrow">Cash receipts</p>
          <h1 className="mt-1 font-heading text-3xl font-semibold text-navy">
            Receivables activity
          </h1>
        </header>
        <section className="ms-card">
          <h2 className="ms-card-title">Could not load receivables activity</h2>
          <p className="mt-3 text-sm text-ink-muted">{receivables.error}</p>
        </section>
      </div>
    );
  }

  const data = receivables.data;
  const cards = [
    {
      label: "Money received",
      value: fmtMoney(data.totals.receiptAmount),
      sub: `${fmtNumber(data.totals.transactionCount)} payment records`,
    },
    {
      label: "Payees",
      value: fmtNumber(data.totals.payeeCount),
      sub: `${fmtNumber(data.totals.propertyCount)} properties with receipts`,
    },
    {
      label: "Latest receipt",
      value: shortDate(data.latestReceiptDate),
      sub: `Current month starts ${shortDate(data.periodStart)}`,
    },
    {
      label: "Paid but still listed",
      value: fmtMoney(data.totals.delinquentPayeeReceiptAmount),
      sub: `${fmtNumber(data.totals.delinquentPayeeTransactionCount)} payments from active delinquency names`,
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-8 py-10">
      <header className="mb-8">
        <p className="ms-eyebrow">Cash receipts</p>
        <h1 className="mt-1 font-heading text-3xl font-semibold text-navy">
          Receivables activity
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-ink-muted">
          Month-to-date AppFolio receipt activity. Use this to confirm cash
          movement and spot tenants who made payments but still appear in the
          delinquency feed.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <article key={card.label} className="ms-card">
            <p className="ms-eyebrow">{card.label}</p>
            <h2 className="mt-3 font-heading text-3xl font-semibold leading-tight text-navy">
              {card.value}
            </h2>
            <p className="mt-3 text-sm text-ink-muted">{card.sub}</p>
          </article>
        ))}
      </section>

      <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="ms-card">
          <h2 className="ms-card-title">Receipts by property</h2>
          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full text-left">
              <thead>
                <tr className="border-b border-line text-xs uppercase tracking-wide text-ink-muted">
                  <th className="py-3 pr-4 font-medium">Property</th>
                  <th className="py-3 pr-4 font-medium">Received</th>
                  <th className="py-3 pr-4 font-medium">Payments</th>
                  <th className="py-3 pr-4 font-medium">Payees</th>
                </tr>
              </thead>
              <tbody>
                {data.properties.slice(0, 20).map((property) => (
                  <tr key={property.propertyName} className="border-b border-line/70 last:border-0">
                    <td className="py-3 pr-4 text-sm font-medium text-navy">{property.propertyName}</td>
                    <td className="py-3 pr-4 text-sm tabular-nums">{fmtMoney(property.receiptAmount)}</td>
                    <td className="py-3 pr-4 text-sm tabular-nums">{fmtNumber(property.transactionCount)}</td>
                    <td className="py-3 pr-4 text-sm tabular-nums">{fmtNumber(property.payeeCount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <section className="ms-card">
            <h2 className="ms-card-title">Payment method mix</h2>
            <div className="mt-5 space-y-4">
              {data.byPaymentMethod.slice(0, 8).map((method) => (
                <div key={method.paymentMethod}>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-medium text-navy">{method.paymentMethod}</span>
                    <span className="text-sm tabular-nums text-ink">{fmtMoney(method.receiptAmount)}</span>
                  </div>
                  <p className="mt-1 text-xs text-ink-muted">
                    {fmtNumber(method.transactionCount)} payments
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="ms-card">
            <h2 className="ms-card-title">Daily receipt trend</h2>
            <div className="mt-5 space-y-3">
              {data.byDate.map((row) => (
                <div key={row.receiptDate} className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-navy">{shortDate(row.receiptDate)}</p>
                    <p className="text-xs text-ink-muted">{fmtNumber(row.transactionCount)} payments</p>
                  </div>
                  <p className="text-sm font-semibold tabular-nums text-navy">
                    {fmtMoney(row.receiptAmount)}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </section>

      <section className="ms-card mt-6">
        <h2 className="ms-card-title">Recent receipts</h2>
        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full text-left">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-wide text-ink-muted">
                <th className="py-3 pr-4 font-medium">Date</th>
                <th className="py-3 pr-4 font-medium">Payee</th>
                <th className="py-3 pr-4 font-medium">Property</th>
                <th className="py-3 pr-4 font-medium">Method</th>
                <th className="py-3 pr-4 font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {data.recentReceipts.map((receipt) => (
                <tr
                  key={`${receipt.receiptDate}-${receipt.payee}-${receipt.receiptAmount}`}
                  className="border-b border-line/70 last:border-0"
                >
                  <td className="py-3 pr-4 text-sm">{shortDate(receipt.receiptDate)}</td>
                  <td className="py-3 pr-4 text-sm font-medium text-navy">{receipt.payee}</td>
                  <td className="py-3 pr-4 text-sm">{receipt.propertyName}</td>
                  <td className="py-3 pr-4 text-sm">{receipt.paymentMethod}</td>
                  <td className="py-3 pr-4 text-sm tabular-nums">{fmtMoney(receipt.receiptAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs text-ink-muted">
          The delinquency cross-check is name-based because this receivables
          table does not currently store AppFolio tenant or occupancy IDs.
        </p>
      </section>
    </div>
  );
}
