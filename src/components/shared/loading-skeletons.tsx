import { Skeleton } from "@/components/ui/skeleton";

export function PostCardSkeleton() {
  return (
    <div className="group relative overflow-hidden rounded-lg border border-border bg-card transition-all">
      <Skeleton className="aspect-[16/11] w-full sm:aspect-[4/3]" />
      <div className="space-y-3 p-4 sm:space-y-4 sm:p-7">
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-16" />
        </div>
        <Skeleton className="h-7 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex items-center gap-4 pt-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    </div>
  );
}

export function PostGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 items-start gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-3 xl:gap-8">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>
          <PostCardSkeleton />
        </div>
      ))}
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <div className="relative h-[350px] sm:h-[450px] lg:h-[550px] xl:h-[700px] flex items-center justify-center overflow-hidden bg-gradient-to-br from-primary/20 to-background">
      <div className="container mx-auto px-4 text-center space-y-6">
        <Skeleton className="h-16 sm:h-20 lg:h-24 w-3/4 mx-auto" />
        <Skeleton className="h-6 sm:h-8 w-1/2 mx-auto" />
        <div className="flex gap-4 justify-center pt-4">
          <Skeleton className="h-12 w-32" />
          <Skeleton className="h-12 w-32" />
        </div>
      </div>
    </div>
  );
}

export function PostPageSkeleton() {
  return (
    <article className="mx-auto max-w-4xl dark:prose-invert sm:prose-lg">
      <Skeleton className="mb-6 aspect-video w-full rounded-lg sm:mb-10" />

      <header className="mb-6 sm:mb-10">
        <div className="mb-4 flex flex-wrap items-center gap-2 sm:mb-6 sm:gap-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-5 w-24" />
        </div>

        <Skeleton className="mb-4 h-10 w-full sm:mb-6 sm:h-14" />
        <Skeleton className="mb-6 h-10 w-3/4 sm:h-14" />

        <div className="flex gap-3 mb-4">
          <Skeleton className="h-7 w-20" />
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-7 w-20" />
        </div>
      </header>

      <div className="space-y-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <div className="py-6" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </article>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-32" />
      </div>
      <PostGridSkeleton count={6} />
    </div>
  );
}

export function AdminTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="border rounded-lg">
        <div className="border-b p-4 bg-muted/50">
          <div className="flex gap-4">
            <Skeleton className="h-5 w-1/4" />
            <Skeleton className="h-5 w-1/4" />
            <Skeleton className="h-5 w-1/4" />
            <Skeleton className="h-5 w-1/4" />
          </div>
        </div>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="border-b last:border-0 p-4">
            <div className="flex gap-4">
              <Skeleton className="h-5 w-1/4" />
              <Skeleton className="h-5 w-1/4" />
              <Skeleton className="h-5 w-1/4" />
              <Skeleton className="h-5 w-1/4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
