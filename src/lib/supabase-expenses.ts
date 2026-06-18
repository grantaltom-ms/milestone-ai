export interface TenantReplyRow {
  id: string;
  created_at: string | null;
}

export async function recentTenantReplies(limit = 30): Promise<TenantReplyRow[]> {
  void limit;
  return [];
}
