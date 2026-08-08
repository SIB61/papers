import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { posts } from "@/lib/db/schema";
import { Editor } from "@/components/write/editor";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function WriteEditPage({ params }: PageProps<"/write/[id]">) {
  const session = await getSessionUser();
  if (!session) redirect("/login");

  const { id } = await params;
  const numId = Number(id);
  if (!Number.isInteger(numId)) notFound();

  const post = (
    await db
      .select()
      .from(posts)
      .where(eq(posts.id, numId))
      .limit(1)
  )[0];

  if (!post) notFound();
  const owns = post.userId === session.id;
  if (!owns) notFound();

  return <Editor post={post} username={session.username} />;
}