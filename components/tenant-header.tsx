import Link from "next/link";
import { PenLine } from "lucide-react";
import type { User } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { UserMenu } from "@/components/user-menu";

export async function TenantHeader({ user }: { user: User }) {
  const session = await getSessionUser();
  const isOwner = session?.id === user.id;

  return (
    <header className="no-print sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-5">
        <Link
          href={`/${user.username}`}
          className="group flex items-center gap-2 text-sm font-semibold tracking-tight"
        >
          <span className="grid size-6 place-items-center overflow-hidden rounded-md border border-foreground font-bold text-foreground">
            {(user.name || user.username).slice(0, 1).toUpperCase()}
          </span>
          <span className="max-w-48 truncate">{user.name || user.username}</span>
        </Link>

        <nav className="flex items-center gap-1 text-sm">
          <Link
            href={`/${user.username}`}
            className="rounded-lg px-2.5 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            index
          </Link>
          {isOwner && (
            <Link
              href="/write"
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <PenLine className="size-3.5" />
              write
            </Link>
          )}
          <span className="mx-1 h-4 w-px bg-border" />
          <ThemeSwitcher />
          {isOwner && session && (
            <UserMenu
              user={{
                name: session.name,
                email: session.email,
                image: session.image,
                username: session.username,
              }}
            />
          )}
        </nav>
      </div>
    </header>
  );
}