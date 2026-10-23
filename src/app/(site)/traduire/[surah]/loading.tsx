import { Bone, SkeletonPage } from "@/components/Skeleton";

/** Traduire en attente : barre (sourate, progression, lettres), titre, puis versets avec leurs tuiles de mots. */
export default function Loading() {
  return (
    <SkeletonPage>
      <div className="border-b border-line bg-surface">
        <div className="px-safe mx-auto grid max-w-[1080px] gap-2 py-2">
          <div className="flex min-h-8 items-center gap-3">
            <Bone className="h-8 w-full max-w-[320px]" />
            <Bone className="ml-auto h-8 w-24" />
          </div>
          <div className="flex min-h-8 flex-wrap items-center gap-3">
            <Bone className="h-1.5 w-28 rounded-full" />
            <Bone className="h-4 w-36" />
            <div className="ml-auto flex gap-1">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <Bone key={i} className="size-8" />
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="px-safe mx-auto grid max-w-[1080px] gap-3 pt-5 pb-16">
        <div className="mb-4 grid justify-items-center gap-2">
          <Bone className="h-10 w-48" />
          <Bone className="h-4 w-40" />
        </div>
        {[4, 2, 4].map((n, i) => (
          <div key={i} className="grid gap-3 rounded-xl border border-line bg-surface px-3.5 pt-3 pb-3.5">
            <Bone className="h-3.5 w-14" />
            <div className="flex flex-wrap justify-end gap-x-1.5 gap-y-2.5">
              {Array.from({ length: n }, (_, k) => (
                <div key={k} className="grid w-[120px] gap-1.5">
                  <Bone className="mx-auto h-9 w-16" />
                  <Bone className="h-8" />
                </div>
              ))}
            </div>
            <Bone className="h-5 w-2/3" />
            <Bone className="h-3.5 w-1/2" />
          </div>
        ))}
      </div>
    </SkeletonPage>
  );
}
