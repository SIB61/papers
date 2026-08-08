"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Palette } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { themes } from "@/lib/themes";
import { cn } from "@/lib/utils";

export function ThemeSwitcher({
  align = "right",
}: {
  align?: "left" | "center" | "right";
}) {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const alignClass =
    align === "left"
      ? "left-0 origin-top-left"
      : align === "right"
        ? "right-0 origin-top-right"
        : "left-1/2 origin-top -translate-x-1/2";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          "flex items-center gap-2 rounded-[var(--radius-md)] border border-border bg-background px-2.5 py-1.5 text-sm transition-colors hover:bg-muted",
          open && "bg-muted",
        )}
      >
        <span className="flex -space-x-1">
          {themes.slice(0, 3).map((t) => (
            <span
              key={t.id}
              className="size-3 rounded-full ring-2 ring-background"
              style={{ backgroundColor: t.swatches[0] }}
            />
          ))}
        </span>
        <Palette className="size-4 opacity-70" />
      </button>

      {open && (
        <div
          role="menu"
          className={cn(
            "absolute z-50 mt-2 w-60 rounded-xl border border-border bg-popover p-1.5 shadow-xl animate-pop-in",
            alignClass,
          )}
        >
          <p className="px-2.5 pb-1 pt-1.5 text-[0.7rem] uppercase tracking-widest text-muted-foreground">
            Theme
          </p>
          {themes.map((t) => (
            <button
              key={t.id}
              type="button"
              role="menuitemradio"
              aria-checked={theme === t.id}
              onClick={() => {
                setTheme(t.id);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors",
                theme === t.id
                  ? "bg-muted"
                  : "hover:bg-muted/60",
              )}
            >
              <span className="flex h-6 w-9 shrink-0 overflow-hidden rounded-md border border-border">
                <span className="flex-1" style={{ backgroundColor: t.swatches[0] }} />
                <span className="flex-1" style={{ backgroundColor: t.swatches[1] }} />
              </span>
              <span className="flex-1">
                <span className="block text-sm font-medium">{t.name}</span>
                <span className="block text-xs text-muted-foreground">{t.description}</span>
              </span>
              {theme === t.id && <Check className="size-4" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}