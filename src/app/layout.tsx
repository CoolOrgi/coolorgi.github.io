import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SmoothScroll } from "@/components/providers/SmoothScroll";
import { Loader } from "@/components/loader/Loader";
import { Cursor } from "@/components/cursor/Cursor";
import "./globals.css";

/**
 * Fonts
 * ------------------------------------------------------------------
 * Display: Geist, a variable grotesque that goes all the way down to weight 100,
 * so we get the razor-thin headlines for free. If you license PP Neue Montreal
 * or Helvetica Now later, swap this for `next/font/local` pointing at the
 * .woff2 files and keep the same `variable` name — nothing else changes.
 *
 * Meta: Geist Mono for the small technical labels.
 *
 * next/font self-hosts both at build time (no Google request at runtime) and
 * sizes the fallback font to match, so there's no layout shift on load.
 */
const display = Geist({
  variable: "--font-display",
  subsets: ["latin", "latin-ext"], // latin-ext covers Albanian ë / ç
  display: "swap",
});

const meta = Geist_Mono({
  variable: "--font-meta",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://orgi.is-a.dev"),
  title: "Orgi — Creative Developer",
  description:
    "Creative developer building immersive, high-performance web experiences.",
  openGraph: {
    title: "Orgi — Creative Developer",
    description:
      "Creative developer building immersive, high-performance web experiences.",
    url: "https://orgi.is-a.dev",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#050505",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${meta.variable} is-loading`}>
      <head>
        {/* Without JS nothing would ever reveal [data-reveal] — show it all. */}
        <noscript>
          <style>{`[data-reveal]{visibility:visible!important}html.is-loading{overflow:auto!important}[data-loader]{display:none!important}`}</style>
        </noscript>
      </head>
      <body className="grain">
        <Loader />
        <Cursor />
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
