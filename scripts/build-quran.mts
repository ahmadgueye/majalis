/**
 * Génère src/data/quran/ à partir des sources locales :
 *   - data/tanzil/quran-uthmani.txt  (texte Tanzil, CC BY 3.0, recopié sans modification)
 *   - data/tanzil/quran-data.xml     (métadonnées des sourates)
 *   - data/translations/*.raw.json   (traductions récupérées avec fetch-translation.ts)
 *
 *   npm run quran:build
 */
import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const outDir = path.join(root, "src", "data", "quran");

export const TANZIL_NOTICE =
  "Tanzil Quran Text (Uthmani, Version 1.1). Copyright (C) 2007-2026 Tanzil Project. " +
  "License: Creative Commons Attribution 3.0. Verbatim copy, changing it is not allowed. https://tanzil.net";

type SurahMeta = {
  n: number;
  ayas: number;
  ar: string;
  tname: string;
  ename: string;
  type: "Meccan" | "Medinan";
  order: number;
};

const attr = (tag: string, name: string) => tag.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1] ?? "";

async function readMeta(): Promise<SurahMeta[]> {
  const xml = await readFile(path.join(root, "data/tanzil/quran-data.xml"), "utf8");
  const block = xml.match(/<suras[\s\S]*?<\/suras>/)?.[0] ?? "";
  return [...block.matchAll(/<sura [^>]+\/>/g)].map(([tag]) => ({
    n: Number(attr(tag, "index")),
    ayas: Number(attr(tag, "ayas")),
    ar: attr(tag, "name"),
    tname: attr(tag, "tname"),
    ename: attr(tag, "ename"),
    type: attr(tag, "type") as SurahMeta["type"],
    order: Number(attr(tag, "order")),
  }));
}

async function readText(): Promise<Map<number, string[]>> {
  const txt = await readFile(path.join(root, "data/tanzil/quran-uthmani.txt"), "utf8");
  const bySurah = new Map<number, string[]>();
  for (const line of txt.split("\n")) {
    if (!line || line.startsWith("#")) continue;
    const [s, a, ...rest] = line.split("|");
    const text = rest.join("|").trim();
    const list = bySurah.get(Number(s)) ?? [];
    list[Number(a) - 1] = text;
    bySurah.set(Number(s), list);
  }
  return bySurah;
}

// Retire les appels de note (<sup foot_note=…>1</sup>) et les balises éventuelles.
const cleanTranslation = (t: string) =>
  t.replace(/<sup[^>]*>.*?<\/sup>/g, "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

async function readTranslations(meta: SurahMeta[]) {
  const dir = path.join(root, "data/translations");
  const files = (await readdir(dir)).filter((f) => f.endsWith(".raw.json"));
  const result: { slug: string; name: string; bySurah: Map<number, string[]> }[] = [];
  for (const file of files) {
    const json = JSON.parse(await readFile(path.join(dir, file), "utf8"));
    const flat: string[] = json.translations.map((t: { text: string }) => cleanTranslation(t.text));
    const bySurah = new Map<number, string[]>();
    let i = 0;
    for (const s of meta) {
      bySurah.set(s.n, flat.slice(i, i + s.ayas));
      i += s.ayas;
    }
    result.push({ slug: file.replace(".raw.json", ""), name: json.meta?.translation_name ?? file, bySurah });
  }
  return result;
}

const meta = await readMeta();
const text = await readText();
const translations = await readTranslations(meta);

if (meta.length !== 114) throw new Error(`114 sourates attendues, ${meta.length} trouvées`);
const total = [...text.values()].reduce((n, v) => n + v.length, 0);
if (total !== 6236) throw new Error(`6236 versets attendus, ${total} trouvés`);

await mkdir(path.join(outDir, "s"), { recursive: true });
await writeFile(
  path.join(outDir, "surahs.json"),
  JSON.stringify({ notice: TANZIL_NOTICE, translations: translations.map(({ slug, name }) => ({ slug, name })), surahs: meta }),
);

for (const s of meta) {
  const ar = text.get(s.n)!;
  if (ar.length !== s.ayas) throw new Error(`Sourate ${s.n} : ${ar.length}/${s.ayas} versets`);
  const verses = ar.map((a, i) => ({
    n: i + 1,
    ar: a,
    tr: Object.fromEntries(translations.map((t) => [t.slug, t.bySurah.get(s.n)?.[i] ?? ""])),
  }));
  await writeFile(path.join(outDir, "s", `${s.n}.json`), JSON.stringify({ notice: TANZIL_NOTICE, surah: s.n, verses }));
}

console.log(`✓ 114 sourates, ${total} versets, traductions : ${translations.map((t) => t.slug).join(", ") || "aucune"}`);
