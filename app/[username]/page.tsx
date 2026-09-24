import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight, PenLine, Globe } from "lucide-react";
import { Twitter, Github, Linkedin } from "@/components/icons";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { posts, users } from "@/lib/db/schema";
import { relativeTime } from "@/lib/format";
import { getSessionUser } from "@/lib/auth";
import { DeletePostButton } from "@/components/delete-post-button";
export const dynamic = "force-dynamic";

export default async function UserHomePage({ params }: PageProps<"/[username]">) {
  const { username } = await params;

  const user = (
    await db.select().from(users).where(eq(users.username, username)).limit(1)
  )[0];
  if (!user) notFound();

  const published = await db
    .select()
    .from(posts)
    .where(eq(posts.userId, user.id))
    .orderBy(desc(posts.updatedAt));

  const session = await getSessionUser();
  const isOwner = session?.id === user.id;

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-5">
      <section className="animate-page-in py-16 sm:py-24">
        <p className="font-mono text-sm text-muted-foreground">/{user.username}</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
          {user.name || user.username}
        </h1>
        <p className="mt-4 max-w-md text-muted-foreground">
          {published.filter((p) => p.status === "published").length} published
          {published.some((p) => p.status === "draft") ? " · some drafts in progress" : ""}
        </p>
        {(user.twitter || user.github || user.linkedin || user.website) && (
          <div className="mt-4 flex flex-wrap items-center gap-2 text-muted-foreground">
            {user.twitter && (
              <a href={user.twitter.startsWith("http") ? user.twitter : `https://twitter.com/${user.twitter.replace(/^@/, '')}`} target="_blank" rel="noreferrer" className="flex items-center justify-center rounded-md p-2 transition-colors hover:bg-muted hover:text-foreground" aria-label="Twitter">
                <Twitter className="size-5" />
              </a>
            )}
            {user.github && (
              <a href={user.github.startsWith("http") ? user.github : `https://github.com/${user.github}`} target="_blank" rel="noreferrer" className="flex items-center justify-center rounded-md p-2 transition-colors hover:bg-muted hover:text-foreground" aria-label="GitHub">
                <Github className="size-5" />
              </a>
            )}
            {user.linkedin && (
              <a href={user.linkedin.startsWith("http") ? user.linkedin : `https://linkedin.com/in/${user.linkedin}`} target="_blank" rel="noreferrer" className="flex items-center justify-center rounded-md p-2 transition-colors hover:bg-muted hover:text-foreground" aria-label="LinkedIn">
                <Linkedin className="size-5" />
              </a>
            )}
            {user.website && (
              <a href={user.website.startsWith("http") ? user.website : `https://${user.website}`} target="_blank" rel="noreferrer" className="flex items-center justify-center rounded-md p-2 transition-colors hover:bg-muted hover:text-foreground" aria-label="Website">
                <Globe className="size-5" />
              </a>
            )}
          </div>
        )}
        {isOwner && (
          <Link
            href="/write"
            className="mt-6 inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
          >
            <PenLine className="size-4" />
            Write
          </Link>
        )}
      </section>

      <section className="animate-page-in pb-24" style={{ animationDelay: "120ms" }}>
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Index
        </h2>
        {published.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">
            Nothing here yet.{" "}
            {isOwner ? (
              <Link href="/write" className="underline underline-offset-4 hover:text-foreground">
                Write the first page
              </Link>
            ) : (
              <span>Check back soon.</span>
            )}
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-border border-y border-border">
            {published
              .filter((p) => p.status === "published")
              .map((post) => (
                <li key={post.id} className="group flex items-center justify-between gap-4 py-4 transition-colors">
                  <Link
                    href={`/${user.username}/${post.slug}`}
                    className="flex flex-1 items-center gap-4 min-w-0"
                  >
                    <span className="flex flex-1 items-center gap-2 min-w-0">
                      <span className="font-medium group-hover:underline underline-offset-4 truncate">
                        {post.title}
                      </span>
                      <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                      <span className="h-px flex-1 shrink border-b border-dotted border-border transition-colors group-hover:border-muted-foreground/40 hidden sm:block" />
                    </span>
                    <span className="hidden shrink-0 text-xs text-muted-foreground sm:block">
                      {relativeTime(post.updatedAt)}
                    </span>
                  </Link>
                  {isOwner && <DeletePostButton postId={post.id} />}
                </li>
              ))}
          </ul>
        )}
      </section>
    </main>
  );
}