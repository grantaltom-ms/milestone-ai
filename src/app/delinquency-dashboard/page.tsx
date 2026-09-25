import Link from "next/link";
import {
  getDelinquencyDashboard,
  type DelinquencyCase,
} from "@/lib/delinquency-dashboard";

export const dynamic = "force-dynamic";

function fmtMoney(value: number) {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function fmtNumber(value: number) {
  return value.toLocaleString("en-US");
}

function fmtPct(value: number | null) {
  if (value === null) return "-";
  return `${value.toFixed(1)}%`;
}

function shortDate(iso: string | null) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function statusLabel(status: string | null) {
  if (!status) return "Open";
  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function tenantLocation(row: DelinquencyCase | undefined) {
  if (!row) return "-";
  const property = row.property_name || "Unassigned";
  return row.unit_id ? `${property} / ${row.unit_id}` : property;
}

export default async function DelinquencyDashboardPage() {
  let dashboard = null;
  let fetchError: string | null = null;

  try {
    dashboard = await getDelinquencyDashboard();
  } catch (err) {
    fetchError = err instanceof Error ? err.message : "Unknown error";
  }

  const topProperty = dashboard?.properties[0];
  const topTenant = dashboard?.cases[0];
  const thirtyPlusBucket = dashboard?.buckets.find(
    (bucket) => bucket.label === "30+ balance"
  );
  const totalBalance = dashboard?.totals.balanceDue ?? 0;
  const thirtyPlusPct =
    totalBalance > 0 && dashboard ? (dashboard.totals.balance30Plus / totalBalance) * 100 : null;

  const priorityItems = dashboard
    ? [
        {
          eyebrow: "1. Total exposure",
          title: fmtMoney(dashboard.totals.balanceDue),
          body: `${fmtNumber(dashboard.totals.activeCases)} active cases with positive receivable balances.`,
          detail: `Latest AppFolio feed: ${shortDate(dashboard.latestImport?.importedAt ?? null)}`,
        },
        {
          eyebrow: "2. Aged exposure",
          title: fmtMoney(dashboard.totals.balance30Plus),
          body: `${fmtNumber(thirtyPlusBucket?.count ?? 0)} cases have a 30+ balance.`,
          detail: `${fmtPct(thirtyPlusPct)} of the active delinquency balance is aged past 30 days.`,
        },
        {
          eyebrow: "3. Most exposed property",
          title: topProperty?.propertyName ?? "-",
          body: topProperty
            ? `${fmtMoney(topProperty.balanceDue)} across ${fmtNumber(topProperty.caseCount)} cases.`
            : "No active property exposure.",
          detail: topProperty
            ? `${fmtMoney(topProperty.balance30Plus)} is 30+, ${fmtNumber(topProperty.urgentCount)} action cases.`
            : "The feed has no active delinquency cases.",
        },
        {
          eyebrow: "4. Largest tenant balance",
          title: topTenant?.tenant_name || "-",
          body: topTenant
            ? `${fmtMoney(Number(topTenant.balance_due ?? 0))} at ${tenantLocation(topTenant)}.`
            : "No active tenant balances.",
          detail: topTenant
            ? `${fmtMoney(Number(topTenant.balance_30_plus ?? 0))} is 30+, status is ${statusLabel(topTenant.status)}.`
            : "The feed has no active delinquency cases.",
        },
      ]
    : [];

  return (
    <div className="mx-auto max-w-6xl px-8 py-10">
      <header className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="ms-eyebrow">Daily AppFolio feed</p>
          <h1 className="mt-1 font-heading text-3xl font-semibold text-navy">
            Delinquency dashboard
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-ink-muted">
            The four items that matter first each morning: how much is exposed,
            how much is aged, which property needs attention, and which tenant
            is driving the largest balance.
          </p>
        </div>
        <Link
          href="/delinquency"
          className="inline-flex w-fit items-center rounded-md border border-line bg-paper-raised px-4 py-2 text-sm font-semibold text-navy transition-colors hover:bg-paper"
        >
          Open review queue
        </Link>
      </header>

      {fetchError && (
        <section className="ms-card border-red-200 bg-red-50">
          <h2 className="font-heading text-lg font-semibold text-red-900">
            Could not load delinquency data
          </h2>
          <p className="mt-2 text-sm text-red-700">{fetchError}</p>
          <p className="mt-3 text-sm text-red-700">
            Check `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and that the
            AppFolio sync is writing to `delinquency_cases`.
          </p>
        </section>
      )}

      {dashboard && (
        <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {priorityItems.map((item) => (
            <article key={item.eyebrow} className="ms-card min-h-[210px]">
              <p className="ms-eyebrow">{item.eyebrow}</p>
              <h2 className="mt-3 font-heading text-3xl font-semibold leading-tight text-navy">
                {item.title}
              </h2>
              <p className="mt-4 text-sm font-medium text-ink">{item.body}</p>
              <p className="mt-2 text-sm text-ink-muted">{item.detail}</p>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
