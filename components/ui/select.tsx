import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function Select({
  className,
  wrapperClassName,
  children,
  ...props
}: React.ComponentProps<"select"> & { wrapperClassName?: string }) {
  return (
    <div className={cn("relative", wrapperClassName)}>
      <select
        className={cn(
          "surface-input h-9 appearance-none pr-8 text-[12px] font-medium",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 text-ink-muted" />
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mono-label mb-1.5 block">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-[11px] text-ink-muted">{hint}</span> : null}
    </label>
  );
}
