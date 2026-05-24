import { NextResponse } from "next/server";

export function middleware(request: any) {
  const token = request.cookies.get("refresh_token")?.value;
  const { pathname } = request.nextUrl;
  if (!token && pathname !== "/") {
    return NextResponse.redirect(new URL("/", request.url));
  }
  if (token && pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/dashboard",
    "/shipments",
    "/users",
    "/vehicles",
    "/licenses",
    "/licenses/:path*",
    "/companies",
    "/companies/:path*",
    "/contracts",
    "/contracts/:path*",
    "/mineral-types",
    "/mineral-types/:path*",
    "/auctions",
    "/auctions/:path*",
    "/reports",
    "/users/:path*",
    "/roles",
    "/profile",
  ],
};
