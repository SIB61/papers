"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { posts, users } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import TurndownService from "turndown";

function normalizeSlug(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9\/_-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

export async function fetchMediumBlogs() {
  const session = await getSessionUser();
  if (!session) throw new Error("Unauthorized");

  const [user] = await db
    .select({ medium: users.medium })
    .from(users)
    .where(eq(users.id, session.id))
    .limit(1);

  let username = user?.medium?.trim();
  if (!username) throw new Error("No Medium account linked. Please link your Medium in the settings.");

  if (username.startsWith("http")) {
    const url = new URL(username);
    username = url.pathname.split('/').filter(Boolean)[0];
  }

  if (!username.startsWith("@")) username = "@" + username;

  const res = await fetch(`https://medium.com/feed/${username}`);
  if (!res.ok) throw new Error("Failed to fetch Medium feed");
  
  const xml = await res.text();
  
  const userPosts = await db.select({ slug: posts.slug }).from(posts).where(eq(posts.userId, session.id));
  const existingSlugs = new Set(userPosts.map(p => p.slug));
  
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];
    const titleMatch = /<title><!\[CDATA\[(.*?)\]\]><\/title>/.exec(itemXml) || /<title>(.*?)<\/title>/.exec(itemXml);
    const linkMatch = /<link>(.*?)<\/link>/.exec(itemXml);
    const id = linkMatch ? linkMatch[1] : Math.random().toString();
    const encodedMatch = /<content:encoded><!\[CDATA\[([\s\S]*?)\]\]><\/content:encoded>/.exec(itemXml);
    
    if (titleMatch) {
      const title = titleMatch[1];
      const slug = normalizeSlug("articles/" + title);
      items.push({
        id,
        title,
        link: linkMatch ? linkMatch[1] : "",
        htmlContent: encodedMatch ? encodedMatch[1] : "",
        isImported: existingSlugs.has(slug),
      });
    }
  }
  
  return items;
}

export async function importMediumBlogsBatch(
  blogs: { title: string; htmlContent: string }[],
  pathPrefix: string = "articles"
) {
  const session = await getSessionUser();
  if (!session) throw new Error("Unauthorized");

  const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced'
  });

  const prefix = pathPrefix.trim().replace(/^\/+|\/+$/g, ""); // remove leading/trailing slashes

  await Promise.allSettled(
    blogs.map(async (blog) => {
      let markdown = blog.htmlContent ? turndownService.turndown(blog.htmlContent) : "No content";
      const slug = normalizeSlug((prefix ? prefix + "/" : "") + blog.title);
      
      const existing = await db
        .select({ id: posts.id })
        .from(posts)
        .where(and(eq(posts.userId, session.id), eq(posts.slug, slug)))
        .limit(1);

      if (existing[0]) {
        await db.update(posts)
          .set({
            title: blog.title,
            content: markdown,
            updatedAt: new Date(),
          })
          .where(eq(posts.id, existing[0].id));
      } else {
        await db.insert(posts).values({
          userId: session.id,
          title: blog.title,
          slug: slug,
          content: markdown,
          status: "draft",
        });
      }
    })
  );

  revalidatePath(`/${session.username}`);
  revalidatePath("/write");
  return { username: session.username, count: blogs.length };
}
