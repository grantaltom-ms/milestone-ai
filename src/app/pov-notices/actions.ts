"use server"
import { getSupabase } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

export async function markNoticeServed(id: string) {
  const sb = getSupabase()
  await sb
    .from("pov_notices")
    .update({ status: "served", served_at: new Date().toISOString() })
    .eq("id", id)
  revalidatePath("/pov-notices")
}

export async function voidNotice(id: string) {
  const sb = getSupabase()
  await sb
    .from("pov_notices")
    .update({ status: "voided", voided_at: new Date().toISOString() })
    .eq("id", id)
  revalidatePath("/pov-notices")
}
