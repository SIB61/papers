import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { UserMenu } from "@/components/user-menu";

export async function LandingHeader() {
  const session = await getSessionUser();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link href="/" className="group flex items-center gap-2 text-sm font-semibold tracking-tight">
          <span className="grid size-6 place-items-center rounded-md border border-foreground text-[11px] font-bold text-foreground transition-transform duration-300 group-hover:rotate-6">
            *
          </span>
          <span>papers</span>
        </Link>

        <nav className="flex items-center gap-1 text-sm">
          <ThemeSwitcher />
          {session ? (
            <UserMenu
              user={{
                name: session.name,
                email: session.email,
                image: session.image,
                username: session.username,
              }}
            />
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-sm font-medium text-primary-foreground transition-all hover:opacity-85 active:translate-y-px"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}