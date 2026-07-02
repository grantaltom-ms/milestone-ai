import { createClient } from '@supabase/supabase-js';

export function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      '[supabase] SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set. Copy .env.local.example and fill in the values.'
    );
  }
  return createClient(url, key);
}
