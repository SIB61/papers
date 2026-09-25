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
  You are an expert personal branding and portfolio designer. 
  Analyze the user's projects, writings, and profile data to deduce their profession, core skills, and unique value proposition.
  Write a stunning, well-structured Markdown portfolio page for them.
  
  Requirements:
  - Do not use a main # Title at the very top (it will be embedded in a page that already has their name). Start with a compelling summary or hero section.
  - Highlight their key skills in a visually appealing way (use bullet points or markdown tables).
  - Showcase their best projects and writings. (Don't hallucinate links if they don't exist, just mention the titles and what they do).
  - Include a call to action or contact section at the bottom.
  - Write in first-person ("I am...", "My projects...") as if the user is speaking.
  - Be creative and use good markdown formatting (bold, italic, blockquotes).
  
  User Data:
  ${context}
  `;

  const ai = new GoogleGenAI({});
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
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
