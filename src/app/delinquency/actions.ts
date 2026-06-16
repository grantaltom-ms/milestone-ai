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
  const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL
    ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
    : "http://localhost:3000"

  const res = await fetch(`${baseUrl}/api/delinquency/candidates/${id}/pov`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }))
    throw new Error(err.error ?? "Failed to create POV draft")
  }

  revalidatePath("/delinquency")
  revalidatePath("/pov-notices")
}

export async function sendEmail(id: string) {
  const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL
    ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
    : "http://localhost:3000"

  const res = await fetch(`${baseUrl}/api/delinquency/candidates/${id}/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }))
    throw new Error(err.error ?? "Failed to send email")
  }

  revalidatePath("/delinquency")
}
