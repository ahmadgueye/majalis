import { Bone, SkeletonPage } from "@/components/Skeleton";

/** Mes cercles en attente : titre, puis grille de cartes de cercle (couverture, pastille, texte). */
export default function Loading() {
  return (
    <SkeletonPage className="px-safe mx-auto grid max-w-[1080px] gap-6 pb-16">
      <div className="grid gap-2.5 pt-9">
        <Bone className="h-9 w-56" />
        <Bone className="h-4 w-full max-w-[420px]" />
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,320px),1fr))] gap-[18px]">
        {[0, 1, 2].map((i) => (
          <div key={i} className="overflow-hidden rounded-2xl border border-line bg-surface">
            <Bone className="h-23 rounded-none" />
            <div className="relative grid gap-2.5 px-[18px] pt-[34px] pb-4">
              <Bone className="absolute -top-[26px] left-4 size-13 rounded-[14px] border-3 border-surface" />
              <Bone className="h-5 w-2/3" />
              <Bone className="h-4 w-full" />
              <Bone className="h-4 w-4/5" />
              <Bone className="h-3.5 w-1/2" />
              <div className="flex items-center justify-between pt-1">
                <div className="flex -space-x-1.5">
                  {[0, 1, 2].map((k) => (
                    <Bone key={k} className="size-7 rounded-full border-2 border-surface" />
                  ))}
                </div>
                <Bone className="h-3.5 w-24" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </SkeletonPage>
  );
}
