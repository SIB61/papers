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
  const visiblePosts = published.filter(p => p.slug !== "about" && p.status === "published");

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-12 sm:py-24">
      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
        
        {/* Left Sidebar: Profile Identity */}
        <aside className="animate-page-in flex flex-col items-center text-center md:items-start md:text-left">
          <div className="md:sticky md:top-24 space-y-6">
            {user.image && (
              <img 
                src={user.image} 
                alt={user.name || user.username} 
                className="size-24 sm:size-32 rounded-2xl object-cover border border-border/50 shadow-sm mx-auto md:mx-0" 
              />
            )}
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                {user.name || user.username}
              </h1>
              <p className="mt-1.5 font-mono text-sm text-muted-foreground/80">
                /{user.username}
              </p>
            </div>

            {(user.twitter || user.github || user.linkedin || user.website || user.contactEmail || user.whatsapp) && (
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5 text-muted-foreground">
                {user.contactEmail && (
                  <a href={`mailto:${user.contactEmail}`} className="flex items-center justify-center rounded-lg p-2.5 transition-all hover:bg-muted/80 hover:text-foreground" aria-label="Email">
                    <Mail className="size-4" />
                  </a>
                )}
                {user.whatsapp && (
                  <a href={`https://wa.me/${user.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="flex items-center justify-center rounded-lg p-2.5 transition-all hover:bg-muted/80 hover:text-foreground" aria-label="WhatsApp">
                    <Whatsapp className="size-4" />
                  </a>
                )}
                {user.twitter && (
                  <a href={user.twitter.startsWith("http") ? user.twitter : `https://twitter.com/${user.twitter.replace(/^@/, '')}`} target="_blank" rel="noreferrer" className="flex items-center justify-center rounded-lg p-2.5 transition-all hover:bg-muted/80 hover:text-foreground" aria-label="Twitter">
                    <Twitter className="size-4" />
                  </a>
                )}
                {user.github && (
                  <a href={user.github.startsWith("http") ? user.github : `https://github.com/${user.github}`} target="_blank" rel="noreferrer" className="flex items-center justify-center rounded-lg p-2.5 transition-all hover:bg-muted/80 hover:text-foreground" aria-label="GitHub">
                    <Github className="size-4" />
                  </a>
                )}
                {user.linkedin && (
                  <a href={user.linkedin.startsWith("http") ? user.linkedin : `https://linkedin.com/in/${user.linkedin}`} target="_blank" rel="noreferrer" className="flex items-center justify-center rounded-lg p-2.5 transition-all hover:bg-muted/80 hover:text-foreground" aria-label="LinkedIn">
                    <Linkedin className="size-4" />
                  </a>
                )}
                {user.website && (
                  <a href={user.website.startsWith("http") ? user.website : `https://${user.website}`} target="_blank" rel="noreferrer" className="flex items-center justify-center rounded-lg p-2.5 transition-all hover:bg-muted/80 hover:text-foreground" aria-label="Website">
                    <Globe className="size-4" />
                  </a>
                )}
              </div>
            )}
            
            {user.cvUrl && (
              <div className="pt-2 flex justify-center md:justify-start">
                <a 
                  href={user.cvUrl} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="inline-flex items-center gap-2 rounded-lg bg-foreground text-background px-4 py-2 text-sm font-medium transition-transform hover:scale-[1.02] active:scale-95"
                >
                  <FileText className="size-4" />
                  View CV
                </a>
              </div>
            )}
          </div>
        </aside>

        {/* Right Content: Bio & Index */}
        <div className="space-y-16">
          {showBio && (
            <section className="animate-page-in" style={{ animationDelay: "60ms" }}>
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

          <section className="animate-page-in" style={{ animationDelay: "120ms" }}>
            <div className="flex items-baseline justify-between mb-8">
              <h2 className="text-sm font-bold uppercase tracking-widest text-foreground">
                Selected Work
              </h2>
              <p className="text-xs text-muted-foreground font-mono">
                {visiblePosts.length} post{visiblePosts.length !== 1 ? 's' : ''}
              </p>
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
              <ul className="flex flex-col gap-6">
                {visiblePosts.map((post) => (
                    <li key={post.id} className="group flex items-start sm:items-center justify-between gap-4 p-4 -mx-4 rounded-xl transition-all hover:bg-muted/40">
                      <Link
                        href={`/${user.username}/${post.slug}`}
                        className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 flex-1 min-w-0"
                      >
                        <span className="font-medium text-foreground group-hover:text-primary transition-colors truncate">
                          {post.title}
                        </span>
                        <span className="h-px flex-1 shrink border-b border-dashed border-border/60 transition-colors group-hover:border-primary/30 hidden sm:block" />
                        <span className="flex items-center gap-2 shrink-0 text-xs text-muted-foreground">
                          {relativeTime(post.updatedAt)}
                          <ArrowUpRight className="size-3.5 opacity-50 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-100" />
                        </span>
                      </Link>
                      {isOwner && (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <DeletePostButton postId={post.id} />
                        </div>
                      )}
                    </li>
                  ))}
              </ul>
            )}
          </section>
        </div>

      </div>
    </main>
  );
}