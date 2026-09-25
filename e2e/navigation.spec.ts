import { test, expect } from "@playwright/test";

/**
 * Every link in the sidebar must lead to a page that exists. (The pages themselves read
 * Supabase on the server, which the test server fakes, so this checks the routes are
 * there, not their data.)
 */
test("every sidebar link goes to a real page", async ({ page, request }) => {
  test.setTimeout(240_000); // the dev server compiles each page on its first visit
  await page.route("**/api/collections/queue", (route) =>
    route.fulfill({ json: { asOf: "2026-09-25", rows: [], summary: [] } }),
  );
  await page.goto("/delinquency");
  const hrefs = await page.locator("aside nav a").evaluateAll((links) =>
    links.map((a) => (a as HTMLAnchorElement).getAttribute("href") ?? ""),
  );
  expect(hrefs).toEqual(
    expect.arrayContaining([
      "/",
      "/delinquency",
      "/delinquency-dashboard",
      "/collections",
      "/receivables",
      "/daily-digest",
      "/financials",
      "/asset-watch",
      "/vacancy",
      "/manager-scorecards",
      "/pov-notices",
      "/reports",
    ]),
  );
  for (const href of hrefs) {
    const res = await request.get(href, { maxRedirects: 0 });
    expect(res.status(), href).not.toBe(404);
    expect(res.status(), `${href} should not bounce a signed-in user to /login`).not.toBe(307);
  }
});
