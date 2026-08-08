import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeHighlight from "rehype-highlight";
import rehypeSanitize from "rehype-sanitize";
import { defaultSchema, type Schema } from "hast-util-sanitize";
import { normalizeRawHtmlBlocks } from "@/lib/markdown-html";
import { rehypeInlineMarkdown } from "@/components/rehype-inline-markdown";

// Defaults follow GitHub-style sanitation: they strip <script>, event handler
// attributes, `javascript:` URLs, unknown tags, and restrict classes. We extend
// the schema so authored HTML can use any Tailwind class and inline CSS without
// letting scripts back in.
//
// The base schema restricts `className` on a few tags (e.g. `a` only allows
// `data-footnote-backref`). Because an attribute with a restricted value yields
// an empty result (which blocks the `*` fallback), we prepend a bare
// `className` to any tag that lists one — first match wins, so any class is
// allowed there too.
function buildSchema(): Schema {
  const base = defaultSchema.attributes ?? {};
  const attributes: NonNullable<Schema["attributes"]> = {};

  for (const [tag, defs] of Object.entries(base)) {
    const list = defs.map((def) => def);
    if (
      tag !== "*" &&
      list.some((def) => Array.isArray(def) && def[0] === "className")
    ) {
      list.unshift("className");
    }
    if (tag === "*") list.push("className", "style");
    attributes[tag] = list;
  }

  return {
    ...defaultSchema,
    attributes,
    tagNames: [...(defaultSchema.tagNames ?? []), "style"],
  };
}

const schema = buildSchema();

export default function Markdown({ children }: { children: string }) {
  return (
    <div className="blog-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          rehypeRaw,
          rehypeInlineMarkdown,
          [rehypeSanitize, schema],
          [rehypeHighlight, { detect: true, ignoreMissing: true }],
        ]}
      >
        {normalizeRawHtmlBlocks(children)}
      </ReactMarkdown>
    </div>
  );
}