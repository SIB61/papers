import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { GoogleSignInButton } from "@/components/sign-in-button";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const session = await getSessionUser();
  if (session) redirect("/write");

  const query = await searchParams;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-5">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            back to papers
          </Link>
          <ThemeSwitcher />
        </div>
      </header>

      <main className="grid flex-1 place-items-center px-5 py-16">
        <div className="animate-page-in w-full max-w-sm text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-xl border border-foreground text-lg font-bold">
            *
          </div>
          <h1 className="mt-6 text-3xl font-bold tracking-tight">Your papers desk</h1>
          <p className="mt-2 text-muted-foreground">
            Sign in to write pages, edit drafts, and keep your workspace private.
          </p>

          {query.error === "google" && (
            <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              Google sign-in failed. Please try again.
            </p>
          )}

          <div className="mt-8">
            <GoogleSignInButton callbackURL="/write" />
          </div>

          <p className="mt-8 text-xs leading-relaxed text-muted-foreground">
            Your desk is private to you. Readers can only see pages you mark{" "}
            <b className="text-foreground">Published</b>.
          </p>
        </div>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-6 text-xs text-muted-foreground">
          <span>papers · a markdown blog</span>
          <span>{new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
}