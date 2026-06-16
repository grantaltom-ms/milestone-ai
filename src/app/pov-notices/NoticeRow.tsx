"use client"

import { useTransition } from "react"
import { markNoticeServed, voidNotice } from "./actions"

export type Notice = {
  id: string
  tenant_name: string
  property_name: string
  unit: string
  manager_name: string
  google_doc_url: string | null
  status: string
  created_at: string
  served_at: string | null
  voided_at: string | null
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "approved":
      return (
        <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
          Approved
        </span>
      )
    case "served":
      return (
        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
          Served
        </span>
      )
    case "voided":
      return (
        <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-500">
          Voided
        </span>
      )
    default:
      // draft
      return (
        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
          Draft
        </span>
      )
  }
}

function fmtDate(iso: string | null) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export default function NoticeRow({ notice }: { notice: Notice }) {
  const [isPending, startTransition] = useTransition()

  const {
    id,
    tenant_name,
    property_name,
    unit,
    manager_name,
    google_doc_url,
    status,
    created_at,
  } = notice

  const canServe = status === "approved"
  const canVoid = status === "draft" || status === "approved"

  function run(fn: () => Promise<void>) {
    startTransition(async () => {
      await fn()
    })
  }

  return (
    <tr className="border-b border-line last:border-0">
      <td className="py-3 pr-4">
        <p className="text-sm font-medium text-navy">{tenant_name}</p>
      </td>
      <td className="py-3 pr-4">
        <p className="text-sm text-ink-muted">{property_name}</p>
        <p className="text-xs text-ink-muted">Unit {unit}</p>
      </td>
      <td className="py-3 pr-4">
        <p className="text-sm text-ink-muted">{manager_name}</p>
      </td>
      <td className="py-3 pr-4">
        <StatusBadge status={status} />
      </td>
      <td className="py-3 pr-4">
        <p className="text-sm text-ink-muted tabular-nums">{fmtDate(created_at)}</p>
      </td>
      <td className="py-3 pr-4">
        {google_doc_url ? (
          <a
            href={google_doc_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 underline-offset-2 hover:underline"
          >
            Open Doc
          </a>
        ) : (
          <span className="text-sm text-ink-muted">—</span>
        )}
      </td>
      <td className="py-3">
        <div className="flex items-center gap-2">
          {canServe && (
            <button
              type="button"
              disabled={isPending}
              onClick={() => run(() => markNoticeServed(id))}
              className="rounded border border-line bg-paper px-2.5 py-1 text-xs font-medium text-navy transition-colors hover:bg-paper-raised disabled:cursor-not-allowed disabled:opacity-40"
            >
              Mark Served
            </button>
          )}
          {canVoid && (
            <button
              type="button"
              disabled={isPending}
              onClick={() => run(() => voidNotice(id))}
              className="rounded border border-line bg-paper px-2.5 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Void
            </button>
          )}
          {!canServe && !canVoid && (
            <span className="text-xs text-ink-muted">—</span>
          )}
        </div>
      </td>
    </tr>
  )
}
