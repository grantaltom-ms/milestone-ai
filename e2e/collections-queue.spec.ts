import { test, expect, type Page, type Route } from "@playwright/test";

/**
 * The Delinquency review page end to end, with a fake database behind the two API
 * routes it talks to (/api/collections/queue and /api/collections/action). The fake
 * behaves like the real Supabase view: logging an action changes the tenant's next
 * step on the next load, so the tests check the page's real loop - look, act, see it
 * move - several times in a row, not just that it renders.
 */

type Row = Record<string, unknown> & { occupancy_id: string; next_step: string; manager_name: string; owed: number };

function row(over: Partial<Row> & { occupancy_id: string }): Row {
  return {
    property_name: "Willow Lake Apartments",
    unit: "F - 08",
    tenant_name: "Sanchez, Scarlet",
    manager_name: "Milestone SeaTac Office",
    phone: "(206) 555-0100",
    email: null,
    case_status: "open",
    owed: 1500,
    owed_over_30: 0,
    monthly_rent: 1500,
    last_payment_date: "2026-08-04",
    snapshot_date: "2026-09-24",
    label: "slipping",
    label_reason: "Usually pays in full by the 4th. Nothing received yet for September.",
    typical_day: 4,
    mail_payer: false,
    days_past_deadline: 17,
    watch_flags: [],
    last_action_at: null,
    last_action_type: null,
    last_note: null,
    hold_until: null,
    excluded_reason: null,
    promise_amount: null,
    promise_due: null,
    promise_status: null,
    next_step: "call",
    next_step_reason: "Past their usual pay day by 17 days - call and get a date.",
    priority: 100,
    ...over,
  };
}

class FakeDb {
  rows: Row[];
  actions: Array<Record<string, unknown>> = [];
  failNext = false;

  constructor(rows: Row[]) {
    this.rows = rows;
  }

  /** What the real Supabase view would say after an action. */
  applyAction(a: Record<string, unknown>) {
    const r = this.rows.find((x) => x.occupancy_id === a.occupancy_id);
    if (!r) return;
    const type = a.action_type as string;
    const details = (a.details ?? {}) as Record<string, unknown>;
    r.last_action_at = new Date().toISOString();
    r.last_action_type = type;
    if (a.note) r.last_note = a.note;
    if (type === "call" || type === "text") {
      r.next_step = "wait";
      r.next_step_reason = `${type === "call" ? "Called" : "Texted"} today - give it a few days.`;
    } else if (type === "check_in_hand") {
      r.next_step = "wait";
      r.hold_until = String(details.hold_until);
      r.next_step_reason = `Check in hand - waiting for it to post (until ${details.hold_until}).`;
    } else if (type === "promise") {
      r.next_step = "wait";
      r.promise_status = "open";
      r.promise_amount = Number(details.amount);
      r.promise_due = String(details.due_date);
      r.next_step_reason = `Promised $${details.amount} by ${details.due_date}.`;
    } else if (type === "exclude") {
      r.next_step = "excluded";
      r.excluded_reason = String(details.reason);
      r.next_step_reason = `Excluded this month: ${details.reason}.`;
    } else if (type === "notice") {
      r.next_step = "wait";
      r.next_step_reason = "Notice served today.";
    }
  }

  summary() {
    const by = new Map<string, Row[]>();
    for (const r of this.rows) {
      const k = r.manager_name ?? "No manager on file";
      by.set(k, [...(by.get(k) ?? []), r]);
    }
    return Array.from(by.entries()).map(([manager_name, rs]: [string, Row[]]) => ({
      manager_name,
      tenants_owing: rs.length,
      total_owed: rs.reduce((sum: number, r: Row) => sum + r.owed, 0),
      owed_over_30: rs.reduce((sum: number, r: Row) => sum + (r.owed_over_30 as number), 0),
      action_today: rs.filter((r: Row) => ["text", "call", "notice"].includes(r.next_step)).length,
      notices_suggested: rs.filter((r: Row) => r.next_step === "notice").length,
      slipping: rs.filter((r: Row) => r.label === "slipping").length,
      checks_in_hand: rs.filter((r: Row) => r.hold_until).length,
      open_promises: rs.filter((r: Row) => r.promise_status === "open").length,
      broken_promises: rs.filter((r: Row) => r.promise_status === "broken").length,
    }));
  }

  async install(page: Page) {
    await page.route("**/api/collections/queue", (route: Route) =>
      route.fulfill({ json: { asOf: "2026-09-24", rows: this.rows, summary: this.summary() } }),
    );
    await page.route("**/api/collections/action", async (route: Route) => {
      const body = route.request().postDataJSON() as Record<string, unknown>;
      this.actions.push(body);
      if (this.failNext) {
        this.failNext = false;
        return route.fulfill({ status: 502, json: { error: "database unavailable" } });
      }
      this.applyAction(body);
      return route.fulfill({ json: { id: this.actions.length } });
    });
  }
}

function seed() {
  return new FakeDb([
    row({ occupancy_id: "slip", priority: 144 }),
    row({
      occupancy_id: "old",
      tenant_name: "Bueche, Mark",
      unit: "H - 04",
      owed: 20230,
      owed_over_30: 18975,
      label: "chronic_late",
      next_step: "notice",
      next_step_reason: "Balance over 30 days old - prepare a 14-day pay-or-vacate notice (POV generator in #delinq).",
      priority: 165,
      last_action_at: "2026-09-18T17:00:00Z",
      last_action_type: "call",
    }),
    row({
      occupancy_id: "mail",
      tenant_name: "Honey, Mark",
      property_name: "Legacy Place",
      unit: "31 - B",
      manager_name: "Kelsey Dempsey",
      label: "mail_payer",
      mail_payer: true,
      days_past_deadline: 0,
      next_step: "wait",
      next_step_reason: "Pays by mail; usually in by the 12th.",
      priority: 30,
    }),
    row({
      occupancy_id: "text",
      tenant_name: "Aden, Mahad A.",
      property_name: "Legacy Place",
      unit: "10 - D",
      manager_name: "Kelsey Dempsey",
      label: "steady",
      days_past_deadline: 2,
      owed: 260,
      next_step: "text",
      next_step_reason: "Friendly reminder text.",
      priority: 20,
    }),
  ]);
}

test.describe("Delinquency review - collections queue", () => {
  test("shows today's work, sorted by priority, with the reason for each step", async ({ page }) => {
    const db = seed();
    await db.install(page);
    await page.goto("/delinquency");

    await expect(page.getByTestId("tiles")).toContainText("Tenants owing");
    await expect(page.getByTestId("tiles")).toContainText("4");
    await expect(page.getByTestId("tiles")).toContainText("$23,490");

    const rows = page.getByTestId("queue-row");
    await expect(rows).toHaveCount(3); // "Do today" hides the mail payer who is waiting
    await expect(rows.nth(0)).toContainText("Bueche, Mark");
    await expect(rows.nth(0).getByTestId("step")).toHaveText("Notice");
    await expect(rows.nth(0)).toContainText("$18,975 over 30 days");
    await expect(rows.nth(0)).toContainText("POV generator");
    await expect(rows.nth(1).getByTestId("reason")).toContainText("17 days");

    await page.getByTestId("tab-waiting").click();
    await expect(page.getByTestId("queue-row")).toHaveCount(1);
    await expect(page.getByTestId("queue-row").first()).toContainText("Pays by mail");
  });

  test("manager filter narrows both the list and the tiles", async ({ page }) => {
    const db = seed();
    await db.install(page);
    await page.goto("/delinquency");
    await page.getByTestId("manager-filter").selectOption("Kelsey Dempsey");
    await expect(page.getByTestId("queue-row")).toHaveCount(1);
    await expect(page.getByTestId("queue-row").first()).toContainText("Aden, Mahad");
    await expect(page.getByTestId("tiles")).toContainText("$1,760");
    await page.getByTestId("tab-all").click();
    await expect(page.getByTestId("queue-row")).toHaveCount(2);
  });

  test("a manager works the list: each action is saved with their name and moves the tenant to Waiting", async ({ page }) => {
    const db = seed();
    await db.install(page);
    await page.goto("/delinquency");
    await page.getByTestId("actor").fill("Kelsey");

    // 1. Called the top tenant (the suggested step is highlighted as primary)
    const first = page.getByTestId("queue-row").first();
    await first.getByRole("button", { name: "Called" }).click();
    await expect(page.getByTestId("toast")).toContainText("Logged: Call for Bueche, Mark");
    await expect(page.getByTestId("queue-row")).toHaveCount(2);

    // 2. Check in hand for the slipping tenant, with a note
    await page.getByTestId("queue-row").first().getByRole("button", { name: "Check in hand" }).click();
    const form = page.getByTestId("form-check_in_hand");
    await form.getByPlaceholder(/money order/).fill("MO #4521 received 9/24");
    await form.getByTestId("form-save").click();
    await expect(page.getByTestId("queue-row")).toHaveCount(1);

    // 3. Promise to pay for the last one
    await page.getByTestId("queue-row").first().getByRole("button", { name: "Promise to pay" }).click();
    const promise = page.getByTestId("form-promise");
    await promise.locator('input[name="amount"]').fill("260");
    await promise.locator('input[name="date"]').fill("2030-01-15");
    await promise.getByTestId("form-save").click();
    await expect(page.getByTestId("empty")).toBeVisible();

    // Everything now sits in Waiting with the reasons the database would give
    await page.getByTestId("tab-waiting").click();
    await expect(page.getByTestId("queue-row")).toHaveCount(4);
    await expect(page.getByTestId("queue")).toContainText("Check in hand");
    await expect(page.getByTestId("queue")).toContainText("Promised $260");
    await expect(page.getByTestId("queue")).toContainText('"MO #4521 received 9/24"');

    // The API received exactly what the database function expects
    expect(db.actions).toEqual([
      { occupancy_id: "old", action_type: "call", details: {}, actor: "Kelsey", note: null },
      { occupancy_id: "slip", action_type: "check_in_hand", details: { hold_until: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/) }, actor: "Kelsey", note: "MO #4521 received 9/24" },
      { occupancy_id: "text", action_type: "promise", details: { amount: 260, due_date: "2030-01-15" }, actor: "Kelsey", note: null },
    ]);

    // The name is remembered for next time
    await page.reload();
    await expect(page.getByTestId("actor")).toHaveValue("Kelsey");
  });

  test("a failed save is reported and nothing moves", async ({ page }) => {
    const db = seed();
    db.failNext = true;
    await db.install(page);
    await page.goto("/delinquency");
    await page.getByTestId("queue-row").first().getByRole("button", { name: "Texted" }).click();
    await expect(page.getByTestId("toast")).toContainText("Could not save: database unavailable");
    await expect(page.getByTestId("queue-row")).toHaveCount(3);
  });

  test("excluding a tenant needs a reason and hides them from today's list", async ({ page }) => {
    const db = seed();
    await db.install(page);
    await page.goto("/delinquency");
    await page.getByTestId("queue-row").nth(1).getByRole("button", { name: "Exclude" }).click();
    const form = page.getByTestId("form-exclude");
    await form.getByTestId("form-save").click(); // required field blocks an empty reason
    expect(db.actions).toHaveLength(0);
    await form.getByPlaceholder(/payment plan/).fill("on a plan with Conor");
    await form.getByTestId("form-save").click();
    await expect(page.getByTestId("queue-row")).toHaveCount(2);
    expect(db.actions[0]).toMatchObject({ action_type: "exclude", details: { reason: "on a plan with Conor" } });
  });

  test("a database outage shows an error instead of an empty page", async ({ page }) => {
    await page.route("**/api/collections/queue", (route) => route.fulfill({ status: 502, json: { error: "v_collections_queue: timeout" } }));
    await page.goto("/delinquency");
    await expect(page.getByTestId("load-error")).toContainText("timeout");
  });
});

test.describe("/api/collections/action validation (real route, no database needed)", () => {
  test("rejects bad input before it reaches the database", async ({ request }) => {
    const cases: Array<[Record<string, unknown>, string]> = [
      [{ action_type: "call" }, "occupancy_id is required"],
      [{ occupancy_id: "1", action_type: "shout" }, "action_type must be one of"],
      [{ occupancy_id: "1", action_type: "promise", details: { amount: 100 } }, "due date"],
      [{ occupancy_id: "1", action_type: "promise", details: { amount: 100, due_date: "2000-01-01" } }, "in the past"],
      [{ occupancy_id: "1", action_type: "check_in_hand", details: { hold_until: "soon" } }, "hold_until"],
    ];
    for (const [body, message] of cases) {
      const res = await request.post("/api/collections/action", { data: body });
      expect(res.status(), JSON.stringify(body)).toBe(400);
      expect((await res.json()).error).toContain(message);
    }
    const bad = await request.post("/api/collections/action", { data: "not json", headers: { "Content-Type": "application/json" } });
    expect(bad.status()).toBe(400);
  });
});
