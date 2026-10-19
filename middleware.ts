import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/constants";
import { readSession } from "@/lib/session";

const PUBLIC_PATHS = ["/login", "/forgot-password", "/reset-password", "/unauthorized", "/sso"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".") ||
    PUBLIC_PATHS.some((p) => pathname.startsWith(p))
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = await readSession(token);

  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // /super-admin/* is exclusively for super-admins.
  if (pathname.startsWith("/super-admin") && session.role !== "super_admin") {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  // /t/<slug>/<area>/* is tenant-scoped. Two areas: "admin" and "employee".
  if (pathname.startsWith("/t/")) {
    const segments = pathname.split("/"); // ["", "t", "<slug>", "<area>", …]
    const requestedSlug = segments[2];
    const area = segments[3];

    // Super-admins don't have a tenant context — block them out of /t/* entirely.
    if (session.role === "super_admin") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    // Tenant lock: a tenant-scoped user can only see their own tenant.
    if (session.tenantSlug && requestedSlug && requestedSlug !== session.tenantSlug) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    // Area gate.
    if (area === "admin" && session.role !== "admin") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
    if (area === "employee" && session.role !== "employee") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
