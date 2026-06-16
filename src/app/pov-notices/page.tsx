import Link from "next/link"
import { getSupabase } from "@/lib/supabase"
import NoticeRow, { type Notice } from "./NoticeRow"

type FilterTab = "all" | "draft" | "approved" | "served" | "voided"

const TABS: { label: string; value: FilterTab }[] = [
  { label: "All", value: "all" },
  { label: "Draft", value: "draft" },
  { label: "Approved", value: "approved" },
  { label: "Served", value: "served" },
  { label: "Voided", value: "voided" },
]

async function getNotices(filter: FilterTab): Promise<Notice[]> {
  const sb = getSupabase()
  let query = sb
    .from("pov_notices")
    .select(
      "id, tenant_name, property_name, unit, manager_name, google_doc_url, status, created_at, served_at, voided_at"
    )
    .order("created_at", { ascending: false })

  if (filter !== "all") {
    query = query.eq("status", filter)
  }

  const { data, error } = await query
  if (error) throw new Error(`pov_notices: ${error.message}`)
  return (data ?? []) as Notice[]
}

export default async function PovNotices({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const rawFilter = searchParams?.filter
  const filter: FilterTab =
    typeof rawFilter === "string" &&
    ["all", "draft", "approved", "served", "voided"].includes(rawFilter)
      ? (rawFilter as FilterTab)
      : "all"

  let notices: Notice[] = []
  let fetchError: string | null = null

  try {
    notices = await getNotices(filter)
  } catch (err) {
    fetchError = err instanceof Error ? err.message : "Unknown error"
  }

  return (
    <div className="mx-auto max-w-6xl px-8 py-10">
      <header className="mb-8">
        <p className="ms-eyebrow">Notice register</p>
        <h1 className="mt-1 font-heading text-3xl font-semibold text-navy">
          POV notices
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-muted">
          Pay or Vacate notices after drafts are approved and created. Tracks
          manager, property, tenant, unit, Google Doc link, status, and approval
          metadata.
        </p>
      </header>

      {/* Filter tabs */}
      <div className="mb-6 flex gap-1 border-b border-line">
        {TABS.map((tab) => (
          <Link
            key={tab.value}
            href={`/pov-notices?filter=${tab.value}`}
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
          Could not load notices: {fetchError}
        </div>
      )}

      {!fetchError && notices.length === 0 && (
        <section className="ms-card">
          <p className="text-sm text-ink-muted">
            No {filter === "all" ? "" : filter + " "}notices yet. Notices appear
            here after POV drafts are created from the Delinquency review queue.
          </p>
        </section>
      )}

      {!fetchError && notices.length > 0 && (
        <section className="ms-card overflow-x-auto">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="ms-card-title">Notices</h2>
            <span className="text-xs text-ink-muted">
              {notices.length} notice{notices.length !== 1 ? "s" : ""}
            </span>
          </div>
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-line">
                <th className="pb-2 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  Tenant
                </th>
                <th className="pb-2 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  Property / Unit
                </th>
                <th className="pb-2 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  Manager
                </th>
                <th className="pb-2 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  Status
                </th>
                <th className="pb-2 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  Created
                </th>
                <th className="pb-2 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  Doc
                </th>
                <th className="pb-2 text-left text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {notices.map((notice) => (
                <NoticeRow key={notice.id} notice={notice} />
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  )
}
