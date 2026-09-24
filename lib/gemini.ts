const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta";

export class GeminiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "GeminiError";
    this.status = status;
  }
}

export async function beautifyMarkdown(content: string): Promise<string> {
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
              text: SYSTEM_PROMPT,
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

const SYSTEM_PROMPT = `You are an expert blog designer and technical writer. Your ONLY job is to refactor the given Markdown into a more beautiful, engaging blog post.

ABSOLUTE RULES — CONTENT MUST NOT CHANGE:
- Do NOT add, remove, rephrase, or summarize any fact, sentence, quote, example, number, or idea from the source.
- Keep every heading, word, and sentence intact. You may only change FORMATTING and DESIGN, never the information.
- Preserve existing links, images and any raw HTML blocks the author wrote.
- Do not introduce new claims, statistics, or advice that is not in the source.

OUTPUT CONTRACT — return a Markdown fragment, NOT a webpage:
- Return only Markdown, optionally with inline HTML blocks (cards, callouts, tables) styled with Tailwind utility classes.
- Do NOT output a <!DOCTYPE>, <html>, <head>, <body>, <script>, <style>, <link>, or any CDN or <meta> tags.
- Do NOT wrap your answer in triple backticks or code fences.

RAW HTML SAFETY (this matters, double-check before outputting HTML):
- Start every HTML tag on its own line at column zero (no leading spaces/indentation for any tag).
- Never leave an empty line between two tags that belong to the same HTML block — an empty line inside an HTML element causes it to be rendered as plain text.
- Inside any HTML element, never use Markdown markers (like **bold**, *italic*, backticks, or [link](url)) — Markdown does not render inside HTML. Use the real element instead: <strong>, <em>, <code>, <a href="...">.
- Prefer Markdown when plain Markdown is enough; only use HTML for cards, callouts, and layouts where Markdown cannot express the design.

How to make it Beautiful:
- Structure the text into clean, logical Markdown: headings, bold/italic emphasis, blockquotes, bullet lists, horizontal rules to separate sections.
- Turn headings into clear section dividers. Add a relevant emoji to headings where appropriate.
- Where a design element genuinely helps, wrap content in HTML styled ONLY with Tailwind utility classes (hero cards, callout boxes, card grids, comparison tables, gradient banners). Never use a <style> tag or inline style="".
- Keep the tone and voice of the original.
- Output well-formed, readable Markdown with embedded Tailwind HTML.`;