/**
 * Télécharge UNE FOIS une traduction depuis l'API publique de Quran.com
 * et l'enregistre telle quelle dans data/translations/<slug>.raw.json.
 * L'application ne fait jamais cet appel : elle lit les fichiers générés par build-quran.ts.
 *
 *   npm run quran:fetch -- 31 fr.hamidullah
 *   npm run quran:fetch -- 779 fr.maash
 */
import { writeFile } from "node:fs/promises";
import path from "node:path";

const [id, slug] = process.argv.slice(2);
if (!id || !slug) {
  console.error("Usage : npm run quran:fetch -- <resource_id> <slug>");
  process.exit(1);
}

const url = `https://api.quran.com/api/v4/quran/translations/${id}`;
const res = await fetch(url);
if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
const json = await res.json();
const count = json.translations?.length ?? 0;
if (count !== 6236) throw new Error(`Attendu 6236 versets, reçu ${count}`);

const out = path.join(process.cwd(), "data", "translations", `${slug}.raw.json`);
await writeFile(out, JSON.stringify(json));
console.log(`✓ ${json.meta?.translation_name ?? slug} → ${path.relative(process.cwd(), out)}`);
