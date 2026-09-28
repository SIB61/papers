import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();

  const hostname = request.headers.get("host") || "";

  if (hostname.endsWith(".mappe.page")) {
    const baseDomain = "mappe.page";

    // Extract the subdomain (e.g., "sabit.mappe.page" -> "sabit")
    const subdomain = hostname.replace(`.${baseDomain}`, "");

    // Ignore 'www' subdomain (root domain 'mappe.page' is already skipped by endsWith)
    if (subdomain && subdomain !== "www") {

      // If the path already starts with the username, redirect to remove it to keep the URL clean
      // (e.g., sabit.mappe.page/sabit/cv -> sabit.mappe.page/cv)
      if (url.pathname === `/${subdomain}` || url.pathname.startsWith(`/${subdomain}/`)) {
        url.pathname = url.pathname.replace(new RegExp(`^\\/${subdomain}`), "") || "/";
        return NextResponse.redirect(url);
      }

      // Rewrite the URL to route through your /[username] app directory
      url.pathname = `/${subdomain}${url.pathname}`;
      return NextResponse.rewrite(url);
    }
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
