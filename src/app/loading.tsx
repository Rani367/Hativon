import { PostGridSkeleton } from "@/components/shared/loading-skeletons";

export default function Loading() {
  return (
    <div className="mx-auto w-full py-2 sm:py-6">
      <div className="mb-6 space-y-2 text-center sm:mb-8">
        <div className="mx-auto h-9 w-56 animate-pulse rounded bg-muted sm:h-10" />
        <div className="mx-auto h-5 w-24 animate-pulse rounded bg-muted" />
      </div>
      <PostGridSkeleton count={12} />
    </div>
  );
}
