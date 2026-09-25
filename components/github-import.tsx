"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { fetchGithubRepos, importGithubReposBatch } from "@/app/github-actions";
import { Loader2, X, CheckSquare, Square } from "lucide-react";
import { Github } from "@/components/icons";
import { useRouter } from "next/navigation";

export function GithubImportButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [repos, setRepos] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isImporting, setIsImporting] = useState(false);
  const router = useRouter();

  const handleOpen = async () => {
    setOpen(true);
    if (repos.length === 0) {
      setLoading(true);
      setError("");
      try {
        const data = await fetchGithubRepos();
        setRepos(data);
      } catch (err: any) {
        setError(err.message || "Failed to load repos");
      } finally {
        setLoading(false);
      }
    }
  };

  const toggleSelection = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleImportBatch = async () => {
    if (selectedIds.size === 0) return;
    setIsImporting(true);
    try {
      const selectedRepos = repos.filter((r) => selectedIds.has(r.id));
      const result = await importGithubReposBatch(selectedRepos);
      setOpen(false);
      setSelectedIds(new Set());
      router.push(`/${result.username}`);
    } catch (err: any) {
      setError(err.message || "Failed to import");
    } finally {
      setIsImporting(false);
    }
  };

  const selectAll = () => {
    if (selectedIds.size === repos.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(repos.map((r) => r.id)));
    }
  };

  return (
    <>
      <Button variant="outline" className="gap-2" onClick={handleOpen}>
        <Github className="size-4" />
        Import from GitHub
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-background border rounded-xl shadow-lg flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h2 className="text-lg font-semibold">Import GitHub Repositories</h2>
                <p className="text-sm text-muted-foreground">Select repositories to import their README files.</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                <X className="size-4" />
              </Button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {error && <div className="text-sm text-destructive p-3 bg-destructive/10 rounded-md border border-destructive/20">{error}</div>}
              
              {loading ? (
                <div className="flex items-center justify-center p-12">
                  <Loader2 className="size-8 animate-spin text-muted-foreground" />
                </div>
              ) : repos.length === 0 && !error ? (
                <div className="text-center text-sm text-muted-foreground p-12 border border-dashed rounded-lg">
                  No repositories found.
                </div>
              ) : (
                <>
                  <div className="flex justify-end pb-2">
                    <Button variant="ghost" size="sm" onClick={selectAll} className="text-xs h-8">
                      {selectedIds.size === repos.length ? "Deselect All" : "Select All"}
                    </Button>
                  </div>
                  {repos.map((repo) => (
                    <div
                      key={repo.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => toggleSelection(repo.id)}
                    >
                      <div className="overflow-hidden mr-4">
                        <div className="font-medium truncate text-sm" title={repo.name}>{repo.name}</div>
                        {repo.description && (
                          <div className="text-xs text-muted-foreground truncate mt-1" title={repo.description}>
                            {repo.description}
                          </div>
                        )}
                      </div>
                      <div className="shrink-0 text-muted-foreground">
                        {selectedIds.has(repo.id) ? (
                          <CheckSquare className="size-5 text-primary" />
                        ) : (
                          <Square className="size-5" />
                        )}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
            
            {!loading && repos.length > 0 && (
              <div className="p-4 border-t flex items-center justify-between bg-muted/20">
                <div className="text-sm text-muted-foreground">
                  {selectedIds.size} selected
                </div>
                <Button 
                  onClick={handleImportBatch} 
                  disabled={selectedIds.size === 0 || isImporting}
                  className="min-w-[120px]"
                >
                  {isImporting ? (
                    <><Loader2 className="size-4 mr-2 animate-spin" /> Importing...</>
                  ) : (
                    "Import Selected"
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
