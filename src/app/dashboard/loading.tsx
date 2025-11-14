import { DashboardSkeleton } from "@/components/shared/loading-skeletons";

export default function Loading() {
  return (
    <div className="space-y-8">
      <DashboardSkeleton />
    </div>
  );
}
