"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, count, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  comments,
  postLikes,
  posts,
  users,
  type PostStatus,
} from "@/lib/db/schema";
import { getSessionUser, type SessionUser } from "@/lib/auth";
import { beautifyMarkdown } from "@/lib/gemini";
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

export interface CommentWithAuthor {
  id: number;
  content: string;
  createdAt: Date;
  author: {
    id: number;
    name: string;
    username: string;
    image: string;
  };
}

async function getPostInteractionRow(postId: number) {
  return (
    await db
      .select({
        id: posts.id,
        slug: posts.slug,
        status: posts.status,
        ownerId: posts.userId,
        username: users.username,
      })
      .from(posts)
      .innerJoin(users, eq(posts.userId, users.id))
      .where(eq(posts.id, postId))
      .limit(1)
  )[0];
}

async function canInteract(
  postId: number,
  session: SessionUser,
): Promise<{ ok: boolean; username: string; slug: string } | null> {
  const post = await getPostInteractionRow(postId);
  if (!post) return null;
  if (post.status === "published" || post.ownerId === session.id) {
    return { ok: true, username: post.username, slug: post.slug };
  }
  return { ok: false, username: post.username, slug: post.slug };
}

function toCommentWithAuthor(
  comment: typeof comments.$inferSelect,
  author: { id: number; name: string; username: string; image: string },
): CommentWithAuthor {
  return {
    id: comment.id,
    content: comment.content,
    createdAt: comment.createdAt,
    author,
  };
}

export async function toggleLike(postId: number) {
  const session = await getSessionUser();
  if (!session) redirect("/login");

  const post = await canInteract(postId, session);
  if (!post) throw new Error("Post not found");
  if (!post.ok) throw new Error("Post is not public yet");

  const existing = await db
    .select({ id: postLikes.id })
    .from(postLikes)
    .where(and(eq(postLikes.postId, postId), eq(postLikes.userId, session.id)))
    .limit(1);

  let liked: boolean;
  if (existing[0]) {
    await db.delete(postLikes).where(eq(postLikes.id, existing[0].id));
    liked = false;
  } else {
    await db.insert(postLikes).values({ postId, userId: session.id });
    liked = true;
  }

  const [{ value: likeCount }] = await db
    .select({ value: count() })
    .from(postLikes)
    .where(eq(postLikes.postId, postId));

  revalidatePath(`/${post.username}/${post.slug}`);
  return { liked, likeCount: Number(likeCount) };
}

export async function addComment(postId: number, content: string) {
  const session = await getSessionUser();
  if (!session) redirect("/login");

  const post = await canInteract(postId, session);
  if (!post) throw new Error("Post not found");
  if (!post.ok) throw new Error("Post is not public yet");

  const trimmed = content.trim();
  if (!trimmed) throw new Error("Comment cannot be empty");
  if (trimmed.length > 2000) throw new Error("Comment is too long");

  const [comment] = await db
    .insert(comments)
    .values({ postId, userId: session.id, content: trimmed })
    .returning();

  revalidatePath(`/${post.username}/${post.slug}`);
  return {
    comment: toCommentWithAuthor(comment, {
      id: session.id,
      name: session.name,
      username: session.username,
      image: session.image,
    }),
  };
}

export async function deleteComment(commentId: number) {
  const session = await getSessionUser();
  if (!session) redirect("/login");

  const [comment] = await db
    .select({ id: comments.id, postId: comments.postId, userId: comments.userId })
    .from(comments)
    .where(eq(comments.id, commentId))
    .limit(1);
  if (!comment) throw new Error("Comment not found");

  const post = await getPostInteractionRow(comment.postId);
  if (!post) throw new Error("Post not found");
  if (comment.userId !== session.id && post.ownerId !== session.id) {
    throw new Error("You can only delete your own comments");
  }

  await db.delete(comments).where(eq(comments.id, commentId));

  revalidatePath(`/${post.username}/${post.slug}`);
  return { ok: true };
}

export async function beautifyContent(content: string) {
  const session = await getSessionUser();
  if (!session) redirect("/login");

  if (!content || !content.trim()) {
    throw new Error("Write some content before beautifying");
  }

  const beautified = await beautifyMarkdown(content);
  return { content: beautified };
}

export async function getPostComments(postId: number) {
  const rows = await db
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
    .where(eq(comments.postId, postId))
    .orderBy(desc(comments.createdAt))
    .limit(200);

  return rows.map((row) =>
    toCommentWithAuthor(
      { id: row.id, content: row.content, createdAt: row.createdAt } as typeof comments.$inferSelect,
      { id: row.userId, name: row.name, username: row.username, image: row.image },
    ),
  );
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

export async function deletePost(id: number, shouldRedirect: boolean = true) {
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
  revalidatePath(`/${session.username}`);
  
  if (shouldRedirect) {
    redirect("/write");
  }
}

export async function updateSocialLinks(data: { twitter: string; github: string; linkedin: string; medium: string; website: string; contactEmail: string; whatsapp: string }) {
  const session = await getSessionUser();
  if (!session) redirect("/login");

  await db
    .update(users)
    .set({
      twitter: data.twitter.trim(),
      github: data.github.trim(),
      linkedin: data.linkedin.trim(),
      medium: data.medium.trim(),
      website: data.website.trim(),
      contactEmail: data.contactEmail.trim(),
      whatsapp: data.whatsapp.trim(),
      updatedAt: new Date(),
    })
    .where(eq(users.id, session.id));

  revalidatePath(`/${session.username}`);
  return { ok: true };
}

export async function updateAccountDetails(data: { name: string; username: string; image: string }) {
  const session = await getSessionUser();
  if (!session) redirect("/login");

  const newUsername = normalizeSlug(data.username);
  if (!newUsername) throw new Error("Username cannot be empty");

  // Check if username is already taken by another user
  const clash = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, newUsername))
    .limit(1);

  if (clash[0] && clash[0].id !== session.id) {
    throw new Error(`Username /${newUsername} is already taken.`);
  }

  const oldUser = (await db.select({ username: users.username }).from(users).where(eq(users.id, session.id)).limit(1))[0];

  await db
    .update(users)
    .set({
      name: data.name.trim(),
      username: newUsername,
      image: data.image.trim(),
      updatedAt: new Date(),
    })
    .where(eq(users.id, session.id));

  // Revalidate the old path if the username changed
  if (oldUser.username !== newUsername) {
    revalidatePath(`/${oldUser.username}`);
  }
  
  revalidatePath(`/${newUsername}`);
  
  // if username changes, we also probably want to tell the frontend to redirect
  return { ok: true, username: newUsername };
}
