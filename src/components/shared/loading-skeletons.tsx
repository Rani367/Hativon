import { Skeleton } from "@/components/ui/skeleton";

export function PostCardSkeleton() {
  return (
    <div className="group relative overflow-hidden rounded-lg border border-border bg-card transition-all">
      <Skeleton className="aspect-video w-full" />
      <div className="p-6 space-y-4">
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
    <div className="columns-1 md:columns-2 lg:columns-3 2xl:columns-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="break-inside-avoid mb-6">
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
    <article className="max-w-4xl mx-auto prose prose-lg dark:prose-invert">
      <Skeleton className="aspect-video w-full mb-10 rounded-lg" />

      <header className="mb-10">
        <div className="flex items-center gap-4 mb-6">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-5 w-24" />
        </div>

        <Skeleton className="h-14 w-full mb-6" />
        <Skeleton className="h-14 w-3/4 mb-6" />

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
