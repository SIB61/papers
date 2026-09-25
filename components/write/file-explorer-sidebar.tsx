"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronRight, ChevronDown, FileText, Folder, MoreVertical, Plus, Trash2, Edit2, Star, EyeOff, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { renameRoute, deleteRoute, createPostWithSlugAction, toggleProfileVisibility } from "@/app/actions";

type Post = {
  id: number;
  title: string;
  slug: string;
  status: string;
  showOnProfile: boolean;
};

type TreeNode = {
  name: string;
  fullSlug: string;
  post?: Post;
  children: Record<string, TreeNode>;
};

function buildTree(posts: Post[]) {
  const root: TreeNode = { name: "root", fullSlug: "", children: {} };
  for (const post of posts) {
    const parts = post.slug.split("/");
    let current = root;
    let path = "";
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      path = path ? `${path}/${part}` : part;
      if (!current.children[part]) {
        current.children[part] = { name: part, fullSlug: path, children: {} };
      }
      current = current.children[part];
      if (i === parts.length - 1) {
        current.post = post;
      }
    }
  }
  return root;
}

function TreeItem({ 
  node, 
  activeId, 
  level,
  onRename,
  onDelete,
  onCreateChild,
  onToggleProfile
}: { 
  node: TreeNode; 
  activeId?: number; 
  level: number;
  onRename: (oldSlug: string) => void;
  onDelete: (slug: string) => void;
  onCreateChild: (parentSlug: string) => void;
  onToggleProfile: (id: number, show: boolean) => void;
}) {
  const [expanded, setExpanded] = useState(level < 1); // Expand top level by default
  const [menuOpen, setMenuOpen] = useState(false);
  const hasChildren = Object.keys(node.children).length > 0;
  
  const isActive = node.post?.id === activeId;

  return (
    <div className="w-full">
      <div 
        className={cn(
          "group flex items-center justify-between px-2 py-1.5 text-sm hover:bg-muted/50 rounded-md cursor-pointer transition-colors",
          isActive && "bg-muted text-foreground font-medium"
        )}
        style={{ paddingLeft: `${(level * 12) + 8}px` }}
      >
        <div className="flex items-center gap-1.5 overflow-hidden flex-1">
          <button 
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setExpanded(!expanded); }}
            className={cn("p-0.5 rounded-sm hover:bg-border/50 text-muted-foreground", !hasChildren && "invisible")}
          >
            {expanded ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
          </button>
          
          {node.post ? (
            <Link href={`/write/${node.post.id}`} className="flex items-center gap-1.5 flex-1 overflow-hidden min-w-0">
              <FileText className="size-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate">{node.name}</span>
              {node.post.showOnProfile && <span title="Pinned to profile"><Star className="size-3 shrink-0 text-amber-500 fill-amber-500 ml-1" /></span>}
            </Link>
          ) : (
            <div className="flex items-center gap-1.5 flex-1 overflow-hidden min-w-0" onClick={() => setExpanded(!expanded)}>
              <Folder className="size-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate">{node.name}</span>
            </div>
          )}
        </div>

        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            type="button" 
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onCreateChild(node.fullSlug); }}
            className="p-1 text-muted-foreground hover:text-foreground rounded-md hover:bg-background"
            title="Create inside"
          >
            <Plus className="size-3.5" />
          </button>
          <div className="relative">
            <button 
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMenuOpen(!menuOpen); }}
              className="p-1 text-muted-foreground hover:text-foreground rounded-md hover:bg-background"
            >
              <MoreVertical className="size-3.5" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }} />
                <div className="absolute right-0 top-full mt-1 z-50 w-36 bg-popover text-popover-foreground border border-border rounded-md shadow-md py-1 text-xs">
                  {node.post && (
                    <button 
                      type="button"
                      className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-muted text-left"
                      onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onToggleProfile(node.post!.id, !node.post!.showOnProfile); }}
                    >
                      {node.post.showOnProfile ? (
                        <><EyeOff className="size-3" /> Unpin from profile</>
                      ) : (
                        <><Eye className="size-3" /> Pin to profile</>
                      )}
                    </button>
                  )}
                  <button 
                    type="button"
                    className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-muted text-left"
                    onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onRename(node.fullSlug); }}
                  >
                    <Edit2 className="size-3" /> Rename
                  </button>
                  <button 
                    type="button"
                    className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-destructive/10 text-destructive text-left"
                    onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDelete(node.fullSlug); }}
                  >
                    <Trash2 className="size-3" /> Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      
      {expanded && hasChildren && (
        <div className="flex flex-col">
          {Object.values(node.children).map(child => (
            <TreeItem 
              key={child.fullSlug} 
              node={child} 
              activeId={activeId} 
              level={level + 1} 
              onRename={onRename}
              onDelete={onDelete}
              onCreateChild={onCreateChild}
              onToggleProfile={onToggleProfile}
            />
          ))}
        </div>
      )}
    </div>
  );
}

type ModalState =
  | { type: "none" }
  | { type: "prompt"; title: string; defaultValue: string; onConfirm: (val: string) => void }
  | { type: "confirm"; title: string; message: string; onConfirm: () => void }
  | { type: "alert"; title: string; message: string };

export function FileExplorerSidebar({ posts }: { posts: Post[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const activeId = pathname.startsWith("/write/") ? parseInt(pathname.split("/")[2]) : undefined;
  
  const tree = useMemo(() => buildTree(posts), [posts]);
  const [modal, setModal] = useState<ModalState>({ type: "none" });

  const handleRename = (oldSlug: string) => {
    setModal({
      type: "prompt",
      title: "Rename route",
      defaultValue: oldSlug,
      onConfirm: async (newName) => {
        setModal({ type: "none" });
        if (!newName || newName === oldSlug) return;
        try {
          await renameRoute(oldSlug, newName);
        } catch (e) {
          setModal({ type: "alert", title: "Error", message: (e as Error).message });
        }
      }
    });
  };

  const handleDelete = (slug: string) => {
    setModal({
      type: "confirm",
      title: "Delete route",
      message: `Are you sure you want to delete route '${slug}' AND ALL ITS CHILDREN?`,
      onConfirm: async () => {
        setModal({ type: "none" });
        try {
          await deleteRoute(slug);
          if (activeId && posts.find(p => p.id === activeId)?.slug.startsWith(slug)) {
            router.push("/write");
          }
        } catch (e) {
          setModal({ type: "alert", title: "Error", message: (e as Error).message });
        }
      }
    });
  };

  const handleToggleProfile = async (id: number, show: boolean) => {
    try {
      await toggleProfileVisibility(id, show);
      router.refresh();
    } catch (e) {
      setModal({ type: "alert", title: "Error", message: (e as Error).message });
    }
  };

  const handleCreateChild = (parentSlug?: string) => {
    setModal({
      type: "prompt",
      title: "Create new post",
      defaultValue: parentSlug ? `${parentSlug}/new-post` : "new-post",
      onConfirm: async (newSlug) => {
        setModal({ type: "none" });
        if (!newSlug) return;
        try {
          const res = await createPostWithSlugAction(newSlug);
          router.push(`/write/${res.id}`);
        } catch (e) {
          setModal({ type: "alert", title: "Error", message: (e as Error).message });
        }
      }
    });
  };

  return (
    <>
      <aside className="w-64 shrink-0 flex flex-col border-r border-border bg-card text-card-foreground">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <span className="font-semibold text-sm">Explorer</span>
          <button 
            onClick={() => handleCreateChild()} 
            className="p-1 rounded-md hover:bg-muted text-muted-foreground transition-colors"
            title="Create root post"
          >
            <Plus className="size-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-2 px-2 flex flex-col gap-0.5">
          {Object.values(tree.children).length === 0 ? (
            <div className="p-4 text-xs text-muted-foreground text-center">No posts yet. Click + to create.</div>
          ) : (
            Object.values(tree.children).map(child => (
              <TreeItem 
                key={child.fullSlug} 
                node={child} 
                activeId={activeId} 
                level={0}
                onRename={handleRename}
                onDelete={handleDelete}
                onCreateChild={handleCreateChild}
                onToggleProfile={handleToggleProfile}
              />
            ))
          )}
        </div>
        <div className="p-3 border-t border-border mt-auto flex flex-col gap-2">
          <Link href="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
            <ChevronRight className="size-3" /> Back to Home
          </Link>
        </div>
      </aside>

      {modal.type !== "none" && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-lg">
            <h3 className="mb-4 text-lg font-semibold">{modal.title}</h3>
            
            {modal.type === "prompt" && (
              <form onSubmit={(e) => {
                e.preventDefault();
                const val = new FormData(e.currentTarget).get("val") as string;
                modal.onConfirm(val);
              }}>
                <input 
                  name="val" 
                  defaultValue={modal.defaultValue} 
                  autoFocus
                  className="mb-4 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setModal({ type: "none" })} className="rounded-md px-4 py-2 text-sm hover:bg-muted">Cancel</button>
                  <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">Save</button>
                </div>
              </form>
            )}

            {modal.type === "confirm" && (
              <>
                <p className="mb-6 text-sm text-muted-foreground">{modal.message}</p>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setModal({ type: "none" })} className="rounded-md px-4 py-2 text-sm hover:bg-muted">Cancel</button>
                  <button type="button" onClick={modal.onConfirm} className="rounded-md bg-destructive px-4 py-2 text-sm text-destructive-foreground">Delete</button>
                </div>
              </>
            )}

            {modal.type === "alert" && (
              <>
                <p className="mb-6 text-sm text-muted-foreground">{modal.message}</p>
                <div className="flex justify-end">
                  <button type="button" onClick={() => setModal({ type: "none" })} className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">OK</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
