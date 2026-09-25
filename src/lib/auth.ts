/**
 * Shared-password gate for the Hub.
 *
 * One password (ADMIN_PASSWORD in Vercel) opens the Hub. Signing in stores a cookie
 * holding a fingerprint of that password, and src/middleware.ts checks the fingerprint
 * on every request. Changing ADMIN_PASSWORD signs everyone out.
 *
 * Uses Web Crypto only, so the same code runs in middleware (edge) and route handlers.
 */

export const SESSION_COOKIE = "milestone_admin";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

// Changing this string also signs everyone out; bump it if a cookie ever leaks.
const SESSION_SALT = "milestone-hub-session:v1:";

export async function sessionToken(password: string): Promise<string> {
  const data = new TextEncoder().encode(SESSION_SALT + password);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/** Compares two strings without leaking how many leading characters matched. */
export function safeEqual(a: string, b: string): boolean {
  const len = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < len; i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

/** Only same-site paths: "/delinquency" yes; "//evil.com", "/\\evil.com", "https://..." no. */
export function safeNextPath(raw: unknown): string {
  if (typeof raw !== "string") return "/";
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return "/";
  if (raw.startsWith("/login") || raw.startsWith("/api/auth")) return "/";
  return raw;
}

export async function isSignedIn(cookieValue: string | undefined, password: string): Promise<boolean> {
  if (!cookieValue) return false;
  return safeEqual(cookieValue, await sessionToken(password));
}
