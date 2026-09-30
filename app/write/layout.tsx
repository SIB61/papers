import { db } from "@/lib/db";
import { posts } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { FileExplorerSidebar } from "@/components/write/file-explorer-sidebar";
import { SidebarProvider } from "@/components/write/sidebar-context";

import { WriteHeader } from "@/components/write-header";

export const dynamic = "force-dynamic";

export default async function WriteLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionUser();
  if (!session) redirect("/login");

  let allPosts = await db
    .select({
      id: posts.id,
      title: posts.title,
      slug: posts.slug,
      status: posts.status,
      showOnProfile: posts.showOnProfile,
      enableInteractions: posts.enableInteractions,
    })
    .from(posts)
    .where(eq(posts.userId, session.id))
    .orderBy(desc(posts.updatedAt));

  if (!allPosts.find(p => p.slug === "")) {
    const [root] = await db.insert(posts).values({
      userId: session.id,
      title: "Home",
      slug: "",
      status: "draft",
    }).returning({
      id: posts.id,
      title: posts.title,
      slug: posts.slug,
      status: posts.status,
      showOnProfile: posts.showOnProfile,
      enableInteractions: posts.enableInteractions,
    });
    allPosts = [root, ...allPosts];
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen flex-col overflow-hidden bg-background">
        <WriteHeader />
        <div className="flex flex-1 overflow-hidden">
          <FileExplorerSidebar posts={allPosts} username={session.username} />
          <main className="flex-1 flex flex-col h-full overflow-y-auto relative bg-background/50">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
