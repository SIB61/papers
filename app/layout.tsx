import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import { ThemeProvider } from "@/components/theme-provider";
import { isThemeId, defaultTheme, THEME_COOKIE } from "@/lib/themes";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "papers — a markdown blog",
    template: "%s · papers",
  },
  description: "Write everything in markdown. Everything is a page.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

function ThemeInitScript() {
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

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const store = await cookies();
  const cookieTheme = store.get("theme");
  const initialTheme = isThemeId(cookieTheme?.value) ? cookieTheme.value : defaultTheme;

  return (
    <html
      lang="en"
      data-theme={initialTheme}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <ThemeInitScript />
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <ThemeProvider initialTheme={initialTheme}>{children}</ThemeProvider>
      </body>
    </html>
  );
}