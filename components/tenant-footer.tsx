import Link from "next/link";

export function TenantFooter() {
  return (
    <footer className="no-print border-t border-border">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-2 px-5 py-6 text-xs text-muted-foreground">
        <span>
          Powered by{" "}
          <Link href="/" className="underline underline-offset-4 transition-colors hover:text-foreground">
            papers.io
          </Link>
        </span>
        <span>{new Date().getFullYear()}</span>
      </div>
    </footer>
  );
}