import type { Metadata, Viewport } from "next";
import { Caveat, EB_Garamond, Figtree, Scheherazade_New } from "next/font/google";
import "./globals.css";

const figtree = Figtree({ subsets: ["latin", "latin-ext"], variable: "--font-figtree" });
const garamond = EB_Garamond({ subsets: ["latin", "latin-ext"], variable: "--font-garamond" });
const caveat = Caveat({ subsets: ["latin", "latin-ext"], variable: "--font-caveat" });
const scheherazade = Scheherazade_New({ subsets: ["arabic"], weight: ["400", "700"], variable: "--font-scheherazade" });

export const metadata: Metadata = {
  title: { default: "Majalis", template: "%s · Majalis" },
  description: "Espace collaboratif de tadabbur : lecture, tableau, notes et mot à mot.",
  applicationName: "Majalis",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#161e1b" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={`${figtree.variable} ${garamond.variable} ${caveat.variable} ${scheherazade.variable}`}>
      <body>{children}</body>
    </html>
  );
}
