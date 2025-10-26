import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const token = req.cookies.get("token")?.value;
  const merchant_id = req.cookies.get("merchant_id")?.value;
  if (pathname === "/login" && merchant_id && token) {
    return NextResponse.redirect(new URL("/", req.url));
  }
  if (
    pathname === "/login" ||
    pathname === "/api/login" ||
    pathname.startsWith("/api/file") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/logo") ||
    pathname.startsWith("/bg")
  )
    return NextResponse.next();

  if (!token || !merchant_id) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|favicon.ico).*)"],
};
