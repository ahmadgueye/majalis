import "server-only";
import type { CircleSummary } from "@/components/circles/CircleCard";
import type { Person } from "@/components/circles/Avatars";
import type { Viewer } from "@/lib/auth";
import { formatRhythm, isPattern, timeAgo } from "@/lib/circles";
import { getSurahMeta } from "@/lib/quran";

type Db = Viewer["supabase"];

export const COVER_BUCKET = "couvertures";

/** URL signées (1 h) des couvertures envoyées ; le bucket est privé. */
export async function coverUrls(db: Db, paths: (string | null)[]) {
  const list = paths.filter((p): p is string => !!p);
  if (!list.length) return new Map<string, string>();
  const { data } = await db.storage.from(COVER_BUCKET).createSignedUrls(list, 3600);
  return new Map((data ?? []).filter((d) => d.signedUrl && d.path).map((d) => [d.path!, d.signedUrl]));
}

/** Noms des personnes (profils lisibles par les co-membres). */
export async function peopleById(db: Db, ids: string[]) {
  const unique = [...new Set(ids)];
  if (!unique.length) return new Map<string, Person>();
  const { data } = await db.from("profiles").select("id, display_name").in("id", unique);
  return new Map((data ?? []).map((p) => [p.id, { id: p.id, name: p.display_name || "Membre" }]));
}

/** Les cercles de la personne connectée, du plus récent au plus ancien. */
export async function loadCircles(viewer: Viewer): Promise<CircleSummary[]> {
  const db = viewer.supabase;
  const { data } = await db
    .from("space_members")
    .select(
      "role, spaces (id, name, tone, cover_pattern, cover_path, intention, meet_day, meet_time, created_at, sessions (surah, created_at), space_members (user_id))",
    )
    .eq("user_id", viewer.user.id);
  const rows = (data ?? []).flatMap((m) => (m.spaces ? [{ role: m.role, ...m.spaces }] : []));

  const [urls, people] = await Promise.all([
    coverUrls(db, rows.map((r) => r.cover_path)),
    peopleById(db, rows.flatMap((r) => r.space_members.map((m) => m.user_id))),
  ]);

  return rows
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((r) => {
      const last = [...r.sessions].sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
      const lastMeta = last && getSurahMeta(last.surah);
      return {
        id: r.id,
        name: r.name,
        tone: r.tone,
        pattern: isPattern(r.cover_pattern) ? r.cover_pattern : "etoile",
        coverUrl: (r.cover_path && urls.get(r.cover_path)) || null,
        intention: r.intention,
        rhythm: formatRhythm(r.meet_day, r.meet_time),
        lastSession: lastMeta ? `${lastMeta.tname} · ${timeAgo(last.created_at)}` : null,
        members: r.space_members.map((m) => people.get(m.user_id) ?? { id: m.user_id, name: "Membre" }),
        studied: new Set(r.sessions.map((s) => s.surah)).size,
        role: r.role,
      };
    });
}
