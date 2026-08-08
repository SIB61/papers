import type { Plugin } from "unified";
import type { Element, Root, Text } from "hast";

// CommonMark parses raw HTML blocks as-is, so markdown markers written inside
// authored/generated HTML elements are shown literally. This plugin converts the
// most common inline markdown syntax found inside text nodes into real HTML
// elements, so things like:
//
//   <div class="text-lg">... since **2021** (5+ years)</div>
//
// render the bold, emphasised, inline-code and link parts correctly.

const PROTECTED_TAGS = new Set([
  "a",
  "code",
  "kbd",
  "pre",
  "samp",
  "script",
  "style",
  "textarea",
  "title",
  "tt",
]);

const CODE = /^`([^`]+)`/;
const STRONG = /^\*\*([\s\S]*?)\*\*/;
const EM_STAR = /^\*([^*\n]+)\*/;
const EM_UNDERSCORE = /^_([^_\n]+)_/;
const LINK = /^\[([^[\]()\n]+)\]\(([^()\s]+)\)/;

function element(tagName: string, value: string): Element {
  return {
    type: "element",
    tagName,
    properties: {},
    children: [{ type: "text", value }],
  };
}

function parseInlines(text: string): Array<Element | Text> {
  const out: Array<Element | Text> = [];
  let i = 0;
  let plainStart = 0;

  const flush = () => {
    if (i > plainStart) {
      out.push({ type: "text", value: text.slice(plainStart, i) });
    }
  };

  while (i < text.length) {
    const rest = text.slice(i);
    let match: RegExpMatchArray | null = null;
    let node: Element | null = null;

    if ((match = rest.match(CODE))) {
      node = element("code", match[1]);
    } else if ((match = rest.match(STRONG))) {
      node = element("strong", match[1]);
    } else if ((match = rest.match(EM_STAR))) {
      node = element("em", match[1]);
    } else if ((match = rest.match(EM_UNDERSCORE))) {
      node = element("em", match[1]);
    } else if ((match = rest.match(LINK))) {
      node = {
        type: "element",
        tagName: "a",
        properties: { href: match[2] },
        children: [{ type: "text", value: match[1] }],
      };
    }

    if (node && match) {
      flush();
      out.push(node);
      i += match[0].length;
      plainStart = i;
    } else {
      i += 1;
    }
  }

  flush();
  return out;
}

function hasMarkdownSyntax(value: string): boolean {
  return /[*_`[\]]/.test(value);
}

function processChildren(children: Element["children"], protectedAncestor: boolean): void {
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (child.type === "element") {
      const isProtected = protectedAncestor || PROTECTED_TAGS.has(child.tagName);
      processChildren(child.children as Element["children"], isProtected);
    } else if (child.type === "text" && !protectedAncestor) {
      const value = (child as Text).value;
      if (!value || !hasMarkdownSyntax(value)) continue;
      const inlines = parseInlines(value);
      const changed =
        inlines.length !== 1 ||
        inlines[0].type !== "text" ||
        (inlines[0] as Text).value !== value;
      if (!changed) continue;
      children.splice(i, 1, ...inlines);
      i += inlines.length - 1;
    }
  }
}

export const rehypeInlineMarkdown: Plugin<[], Root> = () => (tree) => {
  processChildren(tree.children as Element["children"], false);
};
