"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { themes, isThemeId, type ThemeId } from "@/lib/themes";
import { useTheme } from "@/components/theme-provider";
import { updateSiteTheme } from "@/app/actions";
import { cn } from "@/lib/utils";

export function SiteThemePicker({ siteTheme }: { siteTheme: string }) {
  const { setTheme } = useTheme();
  const [selected, setSelected] = useState<ThemeId>(
    isThemeId(siteTheme) ? siteTheme : "paper",
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function choose(id: ThemeId) {
    setSelected(id);
    setTheme(id);
    setSaving(true);
    setError(null);
    try {
      await updateSiteTheme(id);
    } catch {
      setError("Couldn't save — try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {themes.map((t) => {
          const active = selected === t.id;
          return (
            <button
              key={t.id}
              type="button"
              disabled={saving}
              onClick={() => void choose(t.id)}
              aria-pressed={active}
              className={cn(
                "group flex items-start gap-3 rounded-xl border p-4 text-left transition-all",
                active
                  ? "border-foreground bg-muted"
                  : "border-border hover:bg-muted/50",
              )}
            >
              <span className="flex h-10 w-14 shrink-0 overflow-hidden rounded-lg border border-border">
                <span className="flex-1" style={{ backgroundColor: t.swatches[0] }} />
                <span className="flex-1" style={{ backgroundColor: t.swatches[1] }} />
              </span>
              <span className="flex-1">
                <span className="flex items-center gap-2 text-sm font-semibold">
                  {t.name}
                  {active && <Check className="size-3.5" />}
                  {t.light ? (
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      light
                    </span>
                  ) : (
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      dark
                    </span>
                  )}
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {t.description}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex min-h-5 items-center gap-2 text-sm">
        {saving && (
          <span className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Saving…
          </span>
        )}
        {!saving && !error && selected && (
          <span className="text-muted-foreground">
            Visitors to <b className="text-foreground">/…{""}</b> will see{" "}
            {themes.find((t) => t.id === selected)?.name} first, and can switch.
          </span>
        )}
        {error && <span className="text-destructive">{error}</span>}
      </div>
    </div>
  );
}