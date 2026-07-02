export interface WorkOrderRow {
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
