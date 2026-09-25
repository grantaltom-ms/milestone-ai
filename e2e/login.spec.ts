import { test, expect, type Page } from "@playwright/test";
import { TEST_PASSWORD, signedInCookieValue } from "./global-setup";

/**
 * The Hub's front door. These tests start signed out (the rest of the suite starts
 * signed in) and check that nothing - pages or the tenant data behind them - is
 * reachable without the password, and that signing in and out works repeatedly.
 */
test.use({ storageState: { cookies: [], origins: [] } });

async function mockEmptyQueue(page: Page) {
  await page.route("**/api/collections/queue", (route) =>
    route.fulfill({ json: { asOf: "2026-09-25", rows: [], summary: [] } }),
  );
}

async function signIn(page: Page, password: string) {
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
}

test.describe("Hub sign-in", () => {
  test("signed out: every page sends you to sign in, with no navigation showing", async ({ page }) => {
    for (const path of ["/", "/delinquency", "/pov-notices", "/reports"]) {
      await page.goto(path);
      await expect(page).toHaveURL(`/login?next=${encodeURIComponent(path)}`);
      await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
      await expect(page.getByRole("link", { name: "Delinquency review" })).toHaveCount(0);
    }
  });

  test("signed out: the tenant data behind the pages is locked too", async ({ request }) => {
    const queue = await request.get("/api/collections/queue");
    expect(queue.status()).toBe(401);
    expect(await queue.text()).not.toContain("occupancy_id");

    // A well-formed action is refused before it reaches validation or the database.
    const action = await request.post("/api/collections/action", {
      data: { occupancy_id: "1", action_type: "call" },
    });
    expect(action.status()).toBe(401);
  });

  test("wrong password is refused; the right one opens the page you asked for and stays open", async ({ page }) => {
    await mockEmptyQueue(page);
    await page.goto("/delinquency");

    await signIn(page, "not-the-password");
    await expect(page.getByTestId("login-error")).toContainText("isn't right");
    await expect(page).toHaveURL(/\/login/);

    await signIn(page, TEST_PASSWORD);
    await expect(page).toHaveURL("/delinquency");
    await expect(page.getByRole("heading", { name: "Delinquency review" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();

    await page.reload();
    await expect(page).toHaveURL("/delinquency");
  });

  test("sign out locks the Hub again, and it works over and over", async ({ page }) => {
    await mockEmptyQueue(page);
    for (let round = 1; round <= 3; round++) {
      await page.goto("/delinquency");
      await expect(page).toHaveURL(/\/login/);
      await signIn(page, TEST_PASSWORD);
      await expect(page).toHaveURL("/delinquency");

      await page.getByRole("button", { name: "Sign out" }).click();
      await expect(page).toHaveURL("/login");
    }
  });

  test("a made-up or outdated sign-in cookie doesn't get in", async ({ page, context }) => {
    for (const value of ["garbage", signedInCookieValue("an-old-password"), ""]) {
      await context.clearCookies();
      await context.addCookies([{ name: "milestone_admin", value, domain: "localhost", path: "/" }]);
      await page.goto("/delinquency");
      await expect(page).toHaveURL(/\/login/);
    }
  });

  test("the sign-in page can't be used to bounce people to another website", async ({ page }) => {
    await page.goto("/login?next=//evil.example/steal");
    await signIn(page, TEST_PASSWORD);
    // Wait until we've left the sign-in page, wherever we ended up.
    await page.waitForURL((url) => url.origin !== "http://localhost:3100" || url.pathname !== "/login");
    const landed = new URL(page.url());
    expect(landed.origin).toBe("http://localhost:3100");
    expect(landed.pathname).toBe("/");
  });

  test("the sign-in endpoint rejects empty and wrong passwords", async ({ request }) => {
    for (const data of [{}, { password: "" }, { password: "nope" }, { password: 12345 }]) {
      const res = await request.post("/api/auth/login", { data });
      expect(res.status(), JSON.stringify(data)).toBe(401);
      expect(res.headers()["set-cookie"] ?? "").not.toContain("milestone_admin=");
    }
  });
});
