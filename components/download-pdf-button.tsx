"use client";

import { Download } from "lucide-react";

export function DownloadPdfButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-xs transition-colors hover:bg-muted"
    >
      <Download className="size-3.5" />
      PDF
    </button>
  );
}