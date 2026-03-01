import { cn } from "@/lib/utils";

type SkeletonVariant = "line" | "circle" | "card" | "stat";

interface SkeletonProps {
  variant?: SkeletonVariant;
  className?: string;
  lines?: number;
}

function SkeletonLine({ className }: { className?: string }) {
  return <div className={cn("h-3 shimmer-skeleton", className)} />;
}

export function Skeleton({ variant = "line", className, lines = 1 }: SkeletonProps) {
  if (variant === "circle") {
    return <div className={cn("h-10 w-10 rounded-full shimmer-skeleton", className)} />;
  }

  if (variant === "stat") {
    return (
      <div className={cn("bg-card rounded-lg border border-border p-5", className)}>
        <div className="flex items-center justify-between mb-3">
          <div className="h-8 w-8 rounded-lg shimmer-skeleton" />
        </div>
        <div className="h-7 w-16 shimmer-skeleton mb-2" />
        <div className="h-3 w-24 shimmer-skeleton" />
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div className={cn("bg-card rounded-lg border border-border p-5", className)}>
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-lg shimmer-skeleton" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 shimmer-skeleton" />
            <div className="h-3 w-1/2 shimmer-skeleton" />
          </div>
        </div>
        <div className="h-3 w-full shimmer-skeleton mb-2" />
        <div className="h-3 w-2/3 shimmer-skeleton" />
      </div>
    );
  }

  return (
    <div className={cn("space-y-2.5", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonLine
          key={i}
          className={i === lines - 1 && lines > 1 ? "w-3/4" : "w-full"}
        />
      ))}
    </div>
  );
}

export function SkeletonList({ count = 3, variant = "card" }: { count?: number; variant?: SkeletonVariant }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} variant={variant} />
      ))}
    </div>
  );
}
