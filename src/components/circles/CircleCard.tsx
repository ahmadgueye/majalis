import Link from "next/link";
import { BookOpen, CalendarDays } from "lucide-react";
import { ROLE_LABELS, initial, plural, toneClass, type Pattern } from "@/lib/circles";
import { AvatarStack, type Person } from "./Avatars";
import { CoverArt } from "./CoverArt";

export type CircleSummary = {
  id: string;
  name: string;
  tone: string;
  pattern: Pattern;
  coverUrl: string | null;
  intention: string;
  rhythm: string | null;
  lastSession: string | null;
  members: Person[];
  studied: number;
  role: string;
};

/** Carte d'un cercle : liste « Mes cercles » et aperçu dans la fenêtre de création. */
export function CircleCard({ circle, href }: { circle: CircleSummary; href?: string }) {
  const body = (
    <>
      <CoverArt id={`cover-${circle.id}`} pattern={circle.pattern} imageUrl={circle.coverUrl} className="h-23" />
      <div className="relative grid content-start gap-2.5 px-[18px] pt-[34px] pb-4">
        <span
          aria-hidden
          className="absolute -top-[26px] left-4 grid size-13 place-items-center rounded-[14px] border-3 border-surface bg-(--tone) text-[22px] font-bold text-surface"
        >
          {initial(circle.name || "?")}
        </span>
        <RoleChip role={circle.role} className="absolute top-2.5 right-3.5" />
        <h2 className="truncate text-[17px] font-bold">{circle.name || "Nom du cercle"}</h2>
        <p className="line-clamp-2 min-h-[3em] text-muted">
          {/* Sans lien, la carte est l'aperçu de la fenêtre de création : on y suggère l'intention. */}
          {circle.intention || (href ? "" : "Ajoute une intention pour dire à quoi sert ce cercle.")}
        </p>
        <div className="grid gap-1 text-[13px] text-muted">
          {circle.rhythm && (
            <span className="flex min-w-0 items-center gap-2">
              <CalendarDays aria-hidden className="size-4 flex-none" />
              <span className="truncate">{circle.rhythm}</span>
            </span>
          )}
          <span className="flex min-w-0 items-center gap-2">
            <BookOpen aria-hidden className="size-4 flex-none" />
            <span className="truncate">{circle.lastSession ?? "Aucune séance pour l'instant"}</span>
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 pt-1">
          <AvatarStack people={circle.members} />
          <span className="text-[12.5px] text-faint tabular-nums">{plural(circle.studied, "sourate")} étudiée{circle.studied > 1 ? "s" : ""}</span>
        </div>
      </div>
    </>
  );

  const className = `${toneClass(circle.tone)} grid grid-rows-[auto_1fr] overflow-hidden rounded-2xl border border-line bg-surface text-left`;
  return href ? (
    <Link
      href={href}
      className={`${className} transition duration-200 hover:-translate-y-0.5 hover:shadow-pop motion-reduce:transition-none motion-reduce:hover:translate-y-0`}
    >
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

export function RoleChip({ role, className = "" }: { role: string; className?: string }) {
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${
        role === "owner" ? "bg-accent-soft text-accent" : "bg-surface-2 text-muted"
      } ${className}`}
    >
      {ROLE_LABELS[role]}
    </span>
  );
}
