"use server"
import { getSupabase } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

export async function excludeCandidate(id: string) {
  const sb = getSupabase()
  await sb.from("delinquency_candidates").update({ review_status: "excluded" }).eq("id", id)
  revalidatePath("/delinquency")
}

export async function skipCandidate(id: string) {
  const sb = getSupabase()
  await sb.from("delinquency_candidates").update({ review_status: "approved" }).eq("id", id)
  revalidatePath("/delinquency")
}

export async function createPovDraft(id: string) {
  const sb = getSupabase()
  // Call API route — for now just update state optimistically
  await sb.from("delinquency_candidates").update({ action_state: "pov_draft_created" }).eq("id", id)
  revalidatePath("/delinquency")
}

export async function sendEmail(id: string) {
  const sb = getSupabase()
  await sb.from("delinquency_candidates").update({ action_state: "email_sent" }).eq("id", id)
  revalidatePath("/delinquency")
}
