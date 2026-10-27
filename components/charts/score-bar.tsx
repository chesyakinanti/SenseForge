import { cn } from "@/lib/utils";

export function ScoreBar({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const tone =
    value >= 0.85 ? "bg-red-500" : value >= 0.65 ? "bg-amber-500" : "bg-teal";
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="h-1.5 w-14 overflow-hidden rounded-full bg-surface-2">
        <div
          className={cn("h-full rounded-full transition-all duration-500", tone)}
          style={{ width: `${Math.round(value * 100)}%` }}
        />
      </div>
      <span className="data-value text-[11px] font-medium text-ink">
        {value.toFixed(2)}
      </span>
    </div>
  );
}
