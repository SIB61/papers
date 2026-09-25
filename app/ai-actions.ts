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
  Website: ${user.website}

  Projects:
  ${projects.map(p => `- ${p.title}:\n  ${p.content.substring(0, 500)}...`).join('\n\n')}

  Articles / Writings:
  ${articles.map(p => `- ${p.title}:\n  ${p.content.substring(0, 500)}...`).join('\n\n')}
  `;

    const prompt = `
  You are an expert web designer and personal branding specialist. 
  Your task is to design a stunning, modern personal portfolio page using raw HTML and Tailwind CSS classes inside Markdown.
  
  User Data:
  ${context}

  Instructions:
  1. DEDUCE THE ROLE: Analyze the user's projects and writings to determine their precise profession (e.g., Full-Stack Engineer, Data Scientist, UI/UX Designer, etc).
  2. TONE: Professional, confident, and highly engaging.
  3. LAYOUT & DESIGN (CRITICAL): Do NOT just write a standard markdown text document. The renderer supports raw HTML and Tailwind CSS.
     - Use raw HTML with Tailwind classes (e.g., <div class="grid grid-cols-1 md:grid-cols-2 gap-6">) for layouts. Note: use 'class' since this is raw HTML, not JSX.
     - Create a beautiful Hero section introducing their deduced role and mission.
     - Create a "Skills & Tech Stack" section using a flex wrap of stylish badges.
     - Create a "Featured Work" section using modern card layouts (e.g. <div class="rounded-xl border bg-card p-6 shadow-sm">).
     - Use nice Tailwind utility classes for typography, spacing, borders, and colors (e.g., text-muted-foreground, bg-muted/50).
     - CRITICAL: Stick to standard Tailwind utility classes (e.g. flex, grid, md:grid-cols-2, p-4, gap-4, text-sm, font-medium, border, rounded-lg, shadow). Avoid obscure specific colors or spacing values that might not be in the pre-compiled CSS bundle.
  4. NO TOP-LEVEL H1: The page already displays their name at the top. Start directly with the Hero bio/intro.
  5. NO MARKDOWN CODEBLOCK WRAPPERS: Output the raw HTML/Markdown directly. Do NOT wrap the entire output in 'html' or 'markdown' tags.

  Go ahead and generate a highly visual and structured portfolio layout.
  `;

  const ai = new GoogleGenAI({});
  
  try {
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-3.8-flash",
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
