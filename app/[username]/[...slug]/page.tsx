import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { and, count, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { comments, postLikes, posts, users } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth";
import Markdown from "@/components/markdown";
import { DownloadPdfButton } from "@/components/download-pdf-button";
import { PostInteractions } from "@/components/post-interactions";
import { ArrowUpRight } from "lucide-react";
import { relativeTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PostPage({
  params,
  searchParams,
}: PageProps<"/[username]/[...slug]">) {
  const { username, slug } = await params;
  const slugString = Array.isArray(slug) ? slug.join("/") : slug;
  const query = await searchParams;

  let post: any = (
    await db
      .select({ post: posts })
      .from(posts)
      .innerJoin(users, eq(posts.userId, users.id))
      .where(and(eq(users.username, username), eq(posts.slug, slugString)))
      .limit(1)
  )[0]?.post;

  const isPreview = query.preview === "1";
  if (post && post.status !== "published" && !isPreview) {
    post = undefined; // Hide draft content from public, fallback to virtual post if it has children
  }

  const profileUser = (
    await db.select().from(users).where(eq(users.username, username)).limit(1)
  )[0];
  if (!profileUser) notFound();

  // Find children
  const childrenRows = await db
    .select({
      id: posts.id,
      title: posts.title,
      slug: posts.slug,
      updatedAt: posts.updatedAt,
    })
    .from(posts)
    .where(
      and(
        eq(posts.userId, profileUser.id),
        eq(posts.status, "published"),
        sql`${posts.slug} LIKE ${slugString + "/%"}`
      )
    )
    .orderBy(desc(posts.updatedAt));

  if (!post) {
    if (childrenRows.length === 0) {
      notFound();
    }
    // It's a virtual parent post
    post = {
      id: 0,
      userId: profileUser.id,
      slug: slugString,
      title: slugString.split("/").pop() || slugString,
      content: "",
      status: "published",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }



  const session = await getSessionUser();
  if (isPreview && post.id !== 0) {
    if (!session || post.userId !== session.id) notFound();
  }
  const isOwner = session?.id === post.userId;

  async function createVirtualPostAndEdit() {
    "use server";
    const sessionUser = await getSessionUser();
    if (!sessionUser || sessionUser.id !== profileUser.id) return;

    const [created] = await db
      .insert(posts)
      .values({
        title: slugString.split("/").pop() || "Untitled",
        slug: slugString,
        status: "draft",
        userId: sessionUser.id
      })
      .returning();
    redirect(`/write/${created.id}`);
  }

  const [{ value: likeCount }] = post.id !== 0 ? await db
    .select({ value: count() })
    .from(postLikes)
    .where(eq(postLikes.postId, post.id)) : [{ value: 0 }];

  const [myLike] = session && post.id !== 0
    ? await db
      .select({ id: postLikes.id })
      .from(postLikes)
      .where(and(eq(postLikes.postId, post.id), eq(postLikes.userId, session.id)))
      .limit(1)
    : [undefined];

  const commentRows = post.id !== 0 ? await db
    .select({
      id: comments.id,
      content: comments.content,
      createdAt: comments.createdAt,
      userId: comments.userId,
      name: users.name,
      username: users.username,
      image: users.image,
    })
    .from(comments)
    .innerJoin(users, eq(comments.userId, users.id))
    .where(eq(comments.postId, post.id))
    .orderBy(desc(comments.createdAt))
    .limit(200) : [];

  const initialComments = commentRows.map((row) => ({
    id: row.id,
    content: row.content,
    createdAt: row.createdAt,
    author: { id: row.userId, name: row.name, username: row.username, image: row.image },
  }));

  return (
    <>
      {isPreview && post.id !== 0 && (
        <div className="no-print border-b border-dashed border-border bg-muted/60">
          <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-2 px-5 py-2.5 text-xs text-muted-foreground">
            <span>
              Previewing a <b>{post.status}</b> — it is not public yet.
            </span>
            <Link
              href="/write"
              className="ml-auto rounded-md border border-border px-2 py-1 font-medium transition-colors hover:bg-background"
            >
              Back to editor
            </Link>
          </div>
        </div>
      )}

      <main className="mx-auto w-full max-w-4xl flex-1 px-5">
        <article className="animate-page-in mx-auto mt-12 max-w-[680px] pb-24">
          <nav className="no-print mb-10 flex flex-wrap items-center gap-1 font-mono text-sm text-muted-foreground">
            <Link href={`/${username}`} className="transition-colors hover:text-foreground">
              /{username}
            </Link>
            <span className="flex items-center gap-1">
              <span className="text-border">/</span>
              <span>{slugString}</span>
            </span>
          </nav>

          <header className="mb-12 border-b border-border pb-8">
            <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              {post.title}
            </h1>
          </header>

          <Markdown>{post.content}</Markdown>

          {childrenRows.length > 0 && (
            <div className="mt-16 animate-page-in">
              <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Index
              </h2>
              <ul className="mt-4 divide-y divide-border border-y border-border">
                {childrenRows.map((child) => {
                  const childRelativeSlug = child.slug.replace(`${slugString}/`, "");
                  if (childRelativeSlug.includes("/")) return null; // only direct children
                  return (
                    <li key={child.id} className="group flex items-center justify-between gap-4 py-4 transition-colors">
                      <Link
                        href={`/${username}/${child.slug}`}
                        className="flex flex-1 items-center gap-4 min-w-0"
                      >
                        <span className="flex flex-1 items-center gap-2 min-w-0">
                          <span className="font-medium group-hover:underline underline-offset-4 truncate">
                            {child.title || childRelativeSlug}
                          </span>
                          <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                          <span className="h-px flex-1 shrink border-b border-dotted border-border transition-colors group-hover:border-muted-foreground/40 hidden sm:block" />
                        </span>
                        <span className="hidden shrink-0 text-xs text-muted-foreground sm:block">
                          {relativeTime(child.updatedAt)}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <footer className="no-print mt-20 flex items-center justify-between border-t border-border pt-6 text-xs text-muted-foreground">
            <span>
              /{username}/{post.slug}
              {post.id !== 0 && (
                <>
                  <span className="mx-2">·</span>
                  {formatDate(post.updatedAt)}
                </>
              )}
            </span>
            <span className="no-print flex items-center gap-2">
              {post.id !== 0 && <DownloadPdfButton />}
              {isOwner && post.id !== 0 && (
                <Link
                  href={`/write/${post.id}`}
                  className="rounded-md border border-border px-2 py-1 transition-colors hover:bg-muted"
                >
                  edit
                </Link>
              )}
              {isOwner && post.id === 0 && (
                <form action={createVirtualPostAndEdit}>
                  <button type="submit" className="rounded-md border border-border px-2 py-1 transition-colors hover:bg-muted">
                    edit
                  </button>
                </form>
              )}
            </span>
          </footer>
        </article>

        {post.id !== 0 && (
          <PostInteractions
            postId={post.id}
            isOwner={isOwner}
            initialLikeCount={Number(likeCount)}
            initialLiked={Boolean(myLike)}
            initialComments={initialComments}
            currentUser={
              session
                ? {
                  id: session.id,
                  name: session.name,
                  username: session.username,
                  image: session.image,
                }
                : null
            }
          />
        )}
      </main>
    </>
  );
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export async function generateMetadata({
  params,
}: PageProps<"/[username]/[...slug]">): Promise<Metadata> {
  const { username, slug } = await params;
  const slugString = Array.isArray(slug) ? slug.join("/") : slug;
  const post = (
    await db
      .select({ title: posts.title })
      .from(posts)
      .innerJoin(users, eq(posts.userId, users.id))
      .where(and(eq(users.username, username), eq(posts.slug, slugString)))
      .limit(1)
  )[0];
  if (!post) return {};
  return {
    title: post.title,
    alternates: { canonical: `/${username}/${slugString}` },
  };
}
