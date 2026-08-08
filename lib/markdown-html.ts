// CommonMark ends a raw HTML block at the first blank line, and any line
// indented with 4+ spaces then becomes an indented code block. So an authored
// line like
//
//     <p class="rounded-2xl ...">
//
// that is indented and separated from its <div> by a blank line is rendered as
// literal source text instead of HTML. To keep authored/generated HTML working,
// we de-indent any line that begins (after optional whitespace) with an opening
// or closing HTML tag of a known element. Indentation inside raw HTML carries no
// meaning, so this is safe; markdown that is not tag-only stays untouched.

const HTML_TAG_START = /^[ \t]*<(\/?)([a-zA-Z][a-zA-Z0-9-]*)\b/;

const KNOWN_TAGS = new Set([
  "a",
  "abbr",
  "address",
  "article",
  "aside",
  "audio",
  "b",
  "blockquote",
  "body",
  "br",
  "button",
  "canvas",
  "caption",
  "center",
  "code",
  "dd",
  "del",
  "details",
  "dialog",
  "div",
  "dl",
  "dt",
  "em",
  "fieldset",
  "figcaption",
  "figure",
  "footer",
  "form",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "header",
  "hgroup",
  "hr",
  "html",
  "i",
  "iframe",
  "img",
  "input",
  "kbd",
  "label",
  "legend",
  "li",
  "link",
  "main",
  "mark",
  "menu",
  "nav",
  "ol",
  "optgroup",
  "option",
  "p",
  "picture",
  "pre",
  "q",
  "s",
  "section",
  "select",
  "small",
  "span",
  "strong",
  "sub",
  "summary",
  "sup",
  "table",
  "tbody",
  "td",
  "template",
  "textarea",
  "tfoot",
  "th",
  "thead",
  "time",
  "title",
  "tr",
  "u",
  "ul",
  "video",
]);

export function normalizeRawHtmlBlocks(markdown: string): string {
  const lines = markdown.split("\n");
  const out: string[] = [];
  let fence: string | null = null;

  for (const line of lines) {
    const fenceMatch = line.match(/^(\s*)(```+|~~~+)/);
    if (fenceMatch) {
      const marker = fenceMatch[2][0];
      if (fence === marker) fence = null;
      else if (fence === null) fence = marker;
      out.push(line);
      continue;
    }

    if (fence === null) {
      const match = line.match(HTML_TAG_START);
      if (match && KNOWN_TAGS.has(match[2].toLowerCase())) {
        const start = line.match(/^[ \t]*/)?.[0] ?? "";
        out.push(line.slice(start.length));
        continue;
      }
    }

    out.push(line);
  }

  return out.join("\n");
}