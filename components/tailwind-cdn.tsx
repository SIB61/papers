"use client";

import Script from "next/script";

export function TailwindCdn() {
  return (
    <Script
      src="https://cdn.tailwindcss.com"
      strategy="afterInteractive"
      onLoad={() => {
        const tailwindGlobal = window as unknown as {
          tailwind?: { config?: unknown };
        };
        if (tailwindGlobal.tailwind) {
          tailwindGlobal.tailwind.config = {
            corePlugins: { preflight: false },
            important: ".blog-body",
          };
        }
      }}
    />
  );
}
