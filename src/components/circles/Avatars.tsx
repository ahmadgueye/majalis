import { initial, personTone, toneClass } from "@/lib/circles";

export type Person = { id: string; name: string };

/** Pastille ronde d'une personne, dans une teinte stable tirée de son identifiant. */
export function PersonAvatar({ person, size = "md" }: { person: Person; size?: "sm" | "md" }) {
  return (
    <span
      title={person.name}
      className={`${toneClass(personTone(person.id))} grid flex-none place-items-center rounded-full border-2 border-surface bg-(--tone) font-bold text-surface ${
        size === "sm" ? "size-7 text-[11px]" : "size-8 text-xs"
      }`}
    >
      {initial(person.name || "?")}
    </span>
  );
}

/** Avatars empilés ; au-delà de `max`, un « +n ». */
export function AvatarStack({ people, max = 4 }: { people: Person[]; max?: number }) {
  const extra = people.length - max;
  return (
    <span className="flex" aria-label={`${people.length} membre${people.length > 1 ? "s" : ""}`}>
      {people.slice(0, max).map((p, i) => (
        <span key={p.id} className={i ? "-ml-2" : ""}>
          <PersonAvatar person={p} size="sm" />
        </span>
      ))}
      {extra > 0 && (
        <span className="-ml-2 grid size-7 place-items-center rounded-full border-2 border-surface bg-surface-2 text-[11px] font-bold text-muted">
          +{extra}
        </span>
      )}
    </span>
  );
}
