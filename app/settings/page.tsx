import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth";
import { SiteThemePicker } from "@/components/site-theme-picker";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { SocialLinksForm } from "@/components/social-links-form";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await getSessionUser();
  if (!session) redirect("/login");

  const user = (await db.select().from(users).where(eq(users.id, session.id)).limit(1))[0];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-5">
          <Link
            href="/write"
            className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            back to desk
          </Link>
          <ThemeSwitcher />
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-5">
        <div className="animate-page-in py-12">
          <h1 className="text-3xl font-bold tracking-tight">Site settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your site lives at{" "}
            <a
              href={`/${session.username}`}
              className="font-mono underline underline-offset-4 hover:text-foreground"
            >
              /{session.username}
            </a>
            . This is the theme visitors see first — they can switch it.
          </p>

          <div className="mt-10 grid gap-8">
            <section className="rounded-xl border border-border bg-card p-6 text-card-foreground shadow-sm">
              <div className="mb-6">
                <h2 className="text-lg font-semibold tracking-tight">Social Profiles</h2>
                <p className="text-sm text-muted-foreground">Add links to your social media accounts to display them on your public page.</p>
              </div>
              <SocialLinksForm user={user} />
            </section>

            <section className="rounded-xl border border-border bg-card p-6 text-card-foreground shadow-sm">
              <div className="mb-6">
                <h2 className="text-lg font-semibold tracking-tight">Default Theme</h2>
                <p className="text-sm text-muted-foreground">Choose the default theme visitors will see when they first arrive.</p>
              </div>
              <SiteThemePicker siteTheme={user?.siteTheme ?? "paper"} />
            </section>
          </div>
        </div>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-6 text-xs text-muted-foreground">
          <span>papers · site settings</span>
          <span>{new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
}