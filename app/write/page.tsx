export const dynamic = "force-dynamic";

export default function WriteEmptyPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center animate-page-in">
      <div className="rounded-xl border border-dashed border-border bg-card/50 p-12 shadow-sm">
        <h2 className="text-xl font-medium tracking-tight mb-2">No file selected</h2>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          Select a file from the explorer on the left to start editing, or create a new one.
        </p>
      </div>
    </div>
  );
}
