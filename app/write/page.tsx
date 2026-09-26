"use client";

import { useSidebar } from "@/components/write/sidebar-context";
import { Menu } from "lucide-react";

export default function WriteEmptyPage() {
  const { setMobileOpen } = useSidebar();
  
  return (
    <div className="flex h-full flex-col animate-page-in">
      <header className="md:hidden sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="flex h-16 items-center gap-2 px-4">
          <button
            onClick={() => setMobileOpen(true)}
            className="flex items-center justify-center p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
            title="Open explorer"
          >
            <Menu className="size-5" />
          </button>
          <span className="font-semibold text-sm">Explorer</span>
        </div>
      </header>
      <div className="flex flex-1 items-center justify-center p-8 text-center">
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-12 shadow-sm">
          <h2 className="text-xl font-medium tracking-tight mb-2">No file selected</h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Select a file from the explorer to start editing, or create a new one.
          </p>
        </div>
      </div>
    </div>
  );
}
