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
    "/office-archive",
  ],
};
