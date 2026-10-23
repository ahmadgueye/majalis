import { Logo } from "@/components/Logo";
import { Bone, SkeletonPage } from "@/components/Skeleton";

/** Séance en attente : son en-tête compact, la lecture à gauche et le tableau vide avec sa barre d'outils. */
export default function Loading() {
  return (
    <SkeletonPage className="grid h-dvh grid-rows-[auto_minmax(0,1fr)]">
      <div className="px-safe flex h-14 items-center gap-2.5 border-b border-line bg-surface">
        <Logo />
        <Bone className="hidden h-4 w-28 sm:block" />
        <Bone className="h-5 w-44" />
        <div className="ml-auto flex items-center gap-2.5">
          <Bone className="h-8 w-24" />
          <Bone className="h-8 w-[62px] rounded-full" />
          <Bone className="size-9 rounded-full" />
        </div>
      </div>
      <div className="relative min-h-0 bg-bg bg-[radial-gradient(var(--grid)_1.1px,transparent_1.2px)] bg-size-[24px_24px]">
        <div className="absolute inset-0 flex flex-col gap-4 border-line bg-surface p-4 md:right-auto md:w-[340px] md:border-r md:shadow-pop xl:w-[400px]">
          <Bone className="h-9" />
          <Bone className="mx-auto h-8 w-64 max-w-full" />
          <div className="mx-auto grid justify-items-center gap-2">
            <Bone className="h-9 w-40" />
            <Bone className="h-3.5 w-32" />
          </div>
          {[0, 1, 2].map((i) => (
            <div key={i} className="grid gap-2 px-1.5">
              <Bone className="h-3.5 w-12" />
              <Bone className="ml-auto h-8 w-4/5" />
              <Bone className="h-4 w-full" />
              <Bone className="h-4 w-3/5" />
            </div>
          ))}
        </div>
        <div className="absolute inset-x-3 bottom-[calc(14px+env(safe-area-inset-bottom,0px))] hidden justify-center md:flex">
          <Bone className="h-[58px] w-[440px] max-w-full rounded-2xl" />
        </div>
      </div>
    </SkeletonPage>
  );
}
