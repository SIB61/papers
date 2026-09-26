import { db } from "@/lib/db";
import { posts } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { FileExplorerSidebar } from "@/components/write/file-explorer-sidebar";
import { SidebarProvider } from "@/components/write/sidebar-context";

export const dynamic = "force-dynamic";

export default async function WriteLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionUser();
  if (!session) redirect("/login");

  const allPosts = await db
    .select({
      id: posts.id,
      title: posts.title,
      slug: posts.slug,
      status: posts.status,
      showOnProfile: posts.showOnProfile,
    })
    .from(posts)
    .where(eq(posts.userId, session.id))
    .orderBy(desc(posts.updatedAt));

  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <FileExplorerSidebar posts={allPosts} />
        <main className="flex-1 flex flex-col h-screen overflow-y-auto relative bg-background/50">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
