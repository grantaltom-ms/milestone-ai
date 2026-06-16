import Link from "next/link"
import { getSupabase } from "@/lib/supabase"
import CandidateRow, { type Candidate } from "./CandidateRow"

type FilterTab = "all" | "pending" | "approved" | "excluded"

const TABS: { label: string; value: FilterTab }[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Excluded", value: "excluded" },
]

async function getCandidates(filter: FilterTab): Promise<Candidate[]> {
  const sb = getSupabase()
  let query = sb
    .from("delinquency_candidates")
    .select("id, tenant_name, property_name, unit, manager_name, balance_owed, review_status, action_state, created_at")
    .order("manager_name", { ascending: true })
    .order("tenant_name", { ascending: true })

  if (filter !== "all") {
    query = query.eq("review_status", filter)
  }

  const { data, error } = await query
  if (error) throw new Error(`delinquency_candidates: ${error.message}`)
  return (data ?? []) as Candidate[]
}

function groupByManager(candidates: Candidate[]): Map<string, Candidate[]> {
  const map = new Map<string, Candidate[]>()
  for (const c of candidates) {
    const key = c.manager_name ?? "Unassigned"
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(c)
  }
  return map
}

export default async function DelinquencyReview({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const rawFilter = searchParams?.status
  const filter: FilterTab =
    typeof rawFilter === "string" && ["all", "pending", "approved", "excluded"].includes(rawFilter)
      ? (rawFilter as FilterTab)
      : "pending"

  let candidates: Candidate[] = []
  let fetchError: string | null = null

  try {
    candidates = await getCandidates(filter)
  } catch (err) {
    fetchError = err instanceof Error ? err.message : "Unknown error"
  }

  const grouped = groupByManager(candidates)

  return (
    <div className="mx-auto max-w-6xl px-8 py-10">
      <header className="mb-8">
        <p className="ms-eyebrow">Human review queue</p>
        <h1 className="mt-1 font-heading text-3xl font-semibold text-navy">
          Delinquency review
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-muted">
          Candidates surfaced from AppFolio delinquency reports. Managers decide
          what happens before any email, SMS, or POV draft is created.
        </p>
      </header>

      {/* Filter tabs */}
      <div className="mb-6 flex gap-1 border-b border-line">
        {TABS.map((tab) => (
          <Link
            key={tab.value}
            href={`/delinquency?status=${tab.value}`}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              filter === tab.value
                ? "border-b-2 border-navy text-navy"
                : "text-ink-muted hover:text-navy"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {fetchError && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Could not load candidates: {fetchError}
        </div>
      )}

      {!fetchError && candidates.length === 0 && (
        <section className="ms-card">
          <p className="text-sm text-ink-muted">
            No {filter === "all" ? "" : filter + " "}candidates.
            {filter === "pending" && (
              <> The queue is refreshed weekly on Tuesdays and monthly on the 11th.</>
            )}
          </p>
        </section>
      )}

      {!fetchError && candidates.length > 0 && (
        <div className="space-y-8">
          {Array.from(grouped.entries()).map(([manager, rows]) => (
            <section key={manager} className="ms-card">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="ms-card-title">{manager}</h2>
                <span className="text-xs text-ink-muted">{rows.length} candidate{rows.length !== 1 ? "s" : ""}</span>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-line">
                    <th className="pb-2 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-ink-muted">
                      Tenant
                    </th>
                    <th className="pb-2 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-ink-muted">
                      Property / Unit
                    </th>
                    <th className="pb-2 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-ink-muted">
                      Balance
                    </th>
                    <th className="pb-2 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-ink-muted">
                      Status
                    </th>
                    <th className="pb-2 text-left text-xs font-semibold uppercase tracking-wide text-ink-muted">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((candidate) => (
                    <CandidateRow key={candidate.id} candidate={candidate} />
                  ))}
                </tbody>
              </table>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
