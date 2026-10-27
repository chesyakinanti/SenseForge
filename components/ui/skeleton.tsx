import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} />;
}

export function KpiSkeleton() {
  return (
    <div className="panel scanline p-4">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="mt-4 h-9 w-28" />
      <Skeleton className="mt-4 h-12 w-full" />
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-56" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <KpiSkeleton key={index} />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="panel p-5 lg:col-span-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mt-5 h-64 w-full" />
        </div>
        <div className="panel p-5">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="mt-5 h-64 w-full" />
        </div>
      </div>
    </div>
  );
}
