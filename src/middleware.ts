import { NextRequest, NextResponse } from "next/server";

function hasSessionToken(req: NextRequest) {
  const cookieNames = [
    "authjs.session-token",
    "__Secure-authjs.session-token",
    "next-auth.session-token",
    "__Secure-next-auth.session-token",
  ];

  return cookieNames.some((name) => {
    const value = req.cookies.get(name)?.value;
    return Boolean(value);
  });
}

export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const isLoggedIn = hasSessionToken(req);
  const isLoginPage = pathname.startsWith("/login");

  if (!isLoggedIn && !isLoginPage) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL("/reports", req.url));
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