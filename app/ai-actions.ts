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

  const filteredPosts = userPosts.filter(p => p.slug !== "portfolio");

  const context = `
  User Name: ${user.name}
  Email: ${user.contactEmail || user.email}
  GitHub: ${user.github}
  LinkedIn: ${user.linkedin}
  Twitter: ${user.twitter}
  Website: ${user.website}\n  Current Site Theme: ${user.siteTheme}

  User's Published Content:
  ${filteredPosts.map(p => `- Title: ${p.title}\n  URL Slug: ${p.slug}\n  Description: ${p.content.substring(0, 500)}...`).join('\n\n')}
  `;

            const prompt = `
  You are an elite, world-class UI/UX Designer and Personal Branding Specialist (think Apple, Vercel, or Stripe design aesthetics).
  Your task is to design an ultra-modern, incredibly elegant, and highly polished personal portfolio page.
  The output MUST be fully populated raw HTML heavily stylized with Tailwind CSS.

  User Data:
  ${context}

  DESIGN CONSTRAINTS & AESTHETICS (STRICT):
  1. STRICT HTML ONLY: You are generating a static HTML document, NOT a React component. Do NOT use JSX, mapping functions, or JavaScript interpolations.
     - BAD: <div class="skills">{['React'].map(s => <span>{s}</span>)}</div>
     - GOOD: <div class="skills"><span>React</span></div>
  2. COMPLETE THE DESIGN: You MUST fully populate all data. Do NOT leave HTML comments like "<!-- Projects Section -->" or placeholders. Write out the actual HTML elements for every single item provided in the User Data.
  3. THEME AWARENESS & COLOR CONTRAST: The user's current site theme is "${user.siteTheme}". You MUST EXCLUSIVELY use semantic Tailwind classes (bg-background, bg-card, bg-muted, text-foreground, text-muted-foreground, border-border, text-primary). 
     - CRITICAL CONTRAST RULE: If a button or badge uses \`bg-primary\`, its text MUST be \`text-primary-foreground\`. If it uses \`bg-primary/10\`, use \`text-primary\`. NEVER make the background and text the same color.
     - NEVER hardcode specific hex colors, 'white', 'black', 'gray', or 'slate'.
  4. TYPOGRAPHY: Use elegant, highly legible typography. 
     - Hero text should be striking (e.g., text-4xl md:text-6xl font-extrabold tracking-tighter).
     - Paragraphs should have high readability (e.g., text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl).
  5. WHITESPACE & SPACING: Embrace negative space. Use generous padding and margins (e.g., py-20, gap-12, space-y-8) to create a premium feel.
  6. MODERN UI ELEMENTS:
     - Use soft rounded corners (rounded-2xl or rounded-3xl for cards, rounded-full for badges).
     - Use subtle, elegant borders (border border-border/60).
     - Add sophisticated hover effects to all clickable elements (hover:bg-muted/40 hover:border-border transition-all duration-300).
     - Group skills into elegant pills/badges.
    7. DYNAMIC LAYOUT & SECTIONS: Analyze the URL Slugs of the User's Content.
     - Slugs have prefixes denoting their category (e.g., 'projects/...', 'blogs/...', 'achievements/...').
     - You MUST dynamically design distinct, beautiful UI sections for EACH category you find (e.g. a "Projects" grid, an "Achievements" showcase, a "Writings" list).
     - Group skills into a clean, wrapped flex layout of tech stack/expertise.
     - For content cards, include actual href links using the provided slugs exactly, prefixed by '/${session.username}/' (e.g., href="/${session.username}/projects/my-app"). Make them look like premium components (p-8 rounded-3xl border border-border/50 bg-card hover:shadow-sm transition-all).

  OUTPUT FORMAT:
  - Output ONLY the raw HTML content. DO NOT wrap it in 'html' or 'markdown' codeblocks!
  - Use 'class' instead of 'className'.
  - Be extraordinarily creative and design a fully populated masterpiece layout.
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
