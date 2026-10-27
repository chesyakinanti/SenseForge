import { cn } from "@/lib/utils";

export function BrandSymbol({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative inline-flex size-10 shrink-0 overflow-hidden rounded-[13px] border border-white/10 shadow-[0_8px_24px_-14px_rgba(0,0,0,0.7)]",
        className,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/Images/Logo darkmode.png"
        alt=""
        className="hidden size-full object-cover dark:block"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/Images/Logo lightmode.png"
        alt=""
        className="size-full object-cover dark:hidden"
      />
    </span>
  );
}

export function BrandLockup({
  collapsed = false,
  className,
}: {
  collapsed?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("flex min-w-0 items-center gap-2.5", className)}>
      <BrandSymbol />
      {!collapsed ? (
        <span className="flex min-w-0 flex-col leading-none">
          <span className="text-[16.5px] font-extrabold tracking-[-0.035em] text-ink">
            Sense<span className="text-teal">Forge</span>
          </span>
          <span className="mt-1.5 truncate font-mono text-[6.5px] font-medium tracking-[0.22em] text-ink-muted">
            MONITOR. ANALYZE. OPTIMIZE.
          </span>
        </span>
      ) : null}
    </span>
  );
}

export function FullLogo({ className }: { className?: string }) {
  return (
    <div className={cn("relative", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/Images/Logo full darkmode.png"
        alt="SenseForge — Monitor. Analyze. Optimize."
        className="hidden w-full dark:block"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/Images/Logo full lightmode.png"
        alt="SenseForge — Monitor. Analyze. Optimize."
        className="w-full dark:hidden"
      />
    </div>
  );
}
