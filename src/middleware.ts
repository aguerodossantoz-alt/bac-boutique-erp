import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const isLoginPage = pathname.startsWith("/login");
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  const isLoggedIn = Boolean(token);

  if (!isLoggedIn && !isLoginPage) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL("/catalog", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/reports/:path*",
    "/sales/:path*",
    "/expenses/:path*",
    "/catalog/:path*",
    "/inventory/:path*",
  ],
};
