import { defineConfig, devices } from "@playwright/test";
import { STORAGE_STATE, TEST_PASSWORD } from "./e2e/global-setup";

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: "list",
  // Every test starts signed in; e2e/login.spec.ts opts out to test the lock itself.
  use: { baseURL: "http://localhost:3100", trace: "on-first-retry", storageState: STORAGE_STATE },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: {
          ...(process.env.CI ? {} : { executablePath: "/opt/pw-browsers/chromium" }),
        },
      },
    },
  ],
  webServer: {
    // Fake Supabase credentials: every test mocks the /api/collections/* routes in the
    // browser, and the route-level tests only exercise validation, which never reaches Supabase.
    command: `ADMIN_PASSWORD=${TEST_PASSWORD} SUPABASE_URL=http://supabase.invalid SUPABASE_SERVICE_ROLE_KEY=test npx next dev -p 3100`,
    url: "http://localhost:3100/login",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
