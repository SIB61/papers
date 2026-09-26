"use client";

import { THEME_COOKIE } from "@/lib/themes";

export function ThemeInitScript() {
  const token = `(function(){try{var t=localStorage.getItem("papers.theme")||document.cookie.match(/(^|; )papers.theme=([^;]*)/);if(t){var id=(t&&t[2])||t;if(["paper","contrast","graphite","ivory","noir","ink"].indexOf(id)<0)id="paper";document.documentElement.setAttribute("data-theme",id);}}catch(e){}})();`;
  return (
    <script
      suppressHydrationWarning
      dangerouslySetInnerHTML={{
        __html: token.replaceAll("papers.theme", THEME_COOKIE),
      }}
    />
  );
}
