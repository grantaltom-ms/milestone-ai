import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, isSignedIn } from "./lib/auth";

/**
 * Every page and API route needs the Hub password, except the sign-in page itself
 * and the sign-in/sign-out endpoints. Pages redirect to /login; API calls get a 401
 * so the screens can show "signed out" instead of trying to read a login page as data.
 */
function isPublicPath(pathname: string) {
  return pathname === "/login" || pathname.startsWith("/api/auth/");
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (isPublicPath(pathname)) return NextResponse.next();

  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    return new NextResponse("The Hub is locked: ADMIN_PASSWORD is not set in Vercel.", { status: 503 });
  }

  if (await isSignedIn(request.cookies.get(SESSION_COOKIE)?.value, password)) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Signed out - reload the page and sign in." }, { status: 401 });
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.search = "";
  loginUrl.searchParams.set("next", `${pathname}${search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
