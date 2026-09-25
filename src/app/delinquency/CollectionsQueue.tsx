"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ActionType, ManagerSummary, NextStep, QueueRow } from "@/lib/collections";

type QueuePayload = { asOf: string | null; rows: QueueRow[]; summary: ManagerSummary[] };
type Tab = "today" | "waiting" | "all";

const STEP_LABEL: Record<NextStep, string> = {
  text: "Text",
  call: "Call",
  notice: "Notice",
  wait: "Wait",
  excluded: "Excluded",
  with_legal: "With legal",
};

const STEP_STYLE: Record<NextStep, string> = {
  text: "bg-evergreen text-paper",
  call: "bg-navy text-paper",
  notice: "bg-[#8B4A2F] text-paper",
  wait: "border border-line bg-paper text-ink-muted",
  excluded: "border border-line bg-paper text-ink-muted",
  with_legal: "border border-line bg-paper text-ink-muted",
};

const LABEL_TEXT: Record<string, string> = {
  steady: "Steady",
  mail_payer: "Pays by mail",
  partial_payer: "Pays in pieces",
  chronic_late: "Habitually late",
  slipping: "Slipping",
  new: "New tenant",
};

function money(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function shortDate(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function plusDays(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function CollectionsQueue() {
  const [data, setData] = useState<QueuePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [manager, setManager] = useState<string>("all");
  const [tab, setTab] = useState<Tab>("today");
  const [actor, setActor] = useState<string>("");
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [open, setOpen] = useState<{ occ: string; kind: "promise" | "check_in_hand" | "exclude" | "note" } | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/collections/queue", { cache: "no-store" });
      const json = (await res.json()) as QueuePayload & { error?: string };
      if (!res.ok || json.error) throw new Error(json.error ?? `HTTP ${res.status}`);
      setData(json);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  useEffect(() => {
    void load();
    try {
      const saved = window.localStorage.getItem("ms-hub-actor");
      if (saved) setActor(saved);
    } catch {
      /* storage unavailable */
    }
  }, [load]);

  useEffect(() => {
    try {
      if (actor) window.localStorage.setItem("ms-hub-actor", actor);
    } catch {
      /* storage unavailable */
    }
  }, [actor]);

  const managers = useMemo(() => (data?.summary ?? []).map((s) => s.manager_name).sort(), [data]);

  const rows = useMemo(() => {
    const all = (data?.rows ?? [])
      .filter((r) => manager === "all" || (r.manager_name ?? "No manager on file") === manager)
      .sort((a, b) => b.priority - a.priority || b.owed - a.owed);
    if (tab === "today") return all.filter((r) => r.next_step === "text" || r.next_step === "call" || r.next_step === "notice");
    if (tab === "waiting") return all.filter((r) => r.next_step === "wait");
    return all;
  }, [data, manager, tab]);

  const summary = useMemo(() => {
    const list = (data?.summary ?? []).filter((s) => manager === "all" || s.manager_name === manager);
    return list.reduce(
      (acc, s) => ({
        tenants: acc.tenants + s.tenants_owing,
        owed: acc.owed + s.total_owed,
        over30: acc.over30 + s.owed_over_30,
        action: acc.action + s.action_today,
        notices: acc.notices + s.notices_suggested,
        slipping: acc.slipping + s.slipping,
        promises: acc.promises + s.open_promises,
        broken: acc.broken + s.broken_promises,
      }),
      { tenants: 0, owed: 0, over30: 0, action: 0, notices: 0, slipping: 0, promises: 0, broken: 0 },
    );
  }, [data, manager]);

  async function act(row: QueueRow, action_type: ActionType, details: Record<string, unknown> = {}, note?: string) {
    setBusy(row.occupancy_id);
    try {
      const res = await fetch("/api/collections/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ occupancy_id: row.occupancy_id, action_type, details, actor: actor || null, note: note || null }),
      });
      const json = (await res.json()) as { id?: number; error?: string };
      if (!res.ok || json.error) throw new Error(json.error ?? `HTTP ${res.status}`);
      setToast(`Logged: ${STEP_LABEL[action_type as NextStep] ?? action_type.replace("_", " ")} for ${row.tenant_name ?? "tenant"}`);
      setOpen(null);
      await load();
    } catch (e) {
      setToast(`Could not save: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(null);
      setTimeout(() => setToast(null), 3500);
    }
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-end gap-4">
        <label className="text-sm">
          <span className="ms-eyebrow block">Manager</span>
          <select
            data-testid="manager-filter"
            className="mt-1 rounded-md border border-line bg-paper-raised px-3 py-2 text-sm"
            value={manager}
            onChange={(e) => setManager(e.target.value)}
          >
            <option value="all">All managers</option>
            {managers.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="ms-eyebrow block">Your name</span>
          <input
            data-testid="actor"
            className="mt-1 w-44 rounded-md border border-line bg-paper-raised px-3 py-2 text-sm"
            placeholder="Who is logging"
            value={actor}
            onChange={(e) => setActor(e.target.value)}
          />
        </label>
        <div className="ml-auto text-xs text-ink-muted">
          {data?.asOf ? `Balances as of ${shortDate(data.asOf)} (AppFolio, nightly)` : ""}
        </div>
      </div>

      {/* Tiles */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4" data-testid="tiles">
        <Tile label="Tenants owing" value={String(summary.tenants)} sub={money(summary.owed)} />
        <Tile label="To do today" value={String(summary.action)} sub={summary.notices ? `${summary.notices} notice${summary.notices === 1 ? "" : "s"} suggested` : "texts and calls"} />
        <Tile label="Over 30 days" value={money(summary.over30)} sub="part of the total owed" />
        <Tile label="Slipping" value={String(summary.slipping)} sub={summary.broken ? `${summary.broken} broken promise${summary.broken === 1 ? "" : "s"}` : `${summary.promises} open promise${summary.promises === 1 ? "" : "s"}`} />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-line text-sm" role="tablist">
        {(["today", "waiting", "all"] as Tab[]).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            data-testid={`tab-${t}`}
            onClick={() => setTab(t)}
            className={`-mb-px border-b-2 px-3 py-2 ${tab === t ? "border-navy font-semibold text-navy" : "border-transparent text-ink-muted hover:text-ink"}`}
          >
            {t === "today" ? "Do today" : t === "waiting" ? "Waiting" : "Everyone owing"}
            <span className="ml-2 rounded-full bg-paper px-2 py-0.5 text-xs text-ink-muted">
              {t === "today" ? summary.action : t === "waiting" ? summary.tenants - summary.action : summary.tenants}
            </span>
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-md border border-[#8B4A2F]/40 bg-[#8B4A2F]/10 p-4 text-sm" role="alert" data-testid="load-error">
          Could not load the queue: {error}
        </div>
      )}
      {!data && !error && <p className="text-sm text-ink-muted">Loading…</p>}
      {data && rows.length === 0 && (
        <p className="text-sm text-ink-muted" data-testid="empty">
          Nothing here{tab === "today" ? " - everyone owing is either waiting on something or already contacted." : "."}
        </p>
      )}

      {/* Rows */}
      <ul className="space-y-3" data-testid="queue">
        {rows.map((r) => (
          <li key={r.occupancy_id} className="ms-card p-4" data-testid="queue-row" data-occ={r.occupancy_id}>
            <div className="flex flex-wrap items-start gap-4">
              <div className="min-w-[220px] flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${STEP_STYLE[r.next_step]}`} data-testid="step">
                    {STEP_LABEL[r.next_step]}
                  </span>
                  {r.label && <span className="rounded border border-line px-2 py-0.5 text-xs text-ink-muted">{LABEL_TEXT[r.label] ?? r.label}</span>}
                  {r.owed_over_30 > 0 && <span className="rounded border border-[#8B4A2F]/40 px-2 py-0.5 text-xs text-[#8B4A2F]">{money(r.owed_over_30)} over 30 days</span>}
                  {(r.watch_flags ?? []).includes("autopay_off") && <span className="rounded border border-line px-2 py-0.5 text-xs text-ink-muted">Autopay turned off</span>}
                </div>
                <div className="mt-2 font-heading text-lg font-semibold text-navy">
                  {r.tenant_name ?? "Unknown tenant"}
                  <span className="ml-2 text-sm font-normal text-ink-muted">
                    {r.property_name}
                    {r.unit ? ` · ${r.unit}` : ""}
                  </span>
                </div>
                <p className="mt-1 text-sm text-ink" data-testid="reason">
                  {r.next_step_reason}
                </p>
                {r.label_reason && r.label_reason !== r.next_step_reason && (
                  <p className="mt-1 text-xs text-ink-muted">{r.label_reason}</p>
                )}
                <p className="mt-1 text-xs text-ink-muted">
                  {r.manager_name ?? "No manager on file"}
                  {r.phone ? ` · ${r.phone}` : ""}
                  {r.last_action_at ? ` · last: ${r.last_action_type?.replace("_", " ")} ${shortDate(r.last_action_at)}` : " · no contact logged"}
                  {r.last_note ? ` - "${r.last_note}"` : ""}
                </p>
              </div>
              <div className="text-right">
                <div className="font-heading text-2xl font-semibold text-navy">{money(r.owed)}</div>
                <div className="text-xs text-ink-muted">
                  {r.last_payment_date ? `last paid ${shortDate(r.last_payment_date)}` : "no recent payment"}
                </div>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2" data-testid="actions">
              <Btn onClick={() => act(r, "text")} disabled={busy === r.occupancy_id} primary={r.next_step === "text"}>Texted</Btn>
              <Btn onClick={() => act(r, "call")} disabled={busy === r.occupancy_id} primary={r.next_step === "call"}>Called</Btn>
              <Btn onClick={() => act(r, "notice", { kind: "14-day pay or vacate" })} disabled={busy === r.occupancy_id} primary={r.next_step === "notice"}>Notice served</Btn>
              <Btn onClick={() => setOpen({ occ: r.occupancy_id, kind: "check_in_hand" })} disabled={busy === r.occupancy_id}>Check in hand</Btn>
              <Btn onClick={() => setOpen({ occ: r.occupancy_id, kind: "promise" })} disabled={busy === r.occupancy_id}>Promise to pay</Btn>
              <Btn onClick={() => setOpen({ occ: r.occupancy_id, kind: "exclude" })} disabled={busy === r.occupancy_id}>Exclude</Btn>
              <Btn onClick={() => setOpen({ occ: r.occupancy_id, kind: "note" })} disabled={busy === r.occupancy_id}>Note</Btn>
              {r.next_step === "notice" && (
                <span className="self-center text-xs text-ink-muted">Draft the notice with the POV generator in Slack #delinq, then log it here.</span>
              )}
            </div>

            {open?.occ === r.occupancy_id && (
              <ActionForm kind={open.kind} row={r} onCancel={() => setOpen(null)} onSubmit={(details, note) => act(r, open.kind, details, note)} />
            )}
          </li>
        ))}
      </ul>

      {toast && (
        <div className="fixed bottom-6 right-6 rounded-md border border-line bg-navy px-4 py-3 text-sm text-paper shadow" role="status" data-testid="toast">
          {toast}
        </div>
      )}
    </div>
  );
}

function Tile({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-md border border-line bg-paper-raised p-4">
      <p className="ms-eyebrow">{label}</p>
      <p className="mt-2 font-heading text-2xl font-semibold text-navy">{value}</p>
      <p className="mt-1 text-xs text-ink-muted">{sub}</p>
    </div>
  );
}

function Btn({ children, onClick, disabled, primary }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; primary?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-md px-3 py-1.5 text-sm transition disabled:opacity-50 ${
        primary ? "bg-navy text-paper hover:bg-navy/90" : "border border-line bg-paper-raised text-ink hover:bg-paper"
      }`}
    >
      {children}
    </button>
  );
}

function ActionForm({
  kind,
  row,
  onCancel,
  onSubmit,
}: {
  kind: "promise" | "check_in_hand" | "exclude" | "note";
  row: QueueRow;
  onCancel: () => void;
  onSubmit: (details: Record<string, unknown>, note?: string) => void;
}) {
  const [amount, setAmount] = useState(String(Math.round(row.owed)));
  const [date, setDate] = useState(kind === "check_in_hand" ? plusDays(7) : plusDays(3));
  const [text, setText] = useState("");
  const min = todayIso();

  return (
    <form
      className="mt-3 flex flex-wrap items-end gap-3 rounded-md border border-line bg-paper p-3"
      data-testid={`form-${kind}`}
      onSubmit={(e) => {
        e.preventDefault();
        if (kind === "promise") onSubmit({ amount: Number(amount), due_date: date }, text || undefined);
        else if (kind === "check_in_hand") onSubmit({ hold_until: date }, text || undefined);
        else if (kind === "exclude") onSubmit({ reason: text || "excluded by manager" }, text || undefined);
        else onSubmit({}, text);
      }}
    >
      {kind === "promise" && (
        <label className="text-sm">
          <span className="ms-eyebrow block">Amount</span>
          <input name="amount" type="number" min="1" step="1" required className="mt-1 w-28 rounded-md border border-line px-2 py-1.5" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </label>
      )}
      {(kind === "promise" || kind === "check_in_hand") && (
        <label className="text-sm">
          <span className="ms-eyebrow block">{kind === "promise" ? "Will pay by" : "Hold reminders until"}</span>
          <input name="date" type="date" min={min} required className="mt-1 rounded-md border border-line px-2 py-1.5" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
      )}
      <label className="flex-1 text-sm">
        <span className="ms-eyebrow block">{kind === "exclude" ? "Why" : "Note"}</span>
        <input
          name="note"
          className="mt-1 w-full rounded-md border border-line px-2 py-1.5"
          placeholder={kind === "promise" ? "e.g. paycheck Friday" : kind === "check_in_hand" ? "e.g. money order #4521 received 9/24" : kind === "exclude" ? "e.g. on a payment plan with Conor" : "What happened"}
          value={text}
          required={kind === "note" || kind === "exclude"}
          onChange={(e) => setText(e.target.value)}
        />
      </label>
      <button type="submit" className="rounded-md bg-navy px-3 py-1.5 text-sm text-paper" data-testid="form-save">
        Save
      </button>
      <button type="button" onClick={onCancel} className="rounded-md border border-line px-3 py-1.5 text-sm">
        Cancel
      </button>
    </form>
  );
}
