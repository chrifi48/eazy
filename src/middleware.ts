import { NextResponse, type NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import { SESSION_COOKIE, verifySession } from "@/lib/backend/session";

const intl = createIntlMiddleware(routing);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    const session = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);
    const isAdmin = session?.role === "admin";
    if (pathname === "/admin/login") return isAdmin ? NextResponse.redirect(new URL("/admin", request.url)) : NextResponse.next();
    return isAdmin ? NextResponse.next() : NextResponse.redirect(new URL("/admin/login", request.url));
  }
  return intl(request);
}

export const config = { matcher: ["/admin/:path*", "/((?!api|_next|_vercel|.*\\..*).*)"] };
