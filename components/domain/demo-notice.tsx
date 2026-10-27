import { FlaskConical, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export function DemoNotice({
  children,
  className,
  variant = "info",
}: {
  children: React.ReactNode;
  className?: string;
  variant?: "info" | "demo";
}) {
  const Icon = variant === "demo" ? FlaskConical : Info;
  return (
    <div
      className={cn(
        "flex items-start gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] px-3 py-2.5 text-[11px] leading-relaxed text-ink-soft",
        className,
      )}
    >
      <Icon className="mt-0.5 size-3.5 shrink-0 text-amber-500" />
      <span>{children}</span>
    </div>
  );
}
