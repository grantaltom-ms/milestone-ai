/**
 * Collections queue: the daily "who do I contact, and how" list.
 *
 * All of the thinking lives in Supabase (delinquency-tracker/migrations/
 * 20260925_06_collections_queue.sql):
 *   v_collections_queue            one row per tenant who owes money today,
 *                                  with a suggested next step and the reason
 *   v_collections_manager_summary  per-manager rollup for the header tiles
 *   record_collection_action()     the one write: what a manager just did
 *
 * This file only reads those and passes button presses through. Server-only.
 */
import { getSupabase } from "./supabase";

export type NextStep = "wait" | "text" | "call" | "notice" | "excluded" | "with_legal";

export type PaymentLabel =
  | "steady"
  | "mail_payer"
  | "partial_payer"
  | "chronic_late"
  | "slipping"
  | "new";

export interface QueueRow {
  occupancy_id: string;
  property_name: string;
  unit: string | null;
  tenant_name: string | null;
  manager_name: string | null;
  phone: string | null;
  email: string | null;
  case_status: string | null;
  owed: number;
  owed_over_30: number;
  monthly_rent: number | null;
  last_payment_date: string | null;
  snapshot_date: string;
  label: PaymentLabel | null;
  label_reason: string | null;
  typical_day: number | null;
  mail_payer: boolean | null;
  days_past_deadline: number;
  watch_flags: string[] | null;
  last_action_at: string | null;
  last_action_type: string | null;
  last_note: string | null;
  hold_until: string | null;
  excluded_reason: string | null;
  promise_amount: number | null;
  promise_due: string | null;
  promise_status: "open" | "kept" | "broken" | null;
  next_step: NextStep;
  next_step_reason: string;
  priority: number;
}

export interface ManagerSummary {
  manager_name: string;
  tenants_owing: number;
  total_owed: number;
  owed_over_30: number;
  action_today: number;
  notices_suggested: number;
  slipping: number;
  checks_in_hand: number;
  open_promises: number;
  broken_promises: number;
}

export const ACTION_TYPES = [
  "text",
  "call",
  "email",
  "notice",
  "check_in_hand",
  "promise",
  "exclude",
  "note",
  "payment_plan",
] as const;
export type ActionType = (typeof ACTION_TYPES)[number];

export interface ActionInput {
  occupancy_id: string;
  action_type: ActionType;
  details?: Record<string, unknown>;
  actor?: string | null;
  note?: string | null;
}

function num(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function numOrNull(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Supabase returns numeric columns as strings; normalise the ones the UI does math on. */
export function normalizeRow(r: Record<string, unknown>): QueueRow {
  return {
    ...(r as unknown as QueueRow),
    owed: num(r.owed),
    owed_over_30: num(r.owed_over_30),
    monthly_rent: numOrNull(r.monthly_rent),
    days_past_deadline: num(r.days_past_deadline),
    priority: num(r.priority),
    promise_amount: numOrNull(r.promise_amount),
    typical_day: numOrNull(r.typical_day),
  };
}

export function normalizeSummary(r: Record<string, unknown>): ManagerSummary {
  return {
    manager_name: String(r.manager_name ?? "No manager on file"),
    tenants_owing: num(r.tenants_owing),
    total_owed: num(r.total_owed),
    owed_over_30: num(r.owed_over_30),
    action_today: num(r.action_today),
    notices_suggested: num(r.notices_suggested),
    slipping: num(r.slipping),
    checks_in_hand: num(r.checks_in_hand),
    open_promises: num(r.open_promises),
    broken_promises: num(r.broken_promises),
  };
}

export async function getCollectionsQueue(): Promise<{ rows: QueueRow[]; summary: ManagerSummary[] }> {
  const supabase = getSupabase();
  const [queue, summary] = await Promise.all([
    supabase.from("v_collections_queue").select("*").order("priority", { ascending: false }),
    supabase.from("v_collections_manager_summary").select("*"),
  ]);
  if (queue.error) throw new Error(`v_collections_queue: ${queue.error.message}`);
  if (summary.error) throw new Error(`v_collections_manager_summary: ${summary.error.message}`);
  return {
    rows: (queue.data ?? []).map((r) => normalizeRow(r as Record<string, unknown>)),
    summary: (summary.data ?? []).map((r) => normalizeSummary(r as Record<string, unknown>)),
  };
}

/** Validates a button press before it becomes a database row. Returns an error message or null. */
export function validateAction(input: Partial<ActionInput>): string | null {
  if (!input.occupancy_id || typeof input.occupancy_id !== "string") return "occupancy_id is required";
  if (!input.action_type || !ACTION_TYPES.includes(input.action_type)) return `action_type must be one of ${ACTION_TYPES.join(", ")}`;
  const d = input.details ?? {};
  if (input.action_type === "promise") {
    const amount = Number(d.amount);
    const due = typeof d.due_date === "string" ? d.due_date : "";
    if (!Number.isFinite(amount) || amount <= 0) return "A promise needs an amount";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(due)) return "A promise needs a due date (YYYY-MM-DD)";
    if (due < new Date().toISOString().slice(0, 10)) return "A promise date can't be in the past";
  }
  if (input.action_type === "check_in_hand" && d.hold_until !== undefined) {
    if (typeof d.hold_until !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(d.hold_until)) return "hold_until must be YYYY-MM-DD";
  }
  if (input.note !== undefined && input.note !== null && String(input.note).length > 1000) return "Note is too long";
  return null;
}

export async function recordAction(input: ActionInput): Promise<number> {
  const problem = validateAction(input);
  if (problem) throw new Error(problem);
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc("record_collection_action", {
    p_occupancy_id: input.occupancy_id,
    p_action_type: input.action_type,
    p_details: input.details ?? {},
    p_actor: input.actor ?? null,
    p_note: input.note ?? null,
  });
  if (error) throw new Error(`record_collection_action: ${error.message}`);
  return Number(data);
}
