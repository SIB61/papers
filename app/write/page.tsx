import Link from "next/link";
import { Plus } from "lucide-react";
import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { posts, type PostStatus } from "@/lib/db/schema";
import { WriteHeader } from "@/components/write-header";
import { createPost } from "@/app/actions";
import { getSessionUser } from "@/lib/auth";
import { relativeTime } from "@/lib/format";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DeletePostButton } from "@/components/delete-post-button";
import { GithubImportButton } from "@/components/github-import";
import { MediumImportButton } from "@/components/medium-import";
import { users } from "@/lib/db/schema";

type Tab = "all" | PostStatus;
const TABS: { id: Tab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "draft", label: "Drafts" },
  { id: "published", label: "Published" },
];

export const dynamic = "force-dynamic";

export default async function WritePage({ searchParams }: PageProps<"/write">) {
  const session = await getSessionUser();
  if (!session) redirect("/login");
  const [user] = await db.select({ github: users.github, medium: users.medium }).from(users).where(eq(users.id, session.id)).limit(1);

  const query = await searchParams;
  const requested = query.tab;
  const filter: Tab =
    typeof requested === "string" &&
    TABS.some((t) => t.id === requested)
      ? (requested as Tab)
      : "all";

  const all = await db
    .select()
    .from(posts)
    .where(eq(posts.userId, session.id))
    .orderBy(desc(posts.updatedAt));
  const list = filter === "all" ? all : all.filter((p) => p.status === filter);

  return (
    <>
      <WriteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-5">
        <div className="animate-page-in flex flex-wrap items-end justify-between gap-4 py-10">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">The desk</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Drafts and pages. Saved in markdown, served at their path.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {user?.github && <GithubImportButton />}
            {user?.medium && <MediumImportButton />}
            <form action={createPost}>
              <button
                type="submit"
                className={cn(buttonVariants({ size: "sm" }), "gap-2 h-9")}
              >
                <Plus className="size-4" />
                New post
              </button>
            </form>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-1">
          {TABS.map((tab) => {
            const count = tab.id === "all" ? all.length : all.filter((p) => p.status === tab.id).length;
            return (
              <Link
                key={tab.id}
                href={tab.id === "all" ? "/write" : `/write?tab=${tab.id}`}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  filter === tab.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {tab.label}
                <span className="ml-1.5 font-mono text-xs opacity-60">{count}</span>
              </Link>
            );
          })}
        </div>

        {list.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-14 text-center text-muted-foreground animate-page-in">
            Nothing here yet. Hit <b>New post</b> to start writing.
          </div>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border animate-page-in">
            {list.map((post) => (
              <li
                key={post.id}
                className="stagger flex items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/50"
              >
                <StatusPill status={post.status} />
                <Link href={`/write/${post.id}`} className="min-w-0 flex-1 group">
                  <span className="block truncate font-medium group-hover:underline underline-offset-4">
                    {post.title || "Untitled"}
                  </span>
                  <span className="block truncate font-mono text-xs text-muted-foreground">
                    /{session.username}/{post.slug}
                  </span>
                </Link>
                <span className="hidden shrink-0 text-xs text-muted-foreground sm:block">
                  {relativeTime(post.updatedAt)}
                </span>
                <div className="flex shrink-0 items-center gap-2">
                  <Link
                    href={`/${session.username}/${post.slug}?preview=1`}
                    target="_blank"
                    className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-background"
                  >
                    View
                  </Link>
                  <DeletePostButton postId={post.id} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}

function StatusPill({ status }: { status: PostStatus }) {
  const label = status === "published" ? "dot.pub" : "draft";
  return (
    <span
      className={cn(
        "hidden w-10 shrink-0 font-mono text-[10px] font-medium uppercase tracking-wider sm:flex",
        status === "published" && "items-center gap-1 text-foreground",
      )}
    >
      {status === "published" && (
        <span className="size-1.5 rounded-full bg-foreground" />
      )}
      {label}
    </span>
  );
}