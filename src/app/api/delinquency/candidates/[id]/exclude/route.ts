import { NextResponse } from "next/server"
import { getSupabase } from "@/lib/supabase"

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const sb = getSupabase()
  const { error } = await sb
    .from("delinquency_candidates")
    .update({ review_status: "excluded", action_state: "manager_excluded" })
    .eq("id", params.id)

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true, message: "Candidate excluded." })
}
