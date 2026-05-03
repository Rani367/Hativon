import { PostPageSkeleton } from "@/components/shared/loading-skeletons";

export default function Loading() {
  return (
    <div className="mx-auto w-full px-4 py-6 sm:py-12">
      <PostPageSkeleton />
    </div>
  );
}
