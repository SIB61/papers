import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { isThemeId, defaultTheme } from "@/lib/themes";
import { TenantHeader } from "@/components/tenant-header";
import { TenantFooter } from "@/components/tenant-footer";
import { TailwindCdn } from "@/components/tailwind-cdn";
import { CustomCursor } from "@/components/custom-cursor";

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
      <TailwindCdn />
      <CustomCursor />
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
  const description = `${name}'s blog on portfolioo`;
  const url = `https://${username}.portfolioo.site`;
  
  return {
    metadataBase: new URL("https://portfolioo.site"),
    title: name,
    description,
    openGraph: {
      title: name,
      description,
      url,
      type: "profile",
      siteName: name,
      images: user.image ? [{ url: user.image }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: name,
      description,
      creator: user.twitter || undefined,
      images: user.image ? [user.image] : undefined,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}