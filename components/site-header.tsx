import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { UserMenu } from "@/components/user-menu";

export async function SiteHeader() {
  const session = await getSessionUser();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-5">
        <Link
          href="/"
          className="group flex items-center gap-2 text-sm font-semibold tracking-tight"
        >
          <span className="grid size-6 place-items-center rounded-md border border-foreground text-[11px] font-bold text-foreground transition-transform duration-300 group-hover:rotate-6">
            *
          </span>
          <span>papers</span>
        </Link>

        <nav className="flex items-center gap-1 text-sm">
          <Link
            href="/"
            className="hidden rounded-lg px-2.5 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:block"
          >
            index
          </Link>
          <Link
            href="/write"
            className="rounded-lg px-2.5 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            write
          </Link>
          <span className="mx-1 h-4 w-px bg-border" />
          <ThemeSwitcher />
          <UserMenu
            user={
              session
                ? { name: session.name, email: session.email, image: session.image, username: session.username }
                : null
            }
          />
        </nav>
      </div>
    </header>
  );
}