import type { SupabaseClient } from "@supabase/supabase-js";
import { fromRow, toRow, type BoardEl } from "./board";
import type { Database, Json } from "./supabase/database.types";

// Synchronisation du tableau. Le composant ne connaît que cette interface : on pourra la remplacer
// (diffusion Realtime « broadcast », CRDT…) sans toucher au tableau.

export type BoardSync = {
  /** Écrit les éléments modifiés et supprime les autres ; false si la base a refusé. */
  write(upserts: BoardEl[], removed: string[]): Promise<boolean>;
  /** Relit tout le tableau (après un refus, pour revenir à l'état de la base). */
  load(): Promise<BoardEl[] | null>;
  /** Changements faits par les autres membres, en direct. Renvoie la fonction de désabonnement. */
  subscribe(on: { upsert(e: BoardEl): void; remove(id: string): void }): () => void;
};

/** Forme normalisée d'un élément, pour reconnaître l'écho de ses propres écritures. */
export const signature = (e: BoardEl) => JSON.stringify(toRow(fromRow(toRow(e)) ?? e));

export function supabaseBoardSync(
  db: SupabaseClient<Database>,
  ids: { session: string; space: string; me: string },
): BoardSync {
  // Les écritures partent l'une après l'autre, pour que la base garde le dernier état.
  let queue: Promise<boolean> = Promise.resolve(true);
  // Ce qu'on vient d'écrire : Realtime nous le renvoie, et cet écho ne doit pas être réappliqué.
  const sent = new Map<string, string[]>();

  async function send(upserts: BoardEl[], removed: string[]) {
    const now = new Date().toISOString();
    const rows = upserts.map((e) => ({
      ...toRow(e),
      data: toRow(e).data as NonNullable<Json>,
      session_id: ids.session,
      space_id: ids.space,
      updated_by: ids.me,
      updated_at: now,
    }));
    const [a, b] = await Promise.all([
      rows.length ? db.from("board_elements").upsert(rows) : null,
      removed.length ? db.from("board_elements").delete().in("id", removed) : null,
    ]);
    return !a?.error && !b?.error;
  }

  return {
    write(upserts, removed) {
      for (const e of upserts) sent.set(e.id, [...(sent.get(e.id) ?? []), signature(e)].slice(-20));
      queue = queue.then(() => send(upserts, removed)).catch(() => false);
      return queue;
    },
    async load() {
      const { data, error } = await db
        .from("board_elements")
        .select("id, type, z, data")
        .eq("session_id", ids.session);
      if (error) return null;
      return (data ?? []).map(fromRow).filter((e): e is BoardEl => !!e);
    },
    subscribe(on) {
      const channel = db
        .channel(`tableau:${ids.session}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "board_elements", filter: `session_id=eq.${ids.session}` },
          (payload) => {
            if (payload.eventType === "DELETE") {
              const id = (payload.old as { id?: string }).id;
              if (id) on.remove(id);
              return;
            }
            const e = fromRow(payload.new as { id: string; type: string; z: number; data: unknown });
            if (!e) return;
            const mine = sent.get(e.id) ?? [];
            const i = mine.indexOf(signature(e));
            if (i >= 0) {
              mine.splice(i, 1);
              return;
            }
            on.upsert(e);
          },
        )
        .subscribe();
      return () => {
        db.removeChannel(channel);
      };
    },
  };
}
