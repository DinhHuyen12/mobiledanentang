import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ADMIN_ROLE_ID = 1;
const LECTURER_ROLE_ID = 2;

function parseTokenRole(token?: string) {
  if (!token) {
    return null;
  }

  try {
    const payload = token.split(".")[1];
    if (!payload) {
      return null;
    }

    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = atob(normalized);
    const data = JSON.parse(decoded) as { role?: number };
    return Number(data.role);
  } catch {
    return null;
  }
}

export function proxy(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value;

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = parseTokenRole(token);
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/admin") && role !== ADMIN_ROLE_ID) {
    const destination = role === LECTURER_ROLE_ID ? "/lecturer" : "/student";
    return NextResponse.redirect(new URL(destination, request.url));
  }

  if (pathname.startsWith("/lecturer") && role !== LECTURER_ROLE_ID) {
    const destination = role === ADMIN_ROLE_ID ? "/admin/dashboard" : "/student";
    return NextResponse.redirect(new URL(destination, request.url));
  }

  if (pathname.startsWith("/student") && role !== 3) {
    const destination = role === ADMIN_ROLE_ID ? "/admin/dashboard" : "/lecturer";
    return NextResponse.redirect(new URL(destination, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/student/:path*", "/lecturer/:path*"],
};
