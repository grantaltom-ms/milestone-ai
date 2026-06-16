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
    .select("id, tenant_name, property_name, unit, manager_name, balance_owed, action_state, review_status")
    .eq("id", id)
    .single()

  if (fetchErr || !candidate) {
    return NextResponse.json({ error: "Candidate not found" }, { status: 404 })
  }

  if (candidate.action_state === "pov_draft_created") {
    return NextResponse.json(
      { error: "POV draft already created for this candidate" },
      { status: 409 }
    )
  }

  // 2. Call milestone-pov service
  const povApiUrl = process.env.MILESTONE_POV_API_URL
  const povApiSecret = process.env.POV_API_SECRET

  if (!povApiUrl) {
    return NextResponse.json(
      { error: "MILESTONE_POV_API_URL not configured" },
      { status: 503 }
    )
  }

  let googleDocId: string | null = null
  let googleDocUrl: string | null = null
  let povError: string | null = null

  try {
    const povRes = await fetch(`${povApiUrl}/create-notice`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(povApiSecret ? { Authorization: `Bearer ${povApiSecret}` } : {}),
      },
      body: JSON.stringify({
        tenantName: candidate.tenant_name,
        propertyName: candidate.property_name,
        unit: candidate.unit,
        managerName: candidate.manager_name,
        balanceOwed: candidate.balance_owed,
        noticeDate: new Date().toISOString().slice(0, 10),
      }),
    })

    if (povRes.ok) {
      const povData = await povRes.json()
      googleDocId = povData.googleDocId ?? null
      googleDocUrl = povData.googleDocUrl ?? null
    } else {
      const errText = await povRes.text()
      povError = `milestone-pov error ${povRes.status}: ${errText}`
    }
  } catch (e) {
    povError = e instanceof Error ? e.message : "Unknown error calling milestone-pov"
  }

  if (povError) {
    await sb
      .from("delinquency_candidates")
      .update({ action_state: "pov_draft_failed" })
      .eq("id", id)
    return NextResponse.json({ error: povError }, { status: 502 })
  }

  // 3. Insert into pov_notices
  const { data: notice, error: insertErr } = await sb
    .from("pov_notices")
    .insert({
      candidate_id: id,
      tenant_name: candidate.tenant_name,
      property_name: candidate.property_name,
      unit: candidate.unit,
      manager_name: candidate.manager_name,
      google_doc_id: googleDocId,
      google_doc_url: googleDocUrl,
      status: "draft",
    })
    .select("id")
    .single()

  if (insertErr) {
    return NextResponse.json(
      { error: `Failed to store notice: ${insertErr.message}` },
      { status: 500 }
    )
  }

  // 4. Update candidate action_state
  await sb
    .from("delinquency_candidates")
    .update({ action_state: "pov_draft_created", review_status: "approved" })
    .eq("id", id)

  return NextResponse.json({
    ok: true,
    noticeId: notice.id,
    googleDocUrl,
  })
}
