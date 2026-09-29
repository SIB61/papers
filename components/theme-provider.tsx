"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  memo,
} from "react";
import { defaultTheme, isThemeId, themes, type ThemeId, THEME_COOKIE } from "@/lib/themes";

const ThemeScript = memo(() => {
  const token = `(function(){try{var t=localStorage.getItem("portfolioo.theme")||document.cookie.match(/(^|; )portfolioo.theme=([^;]*)/);if(t){var id=(t&&t[2])||t;if(["paper","contrast","graphite","ivory","noir","ink"].indexOf(id)<0)id="paper";document.documentElement.setAttribute("data-theme",id);}}catch(e){}})();`;
  return (
    <span
      suppressHydrationWarning
      style={{ display: "none" }}
      dangerouslySetInnerHTML={{
        __html: `<script>${token.replaceAll("portfolioo.theme", THEME_COOKIE)}</script>`,
      }}
    />
  );
}, () => true);



interface ThemeContextValue {
  theme: ThemeId;
  themes: typeof themes;
  setTheme: (theme: ThemeId) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: defaultTheme,
  themes,
  setTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

function readStoredTheme(): ThemeId | null {
  try {
    const saved = localStorage.getItem(THEME_COOKIE);
    return isThemeId(saved) ? saved : null;
  } catch {
    return null;
  }
}

export function ThemeProvider({
  children,
  initialTheme = defaultTheme,
}: {
  children: React.ReactNode;
  initialTheme?: ThemeId;
}) {
  // Lazy init: on the client pick up the stored theme once; otherwise defer to
  // the document-level theme (a tenant default may already be applied); on the
  // server use the cookie-derived default so SSR and hydration stay in sync.
  // No effect ever writes this value back, so user changes are never reverted.
  const [theme, setThemeState] = useState<ThemeId>(() => {
    if (typeof window === "undefined") return initialTheme;
    const stored = readStoredTheme();
    if (stored) return stored;
    const doc = document.documentElement.getAttribute("data-theme");
    return isThemeId(doc) ? doc : initialTheme;
  });
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setTheme = useCallback((next: ThemeId) => {
    const root = document.documentElement;
    root.classList.add("theme-transition");
    setThemeState(next);
    if (transitionTimer.current) clearTimeout(transitionTimer.current);
    transitionTimer.current = setTimeout(() => {
      root.classList.remove("theme-transition");
    }, 450);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    try {
      localStorage.setItem(THEME_COOKIE, theme);
    } catch {
      /* private mode */
    }
    document.cookie = `${THEME_COOKIE}=${theme}; path=/; max-age=31536000; samesite=lax`;
  }, [theme]);

  const value = useMemo(() => ({ theme, themes, setTheme }), [theme, setTheme]);

  return (
    <ThemeContext.Provider value={value}>
      <ThemeScript />
      {children}
    </ThemeContext.Provider>
  );
}