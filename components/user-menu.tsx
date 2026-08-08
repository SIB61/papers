"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChevronDown, Globe, LogOut, PenLine, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";

export interface UserMenuUser {
  name: string;
  email: string;
  image: string;
  username?: string;
}

export function UserMenu({ user }: { user: UserMenuUser | null }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!user) {
    return (
      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted"
      >
        Sign in
      </Link>
    );
  }

  const initial = (user.name || user.email).slice(0, 1).toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          "flex items-center gap-2 rounded-lg border border-border py-1 pl-1 pr-2 text-sm transition-colors hover:bg-muted",
          open && "bg-muted",
        )}
      >
        <span className="grid size-7 place-items-center overflow-hidden rounded-md bg-secondary text-xs font-semibold">
          {user.image ? (
            <Image src={user.image} alt="" width={28} height={28} className="size-7 object-cover" unoptimized />
          ) : (
            initial
          )}
        </span>
        <span className="hidden max-w-28 truncate font-medium sm:block">{user.name}</span>
        <ChevronDown className={cn("size-3.5 opacity-60 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-60 rounded-xl border border-border bg-popover p-1.5 shadow-xl animate-pop-in"
        >
          <div className="px-2.5 pb-2 pt-1.5">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
          <div className="mb-1 h-px bg-border" />
          <Link
            href="/write"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-muted"
          >
            <PenLine className="size-4 opacity-70" />
            Your desk
          </Link>
          {user.username && (
            <Link
              href={`/${user.username}`}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-muted"
            >
              <Globe className="size-4 opacity-70" />
              Your site
            </Link>
          )}
          <Link
            href="/settings"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-muted"
          >
            <Settings className="size-4 opacity-70" />
            Settings
          </Link>
          <div className="mb-1 h-px bg-border" />
          <button
            type="button"
            role="menuitem"
            onClick={async () => {
              setOpen(false);
              await authClient.signOut();
              router.refresh();
            }}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition-colors hover:bg-muted"
          >
            <LogOut className="size-4 opacity-70" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}