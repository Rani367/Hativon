import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="space-y-6">
          <div>
            <Skeleton className="h-5 w-24 mb-2" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div>
            <Skeleton className="h-5 w-24 mb-2" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div>
            <Skeleton className="h-5 w-32 mb-2" />
            <Skeleton className="aspect-video w-full" />
          </div>
          <div>
            <Skeleton className="h-5 w-24 mb-2" />
            <Skeleton className="h-40 w-full" />
          </div>
          <div>
            <Skeleton className="h-5 w-24 mb-2" />
            <Skeleton className="h-64 w-full" />
          </div>
          <div className="flex gap-4">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
      </div>
    </div>
  );
}
