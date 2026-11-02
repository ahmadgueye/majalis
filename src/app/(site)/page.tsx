import Link from "next/link";
import { SessionPreview } from "@/components/landing/SessionPreview";
import { DEFAULT_TRANSLATION, getSurah, words } from "@/lib/quran";
import { getViewer } from "@/lib/auth";
import { CIRCLES } from "@/lib/features";
import { redirect } from "next/navigation";

const FEATURES = [
  {
    title: "Lire",
    text: "Le texte uthmani complet, sourate par sourate, avec la traduction de Muhammad Hamidullah sous chaque verset.",
  },
  {
    title: "Annoter sur un tableau",
    text: "Posez des versets, des notes, des cadres et des flèches qui suivent ce qu'elles relient. Écrivez au clavier ou à main levée.",
  },
  { title: "Surligner avec un sens", text: "Quatre couleurs, quatre usages, les mêmes pour tout le cercle.", extra: "swatches" },
  {
    title: "Traduire mot à mot en wolof",
    text: "Traduisez chaque mot, puis le verset entier. Les mots déjà traduits par le cercle reviennent en suggestion.",
    extra: "wbw",
  },
  {
    title: "Discuter sur un verset",
    text: "Ouvrez un fil sur un verset, un mot ou une note. Mentionnez quelqu'un avec @ et marquez le fil comme résolu.",
  },
  {
    title: "Étudier en même temps",
    text: "Vous voyez qui est là et où chacun écrit. Les changements arrivent chez tous sans recharger la page.",
  },
] as const;

const HIGHLIGHTS = [
  { label: "Thème", className: "bg-hl-theme text-c-sage" },
  { label: "Question", className: "bg-hl-question text-c-sky" },
  { label: "À méditer", className: "bg-hl-reflect text-c-sand" },
  { label: "Lien", className: "bg-hl-link text-c-rose" },
];

const STEPS = [
  { title: "Créez un espace", text: "Donnez-lui le nom de votre cercle : la famille, une classe, les amis du vendredi." },
  { title: "Invitez par un lien", text: "Envoyez le lien à ceux qui étudient avec vous. Il reste valable deux semaines." },
  {
    title: "Ouvrez une séance",
    text: "Choisissez une sourate et commencez. Tout ce que vous écrivez reste dans la séance pour la prochaine fois.",
  },
];

export default async function Home() {
  // Cercles coupés en ligne : l'accueil, qui les présente, mène à la Lecture.
  if (!CIRCLES) redirect("/lire/1");
  const viewer = await getViewer();

  // Versets tirés des données locales (Tanzil, Hamidullah) : le texte n'est jamais recopié à la main.
  const [sad, muhammad] = await Promise.all([getSurah(38), getSurah(47)]);
  const [v28, v29] = [sad!.verses[27], sad!.verses[28]];
  const v24 = muhammad!.verses[23];

  const start = viewer ? { href: "/cercles", label: "Mes cercles" } : { href: "/connexion", label: "Créer mon cercle" };

  return (
    <>

      <main className="text-[15px] leading-[1.55]">
        <div className="px-safe mx-auto grid max-w-[1080px] justify-items-center gap-5 pt-14 pb-10 text-center max-sm:pt-9 max-sm:pb-7">
          <h1 className="max-w-[14ch] font-read text-[clamp(40px,6.4vw,68px)] leading-[1.04] font-medium tracking-[-0.01em] text-balance">
            Méditer le Coran,{" "}
            <span className="-mx-[0.06em] rounded px-[0.12em] italic [background:linear-gradient(transparent_12%,var(--hl-theme)_12%,var(--hl-theme)_92%,transparent_92%)]">
              ensemble
            </span>
            .
          </h1>
          <p className="max-w-[58ch] text-[17px] text-pretty text-muted">
            Majalis réunit votre cercle d&apos;étude autour des versets. On lit, on surligne, on relie les idées sur un
            tableau partagé et on traduit mot à mot en wolof, chacun à sa place, en même temps.
          </p>
          <Ctas start={start} />
          <p className="text-[13px] text-faint">Connexion par lien e-mail, sans mot de passe.</p>
        </div>

        <div className="px-safe mx-auto max-w-[1080px] pt-2 pb-18">
          <SessionPreview before={v28} selected={v29} linked={v24} />
          <p className="pt-3.5 text-center text-[13px] text-faint">
            Exemple de séance : le verset lu à gauche, les réflexions du cercle sur le tableau.
          </p>
        </div>

        <section id="fonctions" className="scroll-mt-16 py-16">
          <div className="px-safe mx-auto max-w-[1080px]">
            <SectionHead eyebrow="Dans un majlis" title="Tout ce qu'il faut pour étudier à plusieurs, rien de plus.">
              Chaque outil apparaît quand vous en avez besoin. Le reste du temps, il reste le texte et vos réflexions.
            </SectionHead>
            <div className="grid grid-cols-1 gap-x-10 gap-y-8 sm:grid-cols-2 md:grid-cols-3">
              {FEATURES.map((f) => (
                <div key={f.title} className="grid content-start gap-2 border-t border-line pt-[18px]">
                  <h3 className="text-[16.5px] font-semibold">{f.title}</h3>
                  <p className="text-muted">{f.text}</p>
                  {"extra" in f && f.extra === "swatches" && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {HIGHLIGHTS.map((h) => (
                        <span key={h.label} className={`rounded-[7px] px-[9px] py-[3px] text-[12.5px] font-semibold ${h.className}`}>
                          {h.label}
                        </span>
                      ))}
                    </div>
                  )}
                  {"extra" in f && f.extra === "wbw" && (
                    <div className="flex flex-row-reverse flex-wrap gap-1.5 pt-1" aria-hidden>
                      {words(v29.ar)
                        .slice(0, 3)
                        .map((w) => (
                          <span
                            key={w}
                            lang="ar"
                            className="grid justify-items-center rounded-lg border border-line bg-surface px-2 py-1 font-ar text-[19px] leading-[1.6]"
                          >
                            {w}
                            <i className="min-w-[3.2em] border-b border-dashed border-grid text-center font-read text-[12.5px] leading-[1.2] text-faint">
                              …
                            </i>
                          </span>
                        ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="border-y border-line bg-surface py-18">
          <div className="px-safe mx-auto grid max-w-[1080px] justify-items-center gap-[18px] text-center">
            <p className="font-ar text-[clamp(28px,4.2vw,40px)] leading-[1.7] text-accent" lang="ar" dir="rtl">
              {v24.ar}
            </p>
            <blockquote className="max-w-[34ch] font-read text-[clamp(21px,2.6vw,27px)] leading-[1.4] text-balance italic">
              {v24.tr[DEFAULT_TRANSLATION]}
            </blockquote>
            <cite className="text-[13px] text-faint not-italic">Sourate Muhammad, 47:{v24.n}</cite>
          </div>
        </div>

        <section className="py-16">
          <div className="px-safe mx-auto max-w-[1080px]">
            <SectionHead eyebrow="Pour commencer" title="Votre cercle prêt en trois étapes." />
            <ol className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              {STEPS.map((s, i) => (
                <li key={s.title} className="grid content-start gap-1.5">
                  <span className="mb-1.5 grid size-8 place-items-center rounded-full bg-accent-soft text-sm font-bold text-accent">
                    {i + 1}
                  </span>
                  <h3 className="text-[16.5px] font-semibold">{s.title}</h3>
                  <p className="text-muted">{s.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="py-16 text-center">
          <div className="px-safe mx-auto grid max-w-[1080px] justify-items-center gap-4">
            <h2 className="font-read text-[clamp(30px,4vw,42px)] leading-[1.12] font-medium text-balance">
              Le prochain majlis commence ici.
            </h2>
            <p className="max-w-[52ch] text-[16.5px] text-muted">
              La lecture est ouverte à tous, sans compte. Connectez-vous pour annoter et étudier avec votre cercle.
            </p>
            <Ctas start={start} />
          </div>
        </section>
      </main>

      <footer className="border-t border-line pt-7 pb-10 text-[13px] text-faint">
        <div className="px-safe mx-auto flex max-w-[1080px] flex-wrap justify-between gap-x-6 gap-y-2">
          <span>Majalis · lire, méditer et annoter le Coran ensemble</span>
          <span>
            Texte arabe :{" "}
            <a className="underline" href="https://tanzil.net" target="_blank" rel="noreferrer">
              Tanzil
            </a>
            , CC BY 3.0 · Traduction : Muhammad Hamidullah
          </span>
        </div>
      </footer>
    </>
  );
}

function Ctas({ start }: { start: { href: string; label: string } }) {
  return (
    <div className="flex flex-wrap justify-center gap-2.5">
      <Link className="btn primary px-[18px] py-2.5" href={start.href}>
        {start.label}
      </Link>
      <Link className="btn px-[18px] py-2.5" href="/lire/1">
        Lire sans compte
      </Link>
    </div>
  );
}

function SectionHead({ eyebrow, title, children }: { eyebrow: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="mb-9 grid max-w-[60ch] gap-2.5">
      <span className="text-[12.5px] font-bold tracking-[0.08em] text-accent uppercase">{eyebrow}</span>
      <h2 className="font-read text-[clamp(30px,4vw,42px)] leading-[1.12] font-medium text-balance">{title}</h2>
      {children && <p className="text-[16.5px] text-muted">{children}</p>}
    </div>
  );
}
