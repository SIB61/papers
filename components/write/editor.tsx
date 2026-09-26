"use client";

import {
  useCallback,
  useDeferredValue,
  useEffect,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useSidebar } from "@/components/write/sidebar-context";
import {
  Menu,
  ArrowLeft,
  Bold,
  Check,
  Code,
  Columns2,
  Eye,
  Heading1,
  Heading2,
  Heading3,
  Image,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Loader2,
  Minus,
  PenLine,
  Quote,
  Strikethrough,
  Trash2,
  Upload,
  Sparkles,
} from "lucide-react";
import { beautifyContent, deletePost, updatePost } from "@/app/actions";
import Markdown from "@/components/markdown";
import { type PostStatus } from "@/lib/db/schema";
import { normalizeSlug } from "@/lib/slug";
import { cn } from "@/lib/utils";
import type { Post } from "@/lib/db/schema";

type Mode = "write" | "split" | "preview";

const TOOLS = [
  { key: "h1", label: "H1", icon: Heading1 },
  { key: "h2", label: "H2", icon: Heading2 },
  { key: "h3", label: "H3", icon: Heading3 },
  { key: "bold", label: "Bold", icon: Bold },
  { key: "italic", label: "Italic", icon: Italic },
  { key: "strike", label: "Strikethrough", icon: Strikethrough },
  { key: "code", label: "Inline code", icon: Code },
  { key: "link", label: "Link", icon: LinkIcon },
  { key: "image", label: "Image", icon: Image },
  { key: "quote", label: "Quote", icon: Quote },
  { key: "ul", label: "Bullet list", icon: List },
  { key: "ol", label: "Numbered list", icon: ListOrdered },
  { key: "hr", label: "Divider", icon: Minus },
] as const;

const TOOL_TRANSFORMS: Record<
  string,
  { before: string; after: string; placeholder: string }
> = {
  h1: { before: "# ", after: "", placeholder: "heading" },
  h2: { before: "## ", after: "", placeholder: "heading" },
  h3: { before: "### ", after: "", placeholder: "heading" },
  bold: { before: "**", after: "**", placeholder: "bold" },
  italic: { before: "_", after: "_", placeholder: "italic" },
  strike: { before: "~~", after: "~~", placeholder: "struck" },
  code: { before: "`", after: "`", placeholder: "code" },
  link: { before: "[", after: "](https://)", placeholder: "link text" },
  quote: { before: "> ", after: "", placeholder: "quote" },
  ul: { before: "- ", after: "", placeholder: "list item" },
  ol: { before: "1. ", after: "", placeholder: "list item" },
  hr: { before: "\n\n---\n\n", after: "", placeholder: "" },
};

const STATUS_LABELS: Record<PostStatus, string> = {
  draft: "Draft",
  published: "Published",
};

export function Editor({ post, username }: { post: Post; username: string }) {
  const { setMobileOpen } = useSidebar();
  const [title, setTitle] = useState(post.title);
  const [slug, setSlug] = useState(post.slug);
  const [content, setContent] = useState(post.content);
  const [status, setStatus] = useState<PostStatus>(post.status);
  const [mode, setMode] = useState<Mode>("write");

  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [beautifying, setBeautifying] = useState(false);

  const titleAuto = useRef(post.slug.startsWith("draft-"));
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resizeTitle = useCallback(() => {
    if (titleRef.current) {
      titleRef.current.style.height = "auto";
      titleRef.current.style.height = titleRef.current.scrollHeight + "px";
    }
  }, []);

  useEffect(() => {
    resizeTitle();
  }, [title, resizeTitle]);

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const insertMarkdown = useCallback((key: string) => {
    if (key === "image") {
      fileInputRef.current?.click();
      return;
    }
    const ta = textareaRef.current;
    if (!ta) return;
    const t = TOOL_TRANSFORMS[key];
    if (!t) return;
    const { selectionStart: start, selectionEnd: end, value } = ta;
    const selected = value.slice(start, end);
    const text = selected || t.placeholder;
    let insert = `${t.before}${text}${t.after}`;
    if (key === "hr") insert = `\n\n---\n\n`;
    const next = value.slice(0, start) + insert + value.slice(end);
    setContent(next);
    setDirty(true);
    const newStart = start + t.before.length;
    const newEnd = newStart + text.length;
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(newStart, newEnd);
    });
  }, []);

  const deleteCurrent = useCallback(() => {
    if (window.confirm("Delete this post? This cannot be undone.")) {
      void deletePost(post.id);
    }
  }, [post.id]);

  const beautify = useCallback(async () => {
    if (beautifying) return;
    setBeautifying(true);
    setError(null);
    try {
      const result = await beautifyContent(content);
      setContent(result.content);
      setDirty(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to beautify");
    } finally {
      setBeautifying(false);
    }
  }, [beautifying, content]);

  const save = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      const normalized = normalizeSlug(slug);
      await updatePost(post.id, { title, slug: normalized, content, status });
      setDirty(false);
      setLastSaved(Date.now());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }, [slug, title, content, status, post.id]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        void save();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [save]);

  const handleTitle = (value: string) => {
    setTitle(value);
    if (titleAuto.current) {
      const fromTitle = normalizeSlug(value);
      if (fromTitle) setSlug(fromTitle);
    }
    setDirty(true);
  };

  const handleSlug = (value: string) => {
    titleAuto.current = false;
    setSlug(value);
    setDirty(true);
  };

  const insertMarkdownImg = useCallback((url: string, alt: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const { selectionStart: start, selectionEnd: end } = ta;
    const insert = `![${alt}](${url})`;
    const next = ta.value.slice(0, start) + insert + ta.value.slice(end);
    setContent(next);
    setDirty(true);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(start + insert.length, start + insert.length);
    });
  }, []);

  const uploadFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) return;
      const body = new FormData();
      body.append("file", file);
      setUploading(true);
      setError(null);
      try {
        const res = await fetch("/api/upload", { method: "POST", body });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Upload failed");
        const url = data.url ?? data.key;
        const alt = file.name.replace(/\.[a-z0-9]+$/i, "").replace(/[-_]+/g, " ");
        insertMarkdownImg(url, alt);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [insertMarkdownImg],
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const items = Array.from(e.clipboardData.items);
      const image = items.find((item) => item.type.startsWith("image/"));
      if (!image) return;
      e.preventDefault();
      const file = image.getAsFile();
      if (file) void uploadFile(file);
    },
    [uploadFile],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const files = Array.from(e.dataTransfer.files).filter((f) =>
        f.type.startsWith("image/"),
      );
      if (files.length) void uploadFile(files[0]);
    },
    [uploadFile],
  );

  const statusSegments: PostStatus[] = ["draft", "published"];
  const postPath = `/${username}/${normalizeSlug(slug)}`;
  const deferredContent = useDeferredValue(content);

  return (
    <div
      className="flex h-full flex-col"
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes("Files")) {
          e.preventDefault();
          setDragging(true);
        }
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4">
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden flex items-center justify-center p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
            title="Open explorer"
          >
            <Menu className="size-5" />
          </button>
          <Link
            href="/write"
            className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            <span className="hidden sm:inline">Posts</span>
          </Link>

          <div className="mx-1 h-5 w-px bg-border" />

          <input
            value={slug}
            onChange={(e) => handleSlug(e.target.value)}
            placeholder="path/to/page"
            aria-label="Path"
            className="w-40 min-w-0 rounded-lg border border-border bg-transparent px-2.5 py-1.5 font-mono text-sm outline-none transition-colors focus:border-ring sm:w-64"
          />

          <div className="ml-auto flex items-center gap-2">

            <div className="flex items-center overflow-hidden rounded-lg border border-border">
              {statusSegments.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setStatus(s);
                    setDirty(true);
                  }}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium transition-colors",
                    status === s
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted",
                  )}
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>

            {dirty && <span className="hidden size-2 rounded-full bg-foreground sm:block" />}

            <button
              type="button"
              onClick={() => void save()}
              disabled={saving || !dirty}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-sm font-medium text-primary-foreground transition-all hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-40 active:translate-y-px"
            >
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Check className="size-4" />
              )}
              Save
            </button>

            <Link
              href={`${postPath}?preview=1`}
              target="_blank"
              className="hidden items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm transition-colors hover:bg-muted md:inline-flex"
            >
              <Eye className="size-4" />
              Preview
            </Link>

            <button
              type="button"
              onClick={() => void deleteCurrent()}
              title="Delete post"
              className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        </div>

        {error && (
          <div className="border-t border-destructive/30 bg-destructive/5 px-4 py-2 text-sm text-destructive">
            {error}
          </div>
        )}
      </header>

      <div className="mx-auto w-full max-w-6xl flex-1 px-4 pt-6">
        <textarea
          ref={titleRef}
          value={title}
          onChange={(e) => handleTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
            }
          }}
          rows={1}
          placeholder="Untitled"
          aria-label="Title"
          className="w-full resize-none overflow-hidden bg-transparent text-3xl font-bold tracking-tight outline-none placeholder:text-muted-foreground/40 sm:text-4xl"
        />
        <p className="mt-1 font-mono text-xs text-muted-foreground">{postPath}</p>

        <div className="mt-6 flex items-center justify-between gap-2">
          <div className="flex items-center overflow-hidden rounded-lg border border-border">
            {(
              [
                { id: "write", label: "Write", icon: PenLine },
                { id: "split", label: "Split", icon: Columns2 },
                { id: "preview", label: "Preview", icon: Eye },
              ] as const
            ).map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMode(m.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors",
                  mode === m.id
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                  m.id === "split" && "hidden md:flex"
                )}
              >
                <m.icon className="size-3.5" />
                {m.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1">
            {TOOLS.map((tool) => (
              <ToolButton
                key={tool.key}
                tool={tool}
                onClick={() => insertMarkdown(tool.key)}
                loading={tool.key === "image" ? uploading : false}
              />
            ))}
            <span className="mx-1 h-5 w-px bg-border" />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void uploadFile(file);
                e.target.value = "";
              }}
            />


            <button
              type="button"
              onClick={() => void beautify()}
              disabled={beautifying || !content.trim()}
              title="Beautify with Gemini — restyles the presentation without changing the content"
              className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 text-white transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-40"
            >
              {beautifying ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Sparkles className="size-4" />
              )}
            </button>
          </div>
        </div>

        <div
          className={cn(
            "mt-3 min-h-[60vh] overflow-hidden rounded-xl border border-border",
            mode !== "preview" && "grid grid-cols-1",
            mode === "split" && "lg:grid-cols-2",
          )}
        >
          {mode !== "preview" && (
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  setDirty(true);
                }}
                onPaste={handlePaste}
                spellCheck={false}
                aria-label="Markdown editor"
                className="h-full min-h-[60vh] w-full resize-none bg-transparent p-5 font-mono text-sm leading-relaxed outline-none placeholder:text-muted-foreground/40"
                placeholder={"# Start writing...\n\nEverything here is markdown. Drag an image in, or paste one from the clipboard."}
              />
            </div>
          )}
          {mode !== "write" && (
            <div className="min-h-[60vh] overflow-y-auto border-t border-border p-5 lg:border-l lg:border-t-0">
              <div className="mx-auto w-full max-w-[680px]">
                <Markdown>{deferredContent}</Markdown>
              </div>
            </div>
          )}
        </div>

        <p className="mt-3 flex items-center gap-2 pb-8 text-xs text-muted-foreground">
          <kbd className="rounded-md border border-border px-1.5 py-0.5 font-mono">⌘S</kbd>
          to save · drag &amp; drop images to upload · paste images from the clipboard
          {lastSaved && <span className="ml-auto">Saved {timeAgo(lastSaved)}</span>}
        </p>
      </div>

      {dragging && (
        <div className="pointer-events-none fixed inset-0 z-50 grid place-items-center bg-background/70 backdrop-blur-sm">
          <div className="animate-pop-in flex items-center gap-3 rounded-xl border-2 border-dashed border-foreground bg-background px-6 py-4 font-medium">
            <Upload className="size-5" />
            Drop image to upload
          </div>
        </div>
      )}
    </div>
  );
}

function ToolButton({
  tool,
  onClick,
  loading,
}: {
  tool: (typeof TOOLS)[number];
  onClick: () => void;
  loading?: boolean;
}) {
  const Icon = tool.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      title={tool.label}
      className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : <Icon className="size-4" />}
    </button>
  );
}

function timeAgo(ts: number): string {
  const seconds = Math.round((Date.now() - ts) / 1000);
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  return `${Math.round(seconds / 60)}m ago`;
}
