import { getSupabase } from './supabase';
import { recentTenantReplies, TenantReplyRow } from './supabase-expenses';
import type { WorkOrderRow } from '@/types/work-order';

export interface MonthlyMoneyMovement {
  month: string;
  monthStart: string;
  monthEnd: string;
  chargesAssessed: number;
  moneyReceived: number;
  variance: number;
  collectionRate: number | null;
  rentRollSnapshotDate: string | null;
  latestReceiptDate: string | null;
  source: 'supabase' | 'demo';
}

export interface RecentWorkOrder {
  wo_number: string;
  property: string | null;
  unit: string | null;
  resident: string | null;
  issue_category: string | null;
  status: string | null;
  is_open: boolean | null;
  last_seen_at: string | null;
  sms_sent_at: string | null;
  sms_confirmed: boolean | null;
  manager_notified_at: string | null;
}

export async function recentWorkOrders(limit = 20): Promise<RecentWorkOrder[]> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('work_orders')
      .select(
        'wo_number, property, unit, resident, issue_category, status, is_open, last_seen_at, sms_sent_at, sms_confirmed, manager_notified_at'
      )
      .order('last_seen_at', { ascending: false })
      .limit(limit);
    if (error) {
      console.error('[dashboard] recentWorkOrders error', error);
      return [];
    }
    return (data || []) as RecentWorkOrder[];
  } catch (e) {
    console.error('[dashboard] recentWorkOrders unexpected', e);
    return [];
  }
}

export async function recentReplies(limit = 30): Promise<TenantReplyRow[]> {
  return recentTenantReplies(limit);
}

function toNumber(value: number | string | null | undefined): number {
  const n = typeof value === 'number' ? value : Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function monthWindow(date = new Date()) {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));
  return {
    month: start.toISOString().slice(0, 7),
    monthStart: start.toISOString().slice(0, 10),
    monthEnd: end.toISOString().slice(0, 10),
  };
}

export async function getMonthlyMoneyMovement(date = new Date()): Promise<MonthlyMoneyMovement> {
  const window = monthWindow(date);
  const demo = {
    ...window,
    chargesAssessed: 1248500,
    moneyReceived: 1107250,
    variance: 141250,
    collectionRate: 88.7,
    rentRollSnapshotDate: null,
    latestReceiptDate: null,
    source: 'demo' as const,
  };

  try {
    const supabase = getSupabase();

    const { data: latestSnapshots, error: snapshotError } = await supabase
      .from('rent_roll')
      .select('snapshot_date')
      .order('snapshot_date', { ascending: false })
      .limit(1);

    if (snapshotError) {
      console.error('[dashboard] latest rent_roll snapshot error', snapshotError);
      return demo;
    }

    const rentRollSnapshotDate = latestSnapshots?.[0]?.snapshot_date ?? null;
    if (!rentRollSnapshotDate) return demo;

    const [{ data: rentRows, error: rentError }, { data: receiptRows, error: receiptError }] =
      await Promise.all([
        supabase
          .from('rent_roll')
          .select('monthly_rent')
          .eq('snapshot_date', rentRollSnapshotDate)
          .not('monthly_rent', 'is', null),
        supabase
          .from('receivables_activity')
          .select('receipt_amount, receipt_date')
          .gte('receipt_date', window.monthStart)
          .lt('receipt_date', window.monthEnd),
      ]);

    if (rentError) {
      console.error('[dashboard] rent_roll summary error', rentError);
      return demo;
    }
    if (receiptError) {
      console.error('[dashboard] receivables_activity summary error', receiptError);
      return demo;
    }

    const chargesAssessed = (rentRows ?? []).reduce(
      (sum, row) => sum + toNumber(row.monthly_rent),
      0
    );
    const moneyReceived = (receiptRows ?? []).reduce(
      (sum, row) => sum + toNumber(row.receipt_amount),
      0
    );
    const latestReceiptDate =
      receiptRows?.reduce<string | null>((latest, row) => {
        const receiptDate = typeof row.receipt_date === 'string' ? row.receipt_date : null;
        if (!receiptDate) return latest;
        return !latest || receiptDate > latest ? receiptDate : latest;
      }, null) ?? null;

    return {
      ...window,
      chargesAssessed,
      moneyReceived,
      variance: chargesAssessed - moneyReceived,
      collectionRate: chargesAssessed > 0 ? (moneyReceived / chargesAssessed) * 100 : null,
      rentRollSnapshotDate,
      latestReceiptDate,
      source: 'supabase',
    };
  } catch (e) {
    console.error('[dashboard] getMonthlyMoneyMovement unexpected', e);
    return demo;
  }
}

export type { TenantReplyRow };
export type { WorkOrderRow };
