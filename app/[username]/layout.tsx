import type { Metadata } from "next";
import Script from "next/script";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { isThemeId, defaultTheme } from "@/lib/themes";
import { TenantHeader } from "@/components/tenant-header";
import { TenantFooter } from "@/components/tenant-footer";

export const dynamic = "force-dynamic";

export default async function UsernameLayout({
  children,
  params,
}: LayoutProps<"/[username]">) {
  const { username } = await params;
  const user = (
    await db.select().from(users).where(eq(users.username, username)).limit(1)
  )[0];
  if (!user) notFound();

  const theme = isThemeId(user.siteTheme) ? user.siteTheme : defaultTheme;

  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){try{if(!localStorage.getItem("theme")){document.documentElement.setAttribute("data-theme","${theme}");}}catch(e){}})();`,
        }}
      />
      <Script
        src="https://cdn.tailwindcss.com"
        strategy="afterInteractive"
        onLoad={() => {
          const tailwindGlobal = window as unknown as {
            tailwind?: { config?: unknown };
          };
          if (tailwindGlobal.tailwind) {
            tailwindGlobal.tailwind.config = {
              corePlugins: { preflight: false },
              important: ".blog-body",
            };
          }
        }}
      />
      <TenantHeader user={user} />
      {children}
      <TenantFooter />
    </>
  );
}

export async function generateMetadata({
  params,
}: PageProps<"/[username]">): Promise<Metadata> {
  const { username } = await params;
  const user = (
    await db.select().from(users).where(eq(users.username, username)).limit(1)
  )[0];
  if (!user) return {};
  const name = user.name || user.username;
  return {
    title: name,
    description: `${name}'s blog on papers`,
  };
}