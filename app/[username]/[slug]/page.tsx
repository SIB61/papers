import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { and, count, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { comments, postLikes, posts, users } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth";
import Markdown from "@/components/markdown";
import { DownloadPdfButton } from "@/components/download-pdf-button";
import { PostInteractions } from "@/components/post-interactions";

export const dynamic = "force-dynamic";

export default async function PostPage({
  params,
  searchParams,
}: PageProps<"/[username]/[slug]">) {
  const { username, slug } = await params;
  const query = await searchParams;

  const post = (
    await db
      .select({ post: posts })
      .from(posts)
      .innerJoin(users, eq(posts.userId, users.id))
      .where(and(eq(users.username, username), eq(posts.slug, slug)))
      .limit(1)
  )[0]?.post;

  if (!post) notFound();

  const isPreview = query.preview === "1";
  if (post.status !== "published" && !isPreview) notFound();

  const session = await getSessionUser();
  if (isPreview) {
    if (!session || post.userId !== session.id) notFound();
  }
  const isOwner = session?.id === post.userId;

  const [{ value: likeCount }] = await db
    .select({ value: count() })
    .from(postLikes)
    .where(eq(postLikes.postId, post.id));

  const [myLike] = session
    ? await db
        .select({ id: postLikes.id })
        .from(postLikes)
        .where(and(eq(postLikes.postId, post.id), eq(postLikes.userId, session.id)))
        .limit(1)
    : [undefined];

  const commentRows = await db
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
    .limit(200);

  const initialComments = commentRows.map((row) => ({
    id: row.id,
    content: row.content,
    createdAt: row.createdAt,
    author: { id: row.userId, name: row.name, username: row.username, image: row.image },
  }));

  return (
    <>
      {isPreview && (
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
              <span>{slug}</span>
            </span>
          </nav>

          <header className="mb-12 border-b border-border pb-8">
            <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              {post.title}
            </h1>
          </header>

          <Markdown>{post.content}</Markdown>

          <footer className="no-print mt-20 flex items-center justify-between border-t border-border pt-6 text-xs text-muted-foreground">
            <span>
              /{username}/{post.slug}
              <span className="mx-2">·</span>
              {formatDate(post.updatedAt)}
            </span>
            {isOwner && (
              <span className="no-print flex items-center gap-2">
                <DownloadPdfButton />
                <Link
                  href={`/write/${post.id}`}
                  className="rounded-md border border-border px-2 py-1 transition-colors hover:bg-muted"
                >
                  edit
                </Link>
              </span>
            )}
          </footer>
        </article>

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
}: PageProps<"/[username]/[slug]">): Promise<Metadata> {
  const { username, slug } = await params;
  const post = (
    await db
      .select({ title: posts.title })
      .from(posts)
      .innerJoin(users, eq(posts.userId, users.id))
      .where(and(eq(users.username, username), eq(posts.slug, slug)))
      .limit(1)
  )[0];
  if (!post) return {};
  return {
    title: post.title,
    alternates: { canonical: `/${username}/${slug}` },
  };
}