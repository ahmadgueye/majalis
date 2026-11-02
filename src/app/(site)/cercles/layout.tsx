import { notFound } from "next/navigation";
import { CIRCLES } from "@/lib/features";

/** Cercles coupés en ligne (NEXT_PUBLIC_CERCLES=off) : la page introuvable. */
export default function CirclesOnly({ children }: { children: React.ReactNode }) {
  if (!CIRCLES) notFound();
  return children;
}
