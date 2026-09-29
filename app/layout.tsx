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
  metadataBase: new URL("https://portfolioo.site"),
  title: {
    default: "portfolioo — a markdown blog",
    template: "%s · portfolioo",
  },
  description: "Write everything in markdown. Everything is a page.",
  keywords: ["markdown", "blog", "portfolio", "writing", "minimalist", "developer"],
  authors: [{ name: "portfolioo" }],
  creator: "portfolioo",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://portfolioo.site",
    title: "portfolioo — a markdown blog",
    description: "Write everything in markdown. Everything is a page.",
    siteName: "portfolioo",
  },
  twitter: {
    card: "summary_large_image",
    title: "portfolioo — a markdown blog",
    description: "Write everything in markdown. Everything is a page.",
    creator: "@portfolioo",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

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
      <head />
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <ThemeProvider initialTheme={initialTheme}>{children}</ThemeProvider>
      </body>
    </html>
  );
}