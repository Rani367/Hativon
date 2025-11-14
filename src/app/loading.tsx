import { HeroSkeleton, PostGridSkeleton } from "@/components/shared/loading-skeletons";

export default function Loading() {
  return (
    <div>
      <HeroSkeleton />
      <div className="container mx-auto px-4 py-12">
        <PostGridSkeleton count={12} />
      </div>
    </div>
  );
}
