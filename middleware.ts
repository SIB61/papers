import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const hostname = request.headers.get("host") || "";

  if (hostname === "sabit.com.bd" || hostname === "www.sabit.com.bd") {
    // If the path already starts with /sabit, redirect to remove it to keep the URL clean
    // (e.g., sabit.com.bd/sabit/anything -> sabit.com.bd/anything)
    if (url.pathname === "/sabit" || url.pathname.startsWith("/sabit/")) {
      url.pathname = url.pathname.replace(/^\/sabit/, "") || "/";
      return NextResponse.redirect(url);
    }

    url.pathname = `/sabit${url.pathname}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
