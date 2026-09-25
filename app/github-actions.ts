"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { posts, users } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

function normalizeSlug(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9\/_-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

export async function fetchGithubRepos() {
  const session = await getSessionUser();
  if (!session) throw new Error("Unauthorized");

  const [user] = await db
    .select({ github: users.github })
    .from(users)
    .where(eq(users.id, session.id))
    .limit(1);

  if (!user || !user.github) {
    throw new Error("No GitHub account linked. Please link your GitHub in the settings.");
  }

  // extract username
  let username = user.github.trim();
  if (username.startsWith("http")) {
    const url = new URL(username);
    username = url.pathname.split('/').filter(Boolean)[0];
  }

  if (!username) {
    throw new Error("Invalid GitHub username format");
  }

  const res = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=100`, {
    headers: {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "Antigravity-Agent",
    },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch repositories from GitHub");
  }

  const data = await res.json();
  return data.map((repo: any) => ({
    id: repo.id,
    name: repo.name,
    description: repo.description,
    fullName: repo.full_name,
  }));
}

export async function importGithubRepo(repoFullName: string, repoName: string) {
  const session = await getSessionUser();
  if (!session) throw new Error("Unauthorized");

  const res = await fetch(`https://api.github.com/repos/${repoFullName}/readme`, {
    headers: {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "Antigravity-Agent",
    },
  });

  let content = "No README found for this repository.";
  if (res.ok) {
    const data = await res.json();
    if (data.content && data.encoding === "base64") {
      content = Buffer.from(data.content, "base64").toString("utf-8");
    }
  }

  const slug = normalizeSlug(`projects/${repoName}`);

  // check if exists
  const existing = await db
    .select({ id: posts.id })
    .from(posts)
    .where(and(eq(posts.userId, session.id), eq(posts.slug, slug)))
    .limit(1);

  if (existing[0]) {
    // update
    await db.update(posts)
      .set({
        title: repoName,
        content: content,
        updatedAt: new Date(),
      })
      .where(eq(posts.id, existing[0].id));
  } else {
    // insert
    await db.insert(posts).values({
      userId: session.id,
      title: repoName,
      slug: slug,
      content: content,
      status: "published",
    });
  }

  revalidatePath(`/${session.username}`);
  return { slug, username: session.username };
}
