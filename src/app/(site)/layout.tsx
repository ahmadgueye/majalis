import { SiteHeader } from "@/components/SiteHeader";

/** Pages du site (tout sauf la séance) : l'en-tête est posé ici une fois et reste en place d'une page à l'autre. */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      {children}
    </>
  );
}
