import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

/** The password the test server runs with (see playwright.config.ts). */
export const TEST_PASSWORD = "test-hub-password";
export const STORAGE_STATE = path.join(__dirname, ".auth", "signed-in.json");

/** Same fingerprint src/lib/auth.ts puts in the cookie. */
export function signedInCookieValue(password = TEST_PASSWORD): string {
  return createHash("sha256").update(`milestone-hub-session:v1:${password}`).digest("hex");
}

/** Writes a signed-in browser state so every test starts past the sign-in page. */
export default async function globalSetup() {
  mkdirSync(path.dirname(STORAGE_STATE), { recursive: true });
  writeFileSync(
    STORAGE_STATE,
    JSON.stringify({
      cookies: [
        {
          name: "milestone_admin",
          value: signedInCookieValue(),
          domain: "localhost",
          path: "/",
          expires: Math.floor(Date.now() / 1000) + 3600,
          httpOnly: true,
          secure: true,
          sameSite: "Lax",
        },
      ],
      origins: [],
    }),
  );
}
