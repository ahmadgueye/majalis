import { surahs } from "@/lib/quran";
import { PageBar } from "@/components/SiteHeader";
import { ReadingNotes } from "@/components/notes/ReadingNotes";
import { ReadingModes } from "@/components/reader/ReadingModes";
import { SurahDrawer, SurahNav, type NavSurah } from "@/components/reader/SurahNav";

const list: NavSurah[] = surahs.map(({ n, tname, ar, ayas }) => ({ n, tname, ar, ayas }));

/** Lecture : la liste des sourates reste en place quand on passe d'une sourate à l'autre
 *  (recherche et position gardées). Sur ordinateur, barre latérale collée au bord gauche et texte
 *  centré dans le reste de l'écran ; sur téléphone, panneau « Sourates ». */
export default function ReadLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[calc(100dvh-3.5rem)] bg-surface">
      <PageBar wide>
        <SurahDrawer surahs={list} />
        {/* Sur téléphone, les choix de lecture sont dans la page : la barre collante reste sur une ligne. */}
        <ReadingModes className="hidden flex-1 lg:flex lg:pl-[312px]" />
      </PageBar>
      <div className="lg:grid lg:grid-cols-[312px_minmax(0,1fr)]">
        <aside
          aria-label="Sourates et versets"
          className="sticky top-[107px] hidden h-[calc(100dvh-107px)] border-r border-line lg:block"
        >
          <SurahNav surahs={list} />
        </aside>
        <div className="px-safe min-w-0">
          <ReadingModes className="pt-4 lg:hidden" />
          <ReadingNotes>{children}</ReadingNotes>
        </div>
      </div>
    </div>
  );
}
