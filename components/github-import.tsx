"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { fetchGithubRepos, importGithubRepo } from "@/app/github-actions";
import { Loader2, X } from "lucide-react";
import { Github } from "@/components/icons";
import { useRouter } from "next/navigation";

export function GithubImportButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [repos, setRepos] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [importingId, setImportingId] = useState<number | null>(null);
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

  const handleImport = async (repo: any) => {
    setImportingId(repo.id);
    try {
      const result = await importGithubRepo(repo.fullName, repo.name);
      setOpen(false);
      router.push(`/${result.username}/${result.slug}`);
    } catch (err: any) {
      setError(err.message || "Failed to import");
    } finally {
      setImportingId(null);
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
                <h2 className="text-lg font-semibold">Import GitHub Repository</h2>
                <p className="text-sm text-muted-foreground">Select a repository to import its README.</p>
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
                repos.map((repo) => (
                  <div
                    key={repo.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="overflow-hidden mr-4">
                      <div className="font-medium truncate text-sm" title={repo.name}>{repo.name}</div>
                      {repo.description && (
                        <div className="text-xs text-muted-foreground truncate mt-1" title={repo.description}>
                          {repo.description}
                        </div>
                      )}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleImport(repo)}
                      disabled={importingId === repo.id}
                      className="shrink-0 min-w-[80px]"
                    >
                      {importingId === repo.id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        "Import"
                      )}
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
