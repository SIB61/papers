"use client";

import { useEffect, useState } from "react";

const PHRASES = ["portfolio/cv", "everything is a page", "project/blog notes", "any markdown"];

export function Hero() {
  const [text, setText] = useState("");
  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    const phrase = PHRASES[phraseIndex % PHRASES.length];
    let i = 0;
    let deleting = false;
    let timer: ReturnType<typeof setTimeout>;

    const tick = () => {
      if (!deleting) {
        i += 1;
        setText(phrase.slice(0, i));
        if (i === phrase.length) {
          deleting = true;
          timer = setTimeout(tick, 2100);
        } else {
          timer = setTimeout(tick, 72);
        }
      } else {
        i -= 1;
        setText(phrase.slice(0, i));
        if (i === 0) {
          setPhraseIndex((p) => (p + 1) % PHRASES.length);
          timer = setTimeout(tick, 400);
        } else {
          timer = setTimeout(tick, 34);
        }
      }
    };

    timer = setTimeout(tick, 500);
    return () => clearTimeout(timer);
  }, [phraseIndex]);

  return (
    <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
      <span className="block text-muted-foreground font-medium">papers.</span>
      <span className="mt-2 block font-mono text-2xl sm:text-3xl">
        /{text}
        <span className="animate-caret text-muted-foreground">▍</span>
      </span>
    </h1>
  );
}