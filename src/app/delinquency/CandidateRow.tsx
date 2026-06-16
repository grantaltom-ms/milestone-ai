"use client"

import { useState, useTransition } from "react"
import {
  excludeCandidate,
  skipCandidate,
  createPovDraft,
  sendEmail,
} from "./actions"

export type Candidate = {
  id: string
  tenant_name: string
  property_name: string
  unit: string
  manager_name: string
  balance_owed: number
  review_status: string
  action_state: string
  created_at: string
}

function ActionStateBadge({
  state,
  reviewStatus,
}: {
  state: string
  reviewStatus: string
}) {
  // Approved via Skip with no outreach yet → "Skipped"
  if (
    reviewStatus === "approved" &&
    (state === "candidate_found" || !state)
  ) {
    return (
      <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
        Skipped
      </span>
    )
  }

  switch (state) {
    case "email_sent":
    case "sms_sent":
      return (
        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
          Sent
        </span>
      )
    case "pov_draft_created":
      return (
        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
          POV Created
        </span>
      )
    case "email_failed":
    case "sms_failed":
    case "pov_draft_failed":
      return (
        <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-600">
          Failed
        </span>
      )
    case "manager_excluded":
      return (
        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
          Excluded
        </span>
      )
    default:
      // candidate_found and any unknown state
      return (
        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
          Pending
        </span>
      )
  }
}

export default function CandidateRow({ candidate }: { candidate: Candidate }) {
  const [isPending, startTransition] = useTransition()
  const [inlineError, setInlineError] = useState<string | null>(null)

  const { id, tenant_name, property_name, unit, balance_owed, action_state, review_status } = candidate

  const povDisabled = action_state === "pov_draft_created"
  const emailDisabled = ["email_sent", "sms_sent", "pov_draft_created"].includes(action_state)

  const fmtBalance = balance_owed.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  })

  function run(fn: () => Promise<void>) {
    setInlineError(null)
    startTransition(async () => {
      try {
        await fn()
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Something went wrong"
        setInlineError(msg)
        // Auto-clear after 6 seconds
        setTimeout(() => setInlineError(null), 6000)
      }
    })
  }

  return (
    <>
      <tr className="border-b border-line last:border-0">
        <td className="py-3 pr-4">
          <p className="text-sm font-medium text-navy">{tenant_name}</p>
        </td>
        <td className="py-3 pr-4">
          <p className="text-sm text-ink-muted">{property_name}</p>
          <p className="text-xs text-ink-muted">Unit {unit}</p>
        </td>
        <td className="py-3 pr-4">
          <p className="text-sm font-medium text-navy tabular-nums">{fmtBalance}</p>
        </td>
        <td className="py-3 pr-4">
          <ActionStateBadge state={action_state} reviewStatus={review_status} />
        </td>
        <td className="py-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={povDisabled || isPending}
              onClick={() => run(() => createPovDraft(id))}
              className="rounded border border-line bg-paper px-2.5 py-1 text-xs font-medium text-navy transition-colors hover:bg-paper-raised disabled:cursor-not-allowed disabled:opacity-40"
            >
              Create POV
            </button>
            <button
              type="button"
              disabled={emailDisabled || isPending}
              onClick={() => run(() => sendEmail(id))}
              className="rounded border border-line bg-paper px-2.5 py-1 text-xs font-medium text-navy transition-colors hover:bg-paper-raised disabled:cursor-not-allowed disabled:opacity-40"
            >
              Email
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => run(() => excludeCandidate(id))}
              className="rounded border border-line bg-paper px-2.5 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Exclude
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => run(() => skipCandidate(id))}
              className="rounded border border-line bg-paper px-2.5 py-1 text-xs font-medium text-ink-muted transition-colors hover:bg-paper-raised disabled:cursor-not-allowed disabled:opacity-40"
            >
              Skip
            </button>
          </div>
          {inlineError && (
            <p className="mt-1 text-xs text-red-600">{inlineError}</p>
          )}
        </td>
      </tr>
    </>
  )
}
