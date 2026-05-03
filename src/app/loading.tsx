import { HeroSkeleton, PostGridSkeleton } from "@/components/shared/loading-skeletons";

export default function Loading() {
  return (
    <div>
      <HeroSkeleton />
      <div className="mx-auto w-full px-4 py-6 sm:py-12">
        <PostGridSkeleton count={12} />
      </div>
    </div>
  );
}
