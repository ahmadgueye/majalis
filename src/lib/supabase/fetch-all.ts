/**
 * Toutes les lignes d'une requête, page par page : Supabase n'en renvoie que 1000 à la fois
 * (max_rows). La requête doit être triée, pour que les pages ne se chevauchent pas.
 *   fetchAll((a, b) => db.from("wolof_drafts").select("*").order("ref").range(a, b))
 */
export async function fetchAll<T>(
  page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
): Promise<T[]> {
  const size = 1000;
  const out: T[] = [];
  for (let from = 0; ; from += size) {
    const { data, error } = await page(from, from + size - 1);
    if (error) throw error;
    out.push(...(data ?? []));
    if (!data || data.length < size) return out;
  }
}
