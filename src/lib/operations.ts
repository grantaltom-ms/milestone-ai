import { unstable_noStore as noStore } from "next/cache";
import { getSupabase } from "./supabase";
import { money } from "./format";

export type DataResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

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

export type PropertySummary = {
  propertyName: string;
  caseCount: number;
  balanceDue: number;
  balance030: number;
  balance30Plus: number;
  urgentCount: number;
  highBalanceCount: number;
  maxDaysPastDue: number;
};

export type CollectionsData = {
  cases: DelinquencyCase[];
  properties: PropertySummary[];
  totals: {
    activeCases: number;
    balanceDue: number;
    balance030: number;
    balance30Plus: number;
    urgentCases: number;
    highBalanceCases: number;
  };
  latestImport: ImportLog | null;
};

export type ImportLog = {
  batchId: string | null;
  sourceFile: string | null;
  rowsImported: number | null;
  importedAt: string | null;
};

export type FinancialData = {
  periodStart: string | null;
  periodEnd: string | null;
  portfolio: {
    operatingIncome: number;
    operatingExpense: number;
    noi: number;
    netIncome: number;
  };
  properties: {
    propertyId: number;
    propertyName: string;
    operatingIncome: number;
    operatingExpense: number;
    noi: number;
    netIncome: number;
    marginPct: number | null;
  }[];
};

export type AssetWatchData = {
  asOfDate: string | null;
  portfolio: {
    cash: number;
    accountsReceivable: number;
    assets: number;
    liabilities: number;
    equity: number;
    mortgage: number;
  };
  properties: {
    propertyId: number;
    propertyName: string;
    cash: number;
    accountsReceivable: number;
    assets: number;
    liabilities: number;
    equity: number;
    mortgage: number;
  }[];
};

export type VacancyData = {
  snapshotDate: string | null;
  totalUnits: number;
  vacantUnits: number;
  noticeUnits: number;
  unrentedUnits: number;
  occupiedUnits: number;
  rentExposure: number;
  statusCounts: { status: string; count: number; rent: number }[];
  properties: {
    propertyName: string;
    vacantUnits: number;
    noticeUnits: number;
    unrentedUnits: number;
    rentExposure: number;
    totalUnits: number;
    maxDaysVacant: number | null;
  }[];
};

export type ReceivablesActivityData = {
  periodStart: string;
  periodEnd: string;
  latestReceiptDate: string | null;
  totals: {
    receiptAmount: number;
    transactionCount: number;
    payeeCount: number;
    propertyCount: number;
    delinquentPayeeReceiptAmount: number;
    delinquentPayeeTransactionCount: number;
  };
  byDate: {
    receiptDate: string;
    transactionCount: number;
    receiptAmount: number;
  }[];
  byPaymentMethod: {
    paymentMethod: string;
    transactionCount: number;
    receiptAmount: number;
  }[];
  properties: {
    propertyName: string;
    transactionCount: number;
    receiptAmount: number;
    payeeCount: number;
  }[];
  recentReceipts: {
    receiptDate: string;
    payee: string;
    propertyName: string;
    receiptAmount: number;
    paymentMethod: string;
    status: string | null;
  }[];
};

export type ManagerScorecard = {
  managerName: string;
  propertyCount: number;
  delinquencyCases: number;
  delinquencyBalance: number;
  balance30Plus: number;
  urgentCases: number;
  vacantUnits: number;
  noticeUnits: number;
  unrentedUnits: number;
  vacancyRentExposure: number;
};

const URGENT_STATUSES = new Set(["notice", "escalated", "legal"]);
const ACTION_BALANCE_THRESHOLD = 1000;
const HIGH_BALANCE_THRESHOLD = 5000;

function currentMonthWindow() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    .toISOString()
    .slice(0, 10);
  return { start, end };
}

function normalizeName(value: string | null | undefined) {
  return (value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function isUrgent(row: DelinquencyCase) {
  return (
    URGENT_STATUSES.has((row.status ?? "").toLowerCase()) ||
    money(row.balance_30_plus) > 0 ||
    money(row.balance_due) >= ACTION_BALANCE_THRESHOLD
  );
}

function normalizeCase(row: DelinquencyCase): DelinquencyCase {
  return {
    ...row,
    balance_due: money(row.balance_due),
    balance_0_30: money(row.balance_0_30),
    balance_30_plus: money(row.balance_30_plus),
    days_past_due: Math.max(0, Math.trunc(money(row.days_past_due))),
    monthly_rent_amount:
      row.monthly_rent_amount === null ? null : money(row.monthly_rent_amount),
  };
}

async function safe<T>(label: string, fn: () => Promise<T>): Promise<DataResult<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { ok: false, error: `${label}: ${message}` };
  }
}

async function getPropertyNames() {
  const sb = getSupabase();
  const { data, error } = await sb.from("properties").select("id, name");
  if (error) return new Map<number, string>();
  return new Map(
    ((data ?? []) as { id: number; name: string | null }[]).map((row) => [
      Number(row.id),
      row.name || `Property ${row.id}`,
    ])
  );
}

async function getLatestImport(sourceType: string): Promise<ImportLog | null> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("import_log")
    .select("batch_id, source_file, rows_imported, date_range_end, date_range_start")
    .eq("source_type", sourceType)
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

export async function getCollectionsData(): Promise<DataResult<CollectionsData>> {
  noStore();
  return safe("delinquency_cases", async () => {
    const sb = getSupabase();
    const { data, error } = await sb
      .from("delinquency_cases")
      .select(
        "appfolio_tenant_id, tenant_name, property_name, unit_id, status, balance_due, balance_0_30, balance_30_plus, days_past_due, monthly_rent_amount, last_payment_date"
      )
      .not("appfolio_tenant_id", "is", null)
      .neq("status", "resolved")
      .gt("balance_due", 0)
      .order("balance_due", { ascending: false })
      .limit(2500);

    if (error) throw new Error(error.message);

    const cases = ((data ?? []) as unknown as DelinquencyCase[]).map(normalizeCase);
    const propertyMap = new Map<string, PropertySummary>();
    const totals = {
      activeCases: cases.length,
      balanceDue: 0,
      balance030: 0,
      balance30Plus: 0,
      urgentCases: 0,
      highBalanceCases: 0,
    };

    for (const row of cases) {
      const propertyName = row.property_name || "Unassigned property";
      const balanceDue = money(row.balance_due);
      const balance030 = money(row.balance_0_30);
      const balance30Plus = money(row.balance_30_plus);
      totals.balanceDue += balanceDue;
      totals.balance030 += balance030;
      totals.balance30Plus += balance30Plus;
      if (isUrgent(row)) totals.urgentCases += 1;
      if (balanceDue >= HIGH_BALANCE_THRESHOLD) totals.highBalanceCases += 1;

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
      property.maxDaysPastDue = Math.max(property.maxDaysPastDue, money(row.days_past_due));
      if (isUrgent(row)) property.urgentCount += 1;
      if (balanceDue >= HIGH_BALANCE_THRESHOLD) property.highBalanceCount += 1;
      propertyMap.set(propertyName, property);
    }

    return {
      cases,
      properties: Array.from(propertyMap.values()).sort((a, b) => b.balanceDue - a.balanceDue),
      totals,
      latestImport: await getLatestImport("delinquency"),
    };
  });
}

export async function getFinancialData(): Promise<DataResult<FinancialData>> {
  noStore();
  return safe("income_statement_summary", async () => {
    const sb = getSupabase();
    const names = await getPropertyNames();
    const latest = await sb
      .from("income_statement_summary")
      .select("period_start, period_end")
      .order("period_start", { ascending: false })
      .limit(1);

    if (latest.error) throw new Error(latest.error.message);
    const periodStart = latest.data?.[0]?.period_start ?? null;
    const periodEnd = latest.data?.[0]?.period_end ?? null;
    if (!periodStart) {
      return {
        periodStart: null,
        periodEnd: null,
        portfolio: { operatingIncome: 0, operatingExpense: 0, noi: 0, netIncome: 0 },
        properties: [],
      };
    }

    const { data, error } = await sb
      .from("income_statement_summary")
      .select("property_id, period_start, period_end, total_operating_income, total_operating_expense, noi, net_income")
      .eq("period_start", periodStart)
      .order("noi", { ascending: false });

    if (error) throw new Error(error.message);

    const properties = ((data ?? []) as unknown as {
      property_id: number;
      total_operating_income: number | null;
      total_operating_expense: number | null;
      noi: number | null;
      net_income: number | null;
    }[]).map((row) => {
      const operatingIncome = money(row.total_operating_income);
      const noi = money(row.noi);
      return {
        propertyId: Number(row.property_id),
        propertyName: names.get(Number(row.property_id)) || `Property ${row.property_id}`,
        operatingIncome,
        operatingExpense: money(row.total_operating_expense),
        noi,
        netIncome: money(row.net_income),
        marginPct: operatingIncome > 0 ? (noi / operatingIncome) * 100 : null,
      };
    });

    return {
      periodStart,
      periodEnd,
      portfolio: properties.reduce(
        (sum, row) => ({
          operatingIncome: sum.operatingIncome + row.operatingIncome,
          operatingExpense: sum.operatingExpense + row.operatingExpense,
          noi: sum.noi + row.noi,
          netIncome: sum.netIncome + row.netIncome,
        }),
        { operatingIncome: 0, operatingExpense: 0, noi: 0, netIncome: 0 }
      ),
      properties,
    };
  });
}

export async function getAssetWatchData(): Promise<DataResult<AssetWatchData>> {
  noStore();
  return safe("balance_sheets", async () => {
    const sb = getSupabase();
    const names = await getPropertyNames();
    const latest = await sb
      .from("balance_sheets")
      .select("as_of_date")
      .order("as_of_date", { ascending: false })
      .limit(1);

    if (latest.error) throw new Error(latest.error.message);
    const asOfDate = latest.data?.[0]?.as_of_date ?? null;
    if (!asOfDate) {
      return {
        asOfDate: null,
        portfolio: { cash: 0, accountsReceivable: 0, assets: 0, liabilities: 0, equity: 0, mortgage: 0 },
        properties: [],
      };
    }

    const { data, error } = await sb
      .from("balance_sheets")
      .select("property_id, as_of_date, cash_and_equivalents, accounts_receivable, total_assets, mortgage_balance, total_liabilities, total_equity")
      .eq("as_of_date", asOfDate)
      .order("cash_and_equivalents", { ascending: true });

    if (error) throw new Error(error.message);

    const properties = ((data ?? []) as unknown as {
      property_id: number;
      cash_and_equivalents: number | null;
      accounts_receivable: number | null;
      total_assets: number | null;
      mortgage_balance: number | null;
      total_liabilities: number | null;
      total_equity: number | null;
    }[]).map((row) => ({
      propertyId: Number(row.property_id),
      propertyName: names.get(Number(row.property_id)) || `Property ${row.property_id}`,
      cash: money(row.cash_and_equivalents),
      accountsReceivable: money(row.accounts_receivable),
      assets: money(row.total_assets),
      liabilities: money(row.total_liabilities),
      equity: money(row.total_equity),
      mortgage: money(row.mortgage_balance),
    }));

    return {
      asOfDate,
      portfolio: properties.reduce(
        (sum, row) => ({
          cash: sum.cash + row.cash,
          accountsReceivable: sum.accountsReceivable + row.accountsReceivable,
          assets: sum.assets + row.assets,
          liabilities: sum.liabilities + row.liabilities,
          equity: sum.equity + row.equity,
          mortgage: sum.mortgage + row.mortgage,
        }),
        { cash: 0, accountsReceivable: 0, assets: 0, liabilities: 0, equity: 0, mortgage: 0 }
      ),
      properties,
    };
  });
}

export async function getReceivablesActivityData(): Promise<DataResult<ReceivablesActivityData>> {
  noStore();
  return safe("receivables_activity", async () => {
    const sb = getSupabase();
    const { start, end } = currentMonthWindow();

    const [{ data, error }, collections] = await Promise.all([
      sb
        .from("receivables_activity")
        .select("receipt_date, receipt_amount, property_name, payee, payment_method, status")
        .gte("receipt_date", start)
        .lt("receipt_date", end)
        .order("receipt_date", { ascending: false })
        .limit(10000),
      getCollectionsData(),
    ]);

    if (error) throw new Error(error.message);

    const activeDelinquentNames = new Set(
      collections.ok
        ? collections.data.cases
            .map((row) => normalizeName(row.tenant_name))
            .filter(Boolean)
        : []
    );

    const rows = ((data ?? []) as unknown as {
      receipt_date: string | null;
      receipt_amount: number | null;
      property_name: string | null;
      payee: string | null;
      payment_method: string | null;
      status: string | null;
    }[]).map((row) => ({
      receiptDate: row.receipt_date ?? "",
      receiptAmount: money(row.receipt_amount),
      propertyName: row.property_name || "Unassigned property",
      payee: row.payee || "Unknown payee",
      paymentMethod: row.payment_method || "Uncategorized",
      status: row.status,
    }));

    const payees = new Set<string>();
    const properties = new Set<string>();
    const byDate = new Map<string, { receiptDate: string; transactionCount: number; receiptAmount: number }>();
    const byPaymentMethod = new Map<
      string,
      { paymentMethod: string; transactionCount: number; receiptAmount: number }
    >();
    const propertyMap = new Map<
      string,
      { propertyName: string; transactionCount: number; receiptAmount: number; payees: Set<string> }
    >();

    const totals = {
      receiptAmount: 0,
      transactionCount: rows.length,
      payeeCount: 0,
      propertyCount: 0,
      delinquentPayeeReceiptAmount: 0,
      delinquentPayeeTransactionCount: 0,
    };

    for (const row of rows) {
      totals.receiptAmount += row.receiptAmount;
      payees.add(row.payee);
      properties.add(row.propertyName);

      if (activeDelinquentNames.has(normalizeName(row.payee))) {
        totals.delinquentPayeeReceiptAmount += row.receiptAmount;
        totals.delinquentPayeeTransactionCount += 1;
      }

      const dateBucket = byDate.get(row.receiptDate) ?? {
        receiptDate: row.receiptDate,
        transactionCount: 0,
        receiptAmount: 0,
      };
      dateBucket.transactionCount += 1;
      dateBucket.receiptAmount += row.receiptAmount;
      byDate.set(row.receiptDate, dateBucket);

      const methodBucket = byPaymentMethod.get(row.paymentMethod) ?? {
        paymentMethod: row.paymentMethod,
        transactionCount: 0,
        receiptAmount: 0,
      };
      methodBucket.transactionCount += 1;
      methodBucket.receiptAmount += row.receiptAmount;
      byPaymentMethod.set(row.paymentMethod, methodBucket);

      const property = propertyMap.get(row.propertyName) ?? {
        propertyName: row.propertyName,
        transactionCount: 0,
        receiptAmount: 0,
        payees: new Set<string>(),
      };
      property.transactionCount += 1;
      property.receiptAmount += row.receiptAmount;
      property.payees.add(row.payee);
      propertyMap.set(row.propertyName, property);
    }

    totals.payeeCount = payees.size;
    totals.propertyCount = properties.size;

    return {
      periodStart: start,
      periodEnd: end,
      latestReceiptDate: rows[0]?.receiptDate || null,
      totals,
      byDate: Array.from(byDate.values()).sort((a, b) =>
        a.receiptDate.localeCompare(b.receiptDate)
      ),
      byPaymentMethod: Array.from(byPaymentMethod.values()).sort(
        (a, b) => b.receiptAmount - a.receiptAmount
      ),
      properties: Array.from(propertyMap.values())
        .map((row) => ({
          propertyName: row.propertyName,
          transactionCount: row.transactionCount,
          receiptAmount: row.receiptAmount,
          payeeCount: row.payees.size,
        }))
        .sort((a, b) => b.receiptAmount - a.receiptAmount),
      recentReceipts: rows.slice(0, 15).map((row) => ({
        receiptDate: row.receiptDate,
        payee: row.payee,
        propertyName: row.propertyName,
        receiptAmount: row.receiptAmount,
        paymentMethod: row.paymentMethod,
        status: row.status,
      })),
    };
  });
}

export async function getVacancyData(): Promise<DataResult<VacancyData>> {
  noStore();
  return safe("unit_vacancy_snapshots", async () => {
    const sb = getSupabase();
    const latest = await sb
      .from("unit_vacancy_snapshots")
      .select("snapshot_date")
      .order("snapshot_date", { ascending: false })
      .limit(1);

    if (latest.error) throw new Error(latest.error.message);
    const snapshotDate = latest.data?.[0]?.snapshot_date ?? null;
    if (!snapshotDate) {
      return {
        snapshotDate: null,
        totalUnits: 0,
        vacantUnits: 0,
        noticeUnits: 0,
        unrentedUnits: 0,
        occupiedUnits: 0,
        rentExposure: 0,
        statusCounts: [],
        properties: [],
      };
    }

    const { data, error } = await sb
      .from("unit_vacancy_snapshots")
      .select("property_name, unit_status, last_move_out, available_on, snapshot_date")
      .eq("snapshot_date", snapshotDate)
      .limit(10000);

    if (error) throw new Error(error.message);

    const rows = (data ?? []) as unknown as {
      property_name: string | null;
      unit_status: string | null;
      last_move_out: string | null;
      available_on: string | null;
    }[];
    const statusMap = new Map<string, { status: string; count: number; rent: number }>();
    const propertyMap = new Map<
      string,
      {
        propertyName: string;
        vacantUnits: number;
        noticeUnits: number;
        unrentedUnits: number;
        rentExposure: number;
        totalUnits: number;
        maxDaysVacant: number | null;
      }
    >();
    let vacantUnits = 0;
    let noticeUnits = 0;
    let unrentedUnits = 0;
    let rentExposure = 0;

    for (const row of rows) {
      const status = row.unit_status || "Unknown";
      const rent = 0;
      const normalizedStatus = status.toLowerCase();
      const vacant = normalizedStatus.startsWith("vacant");
      const notice = normalizedStatus.startsWith("notice");
      const unrented = normalizedStatus.endsWith("unrented");
      const propertyName = row.property_name || "Unassigned property";
      const statusRow = statusMap.get(status) ?? { status, count: 0, rent: 0 };
      statusRow.count += 1;
      statusRow.rent += rent;
      statusMap.set(status, statusRow);

      const property = propertyMap.get(propertyName) ?? {
        propertyName,
        vacantUnits: 0,
        noticeUnits: 0,
        unrentedUnits: 0,
        rentExposure: 0,
        totalUnits: 0,
        maxDaysVacant: null,
      };
      property.totalUnits += 1;
      if (notice) {
        noticeUnits += 1;
        property.noticeUnits += 1;
      }
      if (unrented) {
        unrentedUnits += 1;
        property.unrentedUnits += 1;
      }
      if (vacant) {
        vacantUnits += 1;
        rentExposure += rent;
        property.vacantUnits += 1;
        property.rentExposure += rent;
        if (row.last_move_out) {
          const moveOut = new Date(`${row.last_move_out}T00:00:00`);
          const snapshot = new Date(`${snapshotDate}T00:00:00`);
          const daysVacant = Math.max(
            0,
            Math.floor((snapshot.getTime() - moveOut.getTime()) / 86400000)
          );
          property.maxDaysVacant = Math.max(property.maxDaysVacant ?? 0, daysVacant);
        }
      }
      propertyMap.set(propertyName, property);
    }

    return {
      snapshotDate,
      totalUnits: rows.length,
      vacantUnits,
      noticeUnits,
      unrentedUnits,
      occupiedUnits: 0,
      rentExposure,
      statusCounts: Array.from(statusMap.values()).sort((a, b) => b.count - a.count),
      properties: Array.from(propertyMap.values()).sort(
        (a, b) => b.unrentedUnits - a.unrentedUnits || b.vacantUnits - a.vacantUnits
      ),
    };
  });
}

async function getManagerMap(): Promise<Map<string, string>> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("property_managers")
    .select("property_name, manager_name");
  if (error) return new Map();
  return new Map(
    ((data ?? []) as { property_name: string | null; manager_name: string | null }[])
      .filter((row) => row.property_name)
      .map((row) => [row.property_name!, row.manager_name || "Unassigned"])
  );
}

export async function getManagerScorecards(): Promise<DataResult<ManagerScorecard[]>> {
  noStore();
  return safe("manager scorecards", async () => {
    const [collections, vacancy, managerMap] = await Promise.all([
      getCollectionsData(),
      getVacancyData(),
      getManagerMap(),
    ]);

    if (!collections.ok) throw new Error(collections.error);
    const scorecards = new Map<string, ManagerScorecard>();

    function getCard(managerName: string) {
      const card = scorecards.get(managerName) ?? {
        managerName,
        propertyCount: 0,
        delinquencyCases: 0,
        delinquencyBalance: 0,
        balance30Plus: 0,
        urgentCases: 0,
        vacantUnits: 0,
        noticeUnits: 0,
        unrentedUnits: 0,
        vacancyRentExposure: 0,
      };
      scorecards.set(managerName, card);
      return card;
    }

    const propertySeenByManager = new Map<string, Set<string>>();
    for (const property of collections.data.properties) {
      const managerName = managerMap.get(property.propertyName) || "Unassigned";
      const card = getCard(managerName);
      card.delinquencyCases += property.caseCount;
      card.delinquencyBalance += property.balanceDue;
      card.balance30Plus += property.balance30Plus;
      card.urgentCases += property.urgentCount;
      const seen = propertySeenByManager.get(managerName) ?? new Set<string>();
      seen.add(property.propertyName);
      propertySeenByManager.set(managerName, seen);
    }

    if (vacancy.ok) {
      for (const property of vacancy.data.properties) {
        const managerName = managerMap.get(property.propertyName) || "Unassigned";
        const card = getCard(managerName);
        card.vacantUnits += property.vacantUnits;
        card.noticeUnits += property.noticeUnits;
        card.unrentedUnits += property.unrentedUnits;
        card.vacancyRentExposure += property.rentExposure;
        const seen = propertySeenByManager.get(managerName) ?? new Set<string>();
        seen.add(property.propertyName);
        propertySeenByManager.set(managerName, seen);
      }
    }

    for (const [managerName, seen] of Array.from(propertySeenByManager.entries())) {
      getCard(managerName).propertyCount = seen.size;
    }

    return Array.from(scorecards.values()).sort(
      (a, b) => b.delinquencyBalance + b.unrentedUnits - (a.delinquencyBalance + a.unrentedUnits)
    );
  });
}
