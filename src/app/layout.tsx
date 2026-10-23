import type { Metadata, Viewport } from "next";
import { Caveat, Figtree, Scheherazade_New } from "next/font/google";
import { readingScript } from "@/lib/reading";
import { THEME_KEY } from "@/lib/theme";
import "./globals.css";

const figtree = Figtree({ subsets: ["latin", "latin-ext"], style: ["normal", "italic"], variable: "--font-figtree" });
const caveat = Caveat({ subsets: ["latin", "latin-ext"], variable: "--font-caveat" });
const scheherazade = Scheherazade_New({ subsets: ["arabic"], weight: ["400", "700"], variable: "--font-scheherazade" });

const themeScript = `try{var t=localStorage.getItem(${JSON.stringify(THEME_KEY)});if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

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
    <html
      lang="fr"
      className={`${figtree.variable} ${caveat.variable} ${scheherazade.variable}`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        {/* Applique le thème choisi avant l'affichage, pour éviter un flash de l'autre thème. */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {/* Même chose pour la façon de lire (arabe, traduction…), voir src/lib/reading.ts. */}
        <script dangerouslySetInnerHTML={{ __html: readingScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
