"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { posts, users } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { GoogleGenAI } from "@google/genai";

export async function generatePortfolio() {
  const session = await getSessionUser();
  if (!session) throw new Error("Unauthorized");

  const [user] = await db.select().from(users).where(eq(users.id, session.id)).limit(1);
  if (!user) throw new Error("User not found");

  const userPosts = await db.select().from(posts).where(
    and(eq(posts.userId, session.id), eq(posts.status, "published"))
  );

  const projects = userPosts.filter(p => p.slug.startsWith("projects/"));
  const articles = userPosts.filter(p => p.slug.startsWith("blogs/") || (!p.slug.startsWith("projects/") && p.slug !== "portfolio"));

  const context = `
  User Name: ${user.name}
  Email: ${user.contactEmail || user.email}
  GitHub: ${user.github}
  LinkedIn: ${user.linkedin}
  Twitter: ${user.twitter}
  Website: ${user.website}\n  Current Site Theme: ${user.siteTheme}

  Projects:
  ${projects.map(p => `- Title: ${p.title}\n  Slug: ${p.slug.replace("projects/", "")}\n  Description: ${p.content.substring(0, 500)}...`).join('\n\n')}

  Articles / Writings:
  ${articles.map(p => `- Title: ${p.title}\n  Slug: ${p.slug.replace("blogs/", "")}\n  Description: ${p.content.substring(0, 500)}...`).join('\n\n')}
  `;

      const prompt = `
  You are an expert web designer, developer, and personal branding specialist. 
  Your task is to design a stunning, modern personal portfolio page using raw HTML and Tailwind CSS classes.
  
  User Data:
  ${context}

  CRITICAL INSTRUCTIONS:
  1. DEDUCE THE ROLE: Analyze the user's projects and writings to determine their precise profession.
  2. TONE & THEME: Professional, confident, and highly engaging. Write in first-person ("I am..."). The user's current site theme is "${user.siteTheme}".
  3. COLOR SYSTEM (CRITICAL FOR DARK MODE): NEVER hardcode specific colors like 'bg-white', 'text-black', 'bg-gray-100', 'text-slate-800', etc. You MUST EXCLUSIVELY use the following semantic Tailwind classes so the page automatically adapts to dark mode and the user's selected theme:
     - Backgrounds: 'bg-background', 'bg-card', 'bg-muted', 'bg-secondary', 'bg-primary/10'
     - Text: 'text-foreground', 'text-muted-foreground', 'text-primary'
     - Borders: 'border-border', 'border-muted'
  4. LAYOUT TEMPLATE: You MUST structure your output heavily around this raw HTML/Tailwind template. Do not just write markdown text. Use 'class' instead of 'className'.

  <div class="flex flex-col gap-16 py-8">
    <!-- Hero Section -->
    <section class="flex flex-col items-start space-y-4">
      <h2 class="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">[Deduced Role / Catchy Tagline]</h2>
      <p class="text-lg text-muted-foreground max-w-2xl leading-relaxed">
        [2-3 sentences summarizing their experience, mission, and unique value based on their projects]
      </p>
    </section>

    <!-- Skills Section -->
    <section>
      <h3 class="text-xl font-bold mb-4 text-foreground">Core Expertise</h3>
      <div class="flex flex-wrap gap-2">
        <!-- Generate these based on their projects -->
        <span class="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-medium border border-primary/20">Skill 1</span>
        <span class="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-medium border border-primary/20">Skill 2</span>
      </div>
    </section>

    <!-- Projects Grid -->
    <section>
      <h3 class="text-xl font-bold mb-6 text-foreground">Featured Projects</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Iterate over their top projects -->
        <a href="/${session.username}/projects/[slug]" class="flex flex-col p-6 rounded-2xl border border-border bg-card hover:bg-muted/50 transition-colors shadow-sm">
          <h4 class="font-bold text-lg mb-2 text-foreground">Project Name</h4>
          <p class="text-sm text-muted-foreground line-clamp-3">Description...</p>
        </a>
      </div>
    </section>
    
    <!-- Writings/Articles -->
    <section>
      <h3 class="text-xl font-bold mb-6 text-foreground">Recent Writings</h3>
      <div class="grid grid-cols-1 gap-4">
        <!-- Iterate over their top articles -->
        <a href="/${session.username}/blogs/[slug]" class="p-5 rounded-2xl border border-border hover:border-primary/50 transition-colors">
          <h4 class="font-medium text-foreground">Article Title</h4>
        </a>
      </div>
    </section>
  </div>

  4. NO TOP-LEVEL H1: The page already displays their name at the top. Start with the Hero section.
  5. OUTPUT FORMAT: Output ONLY the raw HTML/Markdown. Do NOT wrap it in 'html' or 'markdown' codeblocks! Just the raw content so it renders immediately.
  `;

  const ai = new GoogleGenAI({});
  
  try {
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-1.5-pro",
      contents: prompt,
    });
    
    if (response.text) {
      await db.update(users).set({ portfolio: response.text }).where(eq(users.id, session.id));
      revalidatePath(`/${session.username}`);
      return { success: true };
    }
    return { success: false, error: "No response from AI" };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to generate portfolio" };
  }
}
