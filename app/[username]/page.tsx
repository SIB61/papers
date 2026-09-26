import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight, Globe, Mail, FileText } from "lucide-react";
import { Twitter, Github, Linkedin, Whatsapp } from "@/components/icons";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { posts, users } from "@/lib/db/schema";
import { relativeTime } from "@/lib/format";
import { getSessionUser } from "@/lib/auth";
import { DeletePostButton } from "@/components/delete-post-button";
import Markdown from "@/components/markdown";

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
    .where(and(eq(posts.userId, user.id), eq(posts.showOnProfile, true)))
    .orderBy(desc(posts.updatedAt));

  const aboutPost = await db
    .select()
    .from(posts)
    .where(and(eq(posts.userId, user.id), eq(posts.slug, "about")))
    .limit(1)
    .then(res => res[0]);

  const session = await getSessionUser();
  const isOwner = session?.id === user.id;

  const showBio = aboutPost && (aboutPost.status === "published" || isOwner);
  const visiblePosts = published.filter(p => {
    if (p.slug === "about") return false;
    if (p.status !== "published" && !isOwner) return false;
    return true;
  });

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-16 sm:py-24 flex flex-col items-center">
      
      {/* Header Identity */}
      <section className="animate-page-in flex flex-col items-center text-center w-full">
        {user.image && (
          <img 
            src={user.image} 
            alt={user.name || user.username} 
            className="size-28 sm:size-32 rounded-full object-cover border-4 border-background shadow-md ring-1 ring-border/50 mb-6" 
          />
        )}
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          {user.name || user.username}
        </h1>
        <p className="mt-2 font-mono text-sm text-muted-foreground">
          @{user.username}
        </p>

        {(user.twitter || user.github || user.linkedin || user.website || user.contactEmail || user.whatsapp) && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-muted-foreground">
            {user.contactEmail && (
              <a href={`mailto:${user.contactEmail}`} className="flex items-center justify-center rounded-full bg-muted/50 p-3 transition-all hover:bg-muted hover:text-foreground hover:scale-105" aria-label="Email">
                <Mail className="size-4" />
              </a>
            )}
            {user.whatsapp && (
              <a href={`https://wa.me/${user.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="flex items-center justify-center rounded-full bg-muted/50 p-3 transition-all hover:bg-muted hover:text-foreground hover:scale-105" aria-label="WhatsApp">
                <Whatsapp className="size-4" />
              </a>
            )}
            {user.twitter && (
              <a href={user.twitter.startsWith("http") ? user.twitter : `https://twitter.com/${user.twitter.replace(/^@/, '')}`} target="_blank" rel="noreferrer" className="flex items-center justify-center rounded-full bg-muted/50 p-3 transition-all hover:bg-muted hover:text-foreground hover:scale-105" aria-label="Twitter">
                <Twitter className="size-4" />
              </a>
            )}
            {user.github && (
              <a href={user.github.startsWith("http") ? user.github : `https://github.com/${user.github}`} target="_blank" rel="noreferrer" className="flex items-center justify-center rounded-full bg-muted/50 p-3 transition-all hover:bg-muted hover:text-foreground hover:scale-105" aria-label="GitHub">
                <Github className="size-4" />
              </a>
            )}
            {user.linkedin && (
              <a href={user.linkedin.startsWith("http") ? user.linkedin : `https://linkedin.com/in/${user.linkedin}`} target="_blank" rel="noreferrer" className="flex items-center justify-center rounded-full bg-muted/50 p-3 transition-all hover:bg-muted hover:text-foreground hover:scale-105" aria-label="LinkedIn">
                <Linkedin className="size-4" />
              </a>
            )}
            {user.website && (
              <a href={user.website.startsWith("http") ? user.website : `https://${user.website}`} target="_blank" rel="noreferrer" className="flex items-center justify-center rounded-full bg-muted/50 p-3 transition-all hover:bg-muted hover:text-foreground hover:scale-105" aria-label="Website">
                <Globe className="size-4" />
              </a>
            )}
          </div>
        )}

        {user.cvUrl && (
          <div className="mt-8">
            <a 
              href={user.cvUrl} 
              target="_blank" 
              rel="noreferrer" 
              className="inline-flex items-center gap-2 rounded-full bg-foreground text-background px-6 py-2.5 text-sm font-semibold transition-transform hover:scale-105 active:scale-95 shadow-sm"
            >
              <FileText className="size-4" />
              Download Resume
            </a>
          </div>
        )}
      </section>

      {/* Divider */}
      <hr className="w-full my-12 border-border/60" />

      {/* Bio Content */}
      <div className="w-full space-y-16">
        {showBio && (
          <section className="animate-page-in w-full" style={{ animationDelay: "60ms" }}>
            <div className="prose prose-neutral dark:prose-invert max-w-none text-muted-foreground leading-relaxed">
              <Markdown>{aboutPost.content}</Markdown>
            </div>
            {isOwner && aboutPost.status === "draft" && (
              <p className="mt-6 text-xs text-muted-foreground border border-dashed border-border/50 rounded-lg p-3 inline-block bg-muted/20">
                Your bio (about) is currently a draft and only visible to you.
              </p>
            )}
          </section>
        )}

        {/* Index */}
        <section className="animate-page-in w-full" style={{ animationDelay: "120ms" }}>
          <div className="flex items-center justify-between mb-8 border-b border-border/60 pb-4">
            <h2 className="text-lg font-bold tracking-tight text-foreground">
              Selected Work
            </h2>
            <span className="inline-flex items-center justify-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              {visiblePosts.length} post{visiblePosts.length !== 1 ? 's' : ''}
            </span>
          </div>
          
          {visiblePosts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/60 bg-muted/10 p-12 text-center text-muted-foreground">
              Nothing here yet.{" "}
              {isOwner ? (
                <Link href="/write" className="underline underline-offset-4 hover:text-foreground transition-colors">
                  Write the first page
                </Link>
              ) : (
                <span>Check back soon.</span>
              )}
            </div>
          ) : (
            <ul className="flex flex-col">
              {visiblePosts.map((post) => (
                  <li key={post.id} className="group relative border-b border-border/40 last:border-0">
                    <Link
                      href={`/${user.username}/${post.slug}`}
                      className="flex flex-col sm:flex-row sm:items-center justify-between py-5 gap-3 transition-colors hover:bg-muted/30 -mx-4 px-4 rounded-xl"
                    >
                      <span className="font-medium text-foreground text-[1.05rem] group-hover:text-primary transition-colors truncate">
                        {post.title}
                      </span>
                      <div className="flex items-center gap-4 shrink-0">
                        <span className="text-sm text-muted-foreground">
                          {relativeTime(post.updatedAt)}
                        </span>
                        <ArrowUpRight className="size-4 text-muted-foreground opacity-40 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-100 group-hover:text-primary" />
                      </div>
                    </Link>
                    {isOwner && (
                      <div className="absolute top-1/2 -translate-y-1/2 right-12 opacity-0 group-hover:opacity-100 transition-opacity">
                        <DeletePostButton postId={post.id} />
                      </div>
                    )}
                  </li>
                ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}