import { BarBones, Bone, SkeletonPage } from "@/components/Skeleton";

/** Page d'un cercle en attente : fil d'Ariane, bandeau et pastille, séances à gauche, membres à droite. */
export default function Loading() {
  return (
    <SkeletonPage>
      <BarBones>
        <Bone className="h-4 w-20" />
        <Bone className="h-4 w-36" />
      </BarBones>
      <div className="px-safe mx-auto max-w-[1080px] pb-16">
        <div className="pt-5">
          <Bone className="h-[130px] rounded-[14px] sm:h-[190px] sm:rounded-[18px]" />
          <div className="flex flex-wrap items-end gap-4 px-2 sm:px-6">
            <Bone className="-mt-9 size-[68px] flex-none rounded-[18px] border-4 border-bg sm:-mt-11 sm:size-[84px] sm:rounded-[22px]" />
            <div className="grid min-w-[min(100%,260px)] flex-1 gap-2 pt-3">
              <Bone className="h-8 w-64 max-w-full" />
              <Bone className="h-4 w-80 max-w-full" />
            </div>
          </div>
        </div>
        <div className="grid items-start gap-7 pt-6 md:grid-cols-[minmax(0,1fr)_minmax(0,330px)]">
          <div className="grid min-w-0 gap-[22px]">
            <Bone className="h-28 rounded-2xl" />
            <Card>
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Bone className="size-[58px] flex-none rounded-xl" />
                  <div className="grid flex-1 gap-2">
                    <Bone className="h-4 w-1/2" />
                    <Bone className="h-3.5 w-1/3" />
                  </div>
                </div>
              ))}
            </Card>
          </div>
          <div className="grid min-w-0 gap-[22px]">
            <Card>
              <Bone className="h-40 rounded-xl" />
            </Card>
            <Card>
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <Bone className="size-8 flex-none rounded-full" />
                  <Bone className="h-4 flex-1" />
                </div>
              ))}
            </Card>
          </div>
        </div>
      </div>
    </SkeletonPage>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid gap-3 rounded-2xl border border-line bg-surface p-[18px]">
      <Bone className="h-4 w-28" />
      {children}
    </div>
  );
}
