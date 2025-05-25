import { NextResponse } from "next/server";

export function middleware(request: any) {
  const token = request.cookies.get("access_token");
  const { pathname } = request.nextUrl;
  if (!token && pathname !== "/") {
    return NextResponse.redirect(new URL("/", request.url));
  } else if (token && pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/dashboard", "/shipments", "/users", "/vehicles"],
};
