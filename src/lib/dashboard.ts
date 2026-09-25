import { getSupabase } from "./supabase";

export type MoneyMovement = {
  chargesAssessed: number;
  moneyReceived: number;
  variance: number;
  collectionRate: number;
  rentRollSnapshotDate: string | null;
  latestReceiptDate: string | null;
};

export async function getMonthlyMoneyMovement(): Promise<MoneyMovement> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    .toISOString()
    .slice(0, 10);

  // Charges assessed: sum of monthly_rent from the most recent rent roll snapshot.
  const supabase = getSupabase();
  const { data: rrData, error: rrError } = await supabase
    .from("rent_roll")
    .select("monthly_rent, snapshot_date")
    .order("snapshot_date", { ascending: false })
    .limit(1);

  if (rrError) throw new Error(`rent_roll: ${rrError.message}`);

  const latestSnapshotDate = rrData?.[0]?.snapshot_date ?? null;

  let chargesAssessed = 0;
  if (latestSnapshotDate) {
    const { data: rrRows, error: rrRowsError } = await supabase
      .from("rent_roll")
      .select("monthly_rent")
      .eq("snapshot_date", latestSnapshotDate)
      .not("status", "eq", "Vacant");

    if (rrRowsError) throw new Error(`rent_roll rows: ${rrRowsError.message}`);
    chargesAssessed = (rrRows ?? []).reduce(
      (sum, r) => sum + (r.monthly_rent ?? 0),
      0
    );
  }

  // Money received: current-month sum of receivables_activity.receipt_amount.
  const { data: recData, error: recError } = await supabase
    .from("receivables_activity")
    .select("receipt_amount, receipt_date")
    .gte("receipt_date", monthStart)
    .lt("receipt_date", monthEnd)
    .order("receipt_date", { ascending: false })
    .limit(1);

  if (recError) throw new Error(`receivables_activity: ${recError.message}`);
  const latestReceiptDate = recData?.[0]?.receipt_date ?? null;

  const { data: recSum, error: recSumError } = await supabase
    .from("receivables_activity")
    .select("receipt_amount")
    .gte("receipt_date", monthStart)
    .lt("receipt_date", monthEnd);

  if (recSumError) throw new Error(`receivables sum: ${recSumError.message}`);
  const moneyReceived = (recSum ?? []).reduce(
    (sum, r) => sum + (r.receipt_amount ?? 0),
    0
  );

  const variance = moneyReceived - chargesAssessed;
  const collectionRate =
    chargesAssessed > 0 ? (moneyReceived / chargesAssessed) * 100 : 0;

  return {
    chargesAssessed,
    moneyReceived,
    variance,
    collectionRate,
    rentRollSnapshotDate: latestSnapshotDate,
    latestReceiptDate,
  };
}
