import type { Metadata, Viewport } from "next";
import { Amiri_Quran, Caveat, EB_Garamond, Figtree } from "next/font/google";
import "./globals.css";

const figtree = Figtree({ subsets: ["latin", "latin-ext"], variable: "--font-figtree" });
const garamond = EB_Garamond({ subsets: ["latin", "latin-ext"], variable: "--font-garamond" });
const caveat = Caveat({ subsets: ["latin", "latin-ext"], variable: "--font-caveat" });
const amiri = Amiri_Quran({ subsets: ["arabic"], weight: "400", variable: "--font-amiri-quran" });

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
    <html lang="fr" className={`${figtree.variable} ${garamond.variable} ${caveat.variable} ${amiri.variable}`}>
      <body>{children}</body>
    </html>
  );
}
