import { auth } from "@/auth";
import { NextResponse } from "next/server";

export const proxy = auth((req) => {
  const isProtected =
    req.nextUrl.pathname.startsWith("/cart") ||
    req.nextUrl.pathname.startsWith("/checkout") ||
    req.nextUrl.pathname.startsWith("/orders");

  if (isProtected && !req.auth) {
    const signInUrl = new URL("/auth/signin", req.url);
    signInUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
