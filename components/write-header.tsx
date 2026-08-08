import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { UserMenu } from "@/components/user-menu";

export async function WriteHeader() {
  const session = await getSessionUser();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
        <div className="flex items-center gap-2 text-sm font-semibold tracking-tight">
          <ModalStar className="size-4" />
          <span>papers / write</span>
          {session && (
            <span className="ml-1 hidden max-w-40 truncate rounded-md border border-border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground sm:inline">
              {session.name}&apos;s desk
            </span>
          )}
        </div>
        <nav className="flex items-center gap-1 text-sm">
          <Link
            href="/"
            className="rounded-lg px-2.5 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            index
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

function ModalStar({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="1" y="1" width="22" height="22" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M12 5 13.6 10.4 19 12l-5.4 1.6L12 19l-1.6-5.4L5 12l5.4-1.6Z" fill="currentColor" />
    </svg>
  );
}