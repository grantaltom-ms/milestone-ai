import { createClient } from '@supabase/supabase-js';

export interface TenantReplyRow {
  id: string;
  created_at: string;
  wo_number: string;
  from_number: string;
  body: string;
  direction: 'inbound' | 'outbound';
}

function getExpensesSupabase() {
  const url = process.env.EXPENSES_SUPABASE_URL;
  const key = process.env.EXPENSES_SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      '[supabase-expenses] EXPENSES_SUPABASE_URL and EXPENSES_SUPABASE_SERVICE_ROLE_KEY must be set.'
    );
  }
  return createClient(url, key);
}

export async function recentTenantReplies(limit = 30): Promise<TenantReplyRow[]> {
  try {
    const supabase = getExpensesSupabase();
    const { data, error } = await supabase
      .from('tenant_replies')
      .select('id, created_at, wo_number, from_number, body, direction')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) {
      console.error('[supabase-expenses] recentTenantReplies error', error);
      return [];
    }
    return (data ?? []) as TenantReplyRow[];
  } catch (e) {
    console.error('[supabase-expenses] recentTenantReplies unexpected', e);
    return [];
  }
}
