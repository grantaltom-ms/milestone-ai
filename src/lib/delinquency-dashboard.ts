import { unstable_noStore as noStore } from "next/cache";
import { getSupabase } from "./supabase";

export type DelinquencyCase = {
  appfolio_tenant_id: string | null;
  tenant_name: string | null;
  property_name: string | null;
  unit_id: string | null;
  status: string | null;
  balance_due: number | null;
  balance_0_30: number | null;
  balance_30_plus: number | null;
  days_past_due: number | null;
  monthly_rent_amount: number | null;
  last_payment_date: string | null;
};

export type PropertyDelinquency = {
  propertyName: string;
  caseCount: number;
  balanceDue: number;
  balance030: number;
  balance30Plus: number;
  urgentCount: number;
  highBalanceCount: number;
  maxDaysPastDue: number;
};

export type RiskBucket = {
  label: string;
  count: number;
  balance: number;
  description: string;
};

export type DelinquencyDashboard = {
  cases: DelinquencyCase[];
  properties: PropertyDelinquency[];
  buckets: RiskBucket[];
  totals: {
    activeCases: number;
    balanceDue: number;
    balance030: number;
    balance30Plus: number;
    urgentCases: number;
    highBalanceCases: number;
    rentCoveragePct: number | null;
  };
  statusCounts: { status: string; count: number; balance: number }[];
  latestImport: {
    batchId: string | null;
    sourceFile: string | null;
    rowsImported: number | null;
    importedAt: string | null;
  } | null;
};

const URGENT_STATUSES = new Set(["notice", "escalated", "legal"]);
const ACTION_BALANCE_THRESHOLD = 1000;
const HIGH_BALANCE_THRESHOLD = 5000;

function money(value: unknown): number {
  const numberValue = Number(value ?? 0);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function isUrgentCase(row: DelinquencyCase): boolean {
  const status = (row.status ?? "").toLowerCase();
  return (
    URGENT_STATUSES.has(status) ||
    money(row.balance_30_plus) > 0 ||
    money(row.balance_due) >= ACTION_BALANCE_THRESHOLD
  );
}

async function getLatestImport() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("import_log")
    .select("batch_id, source_file, rows_imported, date_range_end, date_range_start")
    .eq("source_type", "delinquency")
    .order("date_range_end", { ascending: false, nullsFirst: false })
    .limit(1);

  if (error) return null;

  const row = data?.[0] as
    | {
        batch_id?: string | null;
        source_file?: string | null;
        rows_imported?: number | null;
        date_range_end?: string | null;
        date_range_start?: string | null;
      }
    | undefined;

  if (!row) return null;

  return {
    batchId: row.batch_id ?? null,
    sourceFile: row.source_file ?? null,
    rowsImported: row.rows_imported ?? null,
    importedAt: row.date_range_end ?? row.date_range_start ?? null,
  };
}

export async function getDelinquencyDashboard(): Promise<DelinquencyDashboard> {
  noStore();

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("delinquency_cases")
    .select(
      [
        "appfolio_tenant_id",
        "tenant_name",
        "property_name",
        "unit_id",
        "status",
        "balance_due",
        "balance_0_30",
        "balance_30_plus",
        "days_past_due",
        "monthly_rent_amount",
        "last_payment_date",
      ].join(", ")
    )
    .not("appfolio_tenant_id", "is", null)
    .neq("status", "resolved")
    .gt("balance_due", 0)
    .order("balance_due", { ascending: false })
    .limit(2000);

  if (error) throw new Error(`delinquency_cases: ${error.message}`);

  const cases = ((data ?? []) as unknown as DelinquencyCase[]).map((row) => ({
    ...row,
    balance_due: money(row.balance_due),
    balance_0_30: money(row.balance_0_30),
    balance_30_plus: money(row.balance_30_plus),
    days_past_due: Math.max(0, Math.trunc(money(row.days_past_due))),
    monthly_rent_amount:
      row.monthly_rent_amount === null ? null : money(row.monthly_rent_amount),
  }));

  const totals = cases.reduce(
    (sum, row) => {
      const balanceDue = money(row.balance_due);
      const balance030 = money(row.balance_0_30);
      const balance30Plus = money(row.balance_30_plus);
      const monthlyRent = money(row.monthly_rent_amount);

      sum.balanceDue += balanceDue;
      sum.balance030 += balance030;
      sum.balance30Plus += balance30Plus;
      sum.monthlyRent += monthlyRent;
      if (isUrgentCase(row)) sum.urgentCases += 1;
      if (balanceDue >= HIGH_BALANCE_THRESHOLD) sum.highBalanceCases += 1;
      return sum;
    },
    {
      balanceDue: 0,
      balance030: 0,
      balance30Plus: 0,
      monthlyRent: 0,
      urgentCases: 0,
      highBalanceCases: 0,
    }
  );

  const propertyMap = new Map<string, PropertyDelinquency>();
  const statusMap = new Map<string, { status: string; count: number; balance: number }>();

  for (const row of cases) {
    const propertyName = row.property_name || "Unassigned property";
    const balanceDue = money(row.balance_due);
    const balance030 = money(row.balance_0_30);
    const balance30Plus = money(row.balance_30_plus);
    const daysPastDue = Math.max(0, Math.trunc(money(row.days_past_due)));

    const property = propertyMap.get(propertyName) ?? {
      propertyName,
      caseCount: 0,
      balanceDue: 0,
      balance030: 0,
      balance30Plus: 0,
      urgentCount: 0,
      highBalanceCount: 0,
      maxDaysPastDue: 0,
    };

    property.caseCount += 1;
    property.balanceDue += balanceDue;
    property.balance030 += balance030;
    property.balance30Plus += balance30Plus;
    property.maxDaysPastDue = Math.max(property.maxDaysPastDue, daysPastDue);
    if (isUrgentCase(row)) property.urgentCount += 1;
    if (balanceDue >= HIGH_BALANCE_THRESHOLD) property.highBalanceCount += 1;
    propertyMap.set(propertyName, property);

    const status = (row.status || "open").toLowerCase();
    const statusRow = statusMap.get(status) ?? { status, count: 0, balance: 0 };
    statusRow.count += 1;
    statusRow.balance += balanceDue;
    statusMap.set(status, statusRow);
  }

  const buckets: RiskBucket[] = [
    {
      label: "Action cases",
      count: totals.urgentCases,
      balance: cases
        .filter((row) => isUrgentCase(row))
        .reduce((sum, row) => sum + money(row.balance_due), 0),
      description: "$1k+, 30+, notice, escalated, or legal.",
    },
    {
      label: "30+ balance",
      count: cases.filter((row) => money(row.balance_30_plus) > 0).length,
      balance: totals.balance30Plus,
      description: "Cases with any aged balance beyond the current bucket.",
    },
    {
      label: "Notice / legal",
      count: cases.filter((row) => URGENT_STATUSES.has((row.status ?? "").toLowerCase())).length,
      balance: cases
        .filter((row) => URGENT_STATUSES.has((row.status ?? "").toLowerCase()))
        .reduce((sum, row) => sum + money(row.balance_due), 0),
      description: "Tenants already marked notice, escalated, or legal.",
    },
    {
      label: "$5k+ balances",
      count: totals.highBalanceCases,
      balance: cases
        .filter((row) => money(row.balance_due) >= HIGH_BALANCE_THRESHOLD)
        .reduce((sum, row) => sum + money(row.balance_due), 0),
      description: "Large balances that can distort property-level collections.",
    },
  ];

  const rentCoveragePct =
    totals.monthlyRent > 0 ? (totals.balanceDue / totals.monthlyRent) * 100 : null;

  return {
    cases,
    properties: Array.from(propertyMap.values()).sort(
      (a, b) => b.balanceDue - a.balanceDue
    ),
    buckets,
    totals: {
      activeCases: cases.length,
      balanceDue: totals.balanceDue,
      balance030: totals.balance030,
      balance30Plus: totals.balance30Plus,
      urgentCases: totals.urgentCases,
      highBalanceCases: totals.highBalanceCases,
      rentCoveragePct,
    },
    statusCounts: Array.from(statusMap.values()).sort(
      (a, b) => b.balance - a.balance
    ),
    latestImport: await getLatestImport(),
  };
}
