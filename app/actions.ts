"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { posts, users, type PostStatus } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth";
import { isThemeId } from "@/lib/themes";
import { normalizeSlug } from "@/lib/slug";

export interface PostInput {
  title: string;
  slug: string;
  content: string;
  status: PostStatus;
}

function canEdit(userId: number, ownerId: number): boolean {
  return userId === ownerId;
}

export async function createPost() {
  const session = await getSessionUser();
  if (!session) redirect("/login");

  const slug = `draft-${Date.now().toString(36)}`;
  const [created] = await db
    .insert(posts)
    .values({ title: "Untitled", slug, status: "draft", userId: session.id })
    .returning();
  revalidatePath("/write");
  redirect(`/write/${created.id}`);
}

export async function updatePost(id: number, input: PostInput) {
  const session = await getSessionUser();
  if (!session) redirect("/login");

  const existing = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
  if (!existing[0] || !canEdit(session.id, existing[0].userId)) {
    throw new Error("You don't have permission to edit this page");
  }

  const slug = normalizeSlug(input.slug);
  if (!slug) throw new Error("Path cannot be empty");

  const clash = await db
    .select({ id: posts.id })
    .from(posts)
    .where(and(eq(posts.userId, session.id), eq(posts.slug, slug)))
    .limit(1);
  if (clash[0] && clash[0].id !== id) {
    throw new Error(`Another post already uses the path /${session.username}/${slug}`);
  }

  await db
    .update(posts)
    .set({
      title: input.title.trim() || "Untitled",
      slug,
      content: input.content,
      status: input.status,
      updatedAt: new Date(),
    })
    .where(eq(posts.id, id));

  revalidatePath("/");
  revalidatePath("/write");
  revalidatePath(`/${session.username}/${slug}`);
  return { slug };
}

export async function updateSiteTheme(theme: string) {
  const session = await getSessionUser();
  if (!session) redirect("/login");
  if (!isThemeId(theme)) throw new Error("Unknown theme");

  await db
    .update(users)
    .set({ siteTheme: theme, updatedAt: new Date() })
    .where(eq(users.id, session.id));

  revalidatePath(`/${session.username}`);
  return { theme };
}

export async function deletePost(id: number) {
  const session = await getSessionUser();
  if (!session) redirect("/login");

  const existing = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
  if (!existing[0] || !canEdit(session.id, existing[0].userId)) {
    throw new Error("You don't have permission to delete this page");
  }

  await db.delete(posts).where(eq(posts.id, id));
  revalidatePath("/");
  revalidatePath("/write");
  revalidatePath(`/${session.username}/${existing[0].slug}`);
  redirect("/write");
}

export async function duplicateFromTemplate(id: number) {
  const session = await getSessionUser();
  if (!session) redirect("/login");

  const template = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
  if (!template[0] || !canEdit(session.id, template[0].userId)) return;

  const slug = `${template[0].slug}-copy-${Date.now().toString(36)}`;
  const [created] = await db
    .insert(posts)
    .values({
      title: template[0].title,
      slug,
      content: template[0].content,
      status: "draft",
      userId: session.id,
    })
    .returning();
  revalidatePath("/write");
  redirect(`/write/${created.id}`);
}