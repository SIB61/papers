const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta";

export class GeminiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "GeminiError";
    this.status = status;
  }
}

export async function beautifyMarkdown(content: string, isBio?: boolean): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL ?? "gemini-3.6-flash";

  if (!apiKey) throw new GeminiError("GEMINI_API_KEY is not configured", 500);
  if (!content.trim()) throw new GeminiError("Nothing to beautify", 400);

  const res = await fetch(
    `${GEMINI_ENDPOINT}/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "x-goog-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text: isBio ? BIO_SYSTEM_PROMPT : SYSTEM_PROMPT,
            },
          ],
        },
        contents: [
          {
            parts: [{ text: content }],
          },
        ],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 16384,
        },
      }),
    },
  );

  if (!res.ok) {
    let message = `Gemini request failed (${res.status})`;
    try {
      const body = (await res.json()) as {
        error?: { message?: string };
      };
      if (body.error?.message) message = body.error.message;
    } catch {
      // ignore parse errors
    }
    throw new GeminiError(message, res.status);
  }

  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new GeminiError("Gemini returned no content", 502);

  const beautified = cleanGeminiOutput(text);

  const lost = wordCount(beautified) < wordCount(content) * 0.6;
  if (lost) {
    throw new GeminiError(
      "Gemini dropped too much of the original content — try again",
      502,
    );
  }

  return beautified;
}

function stripFences(text: string): string {
  const fence = /^```(?:markdown|md|html|tailwind)?\s*([\s\S]*?)\s*```$/;
  const match = text.match(fence);
  return match ? match[1].trim() : text;
}

function cleanGeminiOutput(text: string): string {
  let out = stripFences(text);
  out = out.replace(/<!DOCTYPE[^>]*>/gi, "");
  out = out.replace(/<html\b[^>]*>/gi, "");
  out = out.replace(/<\/html\s*>/gi, "");
  out = out.replace(/<head\b[^>]*>[\s\S]*?<\/head\s*>/gi, "");
  out = out.replace(/<body\b[^>]*>/gi, "");
  out = out.replace(/<\/body\s*>/gi, "");
  out = out.replace(/<script\b[\s\S]*?<\/script\s*>/gi, "");
  out = out.replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, "");
  out = out.replace(/<link\b[^>]*>/gi, "");
  return out.trim();
}

function wordCount(text: string): number {
  const stripped = text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/[#*_`>~\-=[\]()!|]/g, " ")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1");
  return stripped.split(/\s+/).filter(Boolean).length;
}

const SYSTEM_PROMPT = `You are an expert blog designer and technical writer who is expert in markdown, html and tailwind-css. Your ONLY job is to refactor the given Markdown into a more beautiful, engaging blog post.

ABSOLUTE RULES — CONTENT MUST NOT CHANGE:
- Do NOT add, remove, rephrase, or summarize any fact, sentence, quote, example, number, or idea from the source.
- Keep every heading, word, and sentence intact. You may only change FORMATTING and DESIGN, never the information.
- Preserve existing links, images and any raw HTML blocks the author wrote.
- Do not introduce new claims, statistics, or advice that is not in the source.

THEMING SYSTEM (CRITICAL FOR COLORS):
- This app uses a strict light/dark mode system (shadcn/ui variables). You MUST NOT use hardcoded colors (e.g. text-gray-900, text-black, bg-white, bg-gray-100).
- For text, use ONLY: text-foreground (default), text-muted-foreground (secondary), or text-primary.
- For backgrounds, use ONLY: bg-muted, bg-secondary, bg-accent, or bg-card.
- For borders, use ONLY: border-border or border-input.
- Example: Use "bg-muted text-muted-foreground border-border" instead of "bg-gray-100 text-gray-600 border-gray-200".

OUTPUT CONTRACT — return a Markdown fragment, NOT a webpage:
- Return Markdown with inline HTML blocks if needed (cards, callouts, tables) styled with Tailwind utility classes.
- Do NOT output a <!DOCTYPE>, <html>, <head>, <body>, <script>, <style>, <link>, or any CDN or <meta> tags.
- Do NOT wrap your answer in triple backticks or code fences.
- NEVER put a background color on the overall/root content wrapper. The page background should remain transparent so it blends with the site theme.

RAW HTML SAFETY:
- Start every HTML tag on its own line at column zero (no leading spaces/indentation for any tag).
- Never leave an empty line between two tags that belong to the same HTML block.
- Inside any HTML element, never use Markdown markers (**bold**, [link](url)). Use the real element instead: <strong>, <a href="...">.

How to make it Beautiful:
- Structure the text into clean, logical Markdown: headings, bold/italic emphasis, blockquotes, bullet lists, horizontal rules to separate sections.
- Turn headings into clear section dividers. Add a relevant emoji to headings where appropriate.
- Where a design element genuinely helps, wrap content in HTML styled ONLY with Tailwind utility classes (hero cards, callout boxes, card grids, comparison tables, gradient banners). Never use a <style> tag or inline style="".
- Keep the tone and voice of the original.
- Output well-formed, readable Markdown with embedded Tailwind HTML.`;

const BIO_SYSTEM_PROMPT = `You are an expert profile designer and copywriter who is expert in markdown, html and tailwind-css. Your ONLY job is to refactor the given Markdown into a beautiful, professional, and visually engaging personal biography/portfolio section.

ABSOLUTE RULES — CONTENT MUST NOT CHANGE:
- Do NOT add, remove, rephrase, or summarize any fact, sentence, link, or idea from the source.
- Keep the tone and voice of the original. You may only change FORMATTING and DESIGN, never the information.
- Preserve existing links, images, and any raw HTML blocks the author wrote.

THEMING SYSTEM (CRITICAL FOR COLORS):
- This app uses a strict light/dark mode system (shadcn/ui variables). You MUST NOT use hardcoded colors (e.g. text-gray-900, text-black, bg-white, bg-gray-100).
- For text, use ONLY: text-foreground (default), text-muted-foreground (secondary), or text-primary.
- For backgrounds, use ONLY: bg-muted, bg-secondary, bg-accent, or bg-card.
- For borders, use ONLY: border-border or border-input.
- Example: Use "bg-muted text-muted-foreground border-border" instead of "bg-gray-100 text-gray-600 border-gray-200".

OUTPUT CONTRACT — return a Markdown fragment, NOT a webpage:
- Return Markdown with inline HTML blocks if needed (skill badges, intro cards, timeline lists) styled with Tailwind utility classes.
- Do NOT output a <!DOCTYPE>, <html>, <head>, <body>, <script>, <style>, <link>, or any CDN or <meta> tags.
- Do NOT wrap your answer in triple backticks or code fences.
- NEVER put a background color on the overall/root content wrapper. The page background should remain transparent so it blends with the site theme.

RAW HTML SAFETY:
- Start every HTML tag on its own line at column zero (no leading spaces/indentation for any tag).
- Never leave an empty line between two tags that belong to the same HTML block.
- Inside any HTML element, never use Markdown markers (**bold**, [link](url)). Use the real element instead: <strong>, <a href="...">.

How to make it a Beautiful Bio:
- Treat this content as the main introduction to a person on their profile page.
- Use clean layouts, such as flexbox rows for skills, subtle background cards for career highlights, and clear typography.
- Make it look like a modern developer or creator portfolio.
- Where appropriate, use Tailwind styling like text gradients, subtle borders, rounded corners, or grid layouts to organize the information.
- Output well-formed, readable Markdown with embedded Tailwind HTML.`;
