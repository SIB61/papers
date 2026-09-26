"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { fetchMediumBlogs, importMediumBlogsBatch } from "@/app/medium-actions";
import { Loader2, X, CheckSquare, Square, BookOpen } from "lucide-react";
import { useRouter } from "next/navigation";

export function MediumImportButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [blogs, setBlogs] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isImporting, setIsImporting] = useState(false);
  const [pathPrefix, setPathPrefix] = useState("articles");
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const handleOpen = async () => {
    setOpen(true);
    if (blogs.length === 0) {
      setLoading(true);
      setError("");
      try {
        const data = await fetchMediumBlogs();
        setBlogs(data);
      } catch (err: any) {
        setError(err.message || "Failed to load blogs");
      } finally {
        setLoading(false);
      }
    }
  };

  const toggleSelection = (blog: any) => {
    if (blog.isImported) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(blog.id)) next.delete(blog.id);
      else next.add(blog.id);
      return next;
    });
  };

  const handleImportBatch = async () => {
    if (selectedIds.size === 0) return;
    setIsImporting(true);
    try {
      const selectedBlogs = blogs.filter((r) => selectedIds.has(r.id));
      const result = await importMediumBlogsBatch(selectedBlogs, pathPrefix || "articles");
      setOpen(false);
      setSelectedIds(new Set());
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to import");
    } finally {
      setIsImporting(false);
    }
  };

  const selectAll = () => {
    if (selectedIds.size === blogs.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(blogs.map((r) => r.id)));
    }
  };

  return (
    <>
      <Button variant="outline" className="gap-2 h-9" size="sm" onClick={handleOpen}>
        <BookOpen className="size-4" />
        Import from Medium
      </Button>

      {open && mounted && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-background border rounded-xl shadow-lg flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h2 className="text-lg font-semibold">Import Medium Blogs</h2>
                <p className="text-sm text-muted-foreground">Select blogs to import as regular posts.</p>
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
              ) : blogs.length === 0 && !error ? (
                <div className="text-center text-sm text-muted-foreground p-12 border border-dashed rounded-lg">
                  No blogs found.
                </div>
              ) : (
                <>
                  <div className="flex justify-end pb-2">
                    <Button variant="ghost" size="sm" onClick={selectAll} className="text-xs h-8">
                      {blogs.filter(r => !r.isImported).length > 0 && selectedIds.size === blogs.filter(r => !r.isImported).length ? "Deselect All" : "Select All"}
                    </Button>
                  </div>
                  {blogs.map((blog) => (
                    <div
                      key={blog.id}
                      className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${blog.isImported ? "bg-muted/30 opacity-70" : "hover:bg-muted/50 cursor-pointer"}`}
                      onClick={() => toggleSelection(blog)}
                    >
                      <div className="overflow-hidden mr-4">
                        <div className="font-medium truncate text-sm" title={blog.title}>{blog.title}</div>
                        {blog.link && (
                          <div className="text-xs text-muted-foreground truncate mt-1" title={blog.link}>
                            {blog.link}
                          </div>
                        )}
                      </div>
                      <div className="shrink-0 text-muted-foreground flex items-center">
                        {blog.isImported ? (
                          <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded">Imported</span>
                        ) : selectedIds.has(blog.id) ? (
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
            
            {!loading && blogs.length > 0 && (
              <>
                <div className="px-4 py-3 border-t bg-muted/10 flex items-center gap-3">
                  <label className="text-sm font-medium whitespace-nowrap">Save under:</label>
                  <div className="flex-1 flex items-center gap-1 text-sm bg-background border rounded-md px-3 py-1.5 focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent transition-all">
                    <span className="text-muted-foreground select-none">/</span>
                    <input 
                      type="text" 
                      value={pathPrefix}
                      onChange={(e) => setPathPrefix(e.target.value)}
                      placeholder="articles"
                      className="flex-1 bg-transparent outline-none min-w-[50px]"
                    />
                  </div>
                </div>
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
              </>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
