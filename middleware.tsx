import { NextResponse } from "next/server";

export function middleware(request: any) {
  const token = request.cookies.get("access_token");
  if (!token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard"],
};
