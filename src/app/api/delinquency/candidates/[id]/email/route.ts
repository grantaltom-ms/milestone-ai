import { NextRequest, NextResponse } from "next/server"
import { getSupabase } from "@/lib/supabase"

export const dynamic = "force-dynamic"

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params
  const sb = getSupabase()

  // 1. Fetch candidate
  const { data: candidate, error: fetchErr } = await sb
    .from("delinquency_candidates")
    .select("id, tenant_name, action_state")
    .eq("id", id)
    .single()

  if (fetchErr || !candidate) {
    return NextResponse.json({ error: "Candidate not found" }, { status: 404 })
  }

  if (candidate.action_state === "email_sent") {
    return NextResponse.json(
      { error: "Email already sent for this candidate" },
      { status: 409 }
    )
  }

  // 2. Update action_state — real Gmail sending will be wired up later
  const { error: updateErr } = await sb
    .from("delinquency_candidates")
    .update({ action_state: "email_sent" })
    .eq("id", id)

  if (updateErr) {
    return NextResponse.json(
      { error: `Failed to update candidate: ${updateErr.message}` },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true })
}
