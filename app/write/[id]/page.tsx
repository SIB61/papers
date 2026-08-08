import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { posts, users } from "@/lib/db/schema";
import { Editor } from "@/components/write/editor";
import { TailwindCdn } from "@/components/tailwind-cdn";
import { getSessionUser } from "@/lib/auth";
import { isThemeId, defaultTheme } from "@/lib/themes";

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

  // The published page resolves `data-theme` from the blog's siteTheme; mirror
  // that here so the editor preview matches what is published exactly.
  const user = (
    await db.select({ siteTheme: users.siteTheme }).from(users).where(eq(users.id, session.id)).limit(1)
  )[0];
  const theme = isThemeId(user?.siteTheme) ? user.siteTheme : defaultTheme;

  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){try{if(!localStorage.getItem("theme")){document.documentElement.setAttribute("data-theme","${theme}");}}catch(e){}})();`,
        }}
      />
      <TailwindCdn />
      <Editor post={post} username={session.username} />
    </>
  );
}