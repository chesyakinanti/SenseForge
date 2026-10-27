"use client";

import { api } from "@/lib/api";
import { useAsyncData, useClock } from "@/lib/hooks";
import { cn, formatNumber } from "@/lib/utils";

export function StatusBar({ collapsed }: { collapsed: boolean }) {
  const clock = useClock();
  const { data, error } = useAsyncData(() => api.getDashboard(), []);

  const time = clock
    ? new Intl.DateTimeFormat("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZone: "Asia/Jakarta",
      }).format(clock)
    : "--:--:--";

  return (
    <div
      className={cn(
        "fixed right-0 bottom-0 z-20 hidden h-7 items-center justify-between border-t border-line bg-[var(--sidebar)]/92 px-4 backdrop-blur-xl transition-[left] duration-300 lg:flex",
        collapsed ? "left-[88px]" : "left-[272px]",
      )}
    >
      <div className="flex items-center gap-4 font-mono text-[9px] tracking-[0.04em] text-ink-muted">
        <span className="flex items-center gap-1.5">
          <span className="relative flex size-1.5">
            <span
              className={cn(
                "animate-pulse-ring absolute inline-flex size-full rounded-full",
                error ? "bg-amber-500" : "bg-emerald-500",
              )}
            />
            <span
              className={cn(
                "relative inline-flex size-1.5 rounded-full",
                error ? "bg-amber-500" : "bg-emerald-500",
              )}
            />
          </span>
          <span className="text-ink-soft">
            {error ? "Backend tidak terhubung" : "Backend FastAPI & MongoDB aktif"}
          </span>
        </span>
        <span className="hidden xl:inline">FastAPI · v1.0</span>
        {data ? (
          <>
            <span className="hidden xl:inline">
              {formatNumber(data.summary.totalRecords)} rekaman
            </span>
            <span className="hidden 2xl:inline">
              {data.summary.totalMachines} equipment terpantau
            </span>
          </>
        ) : null}
      </div>
      <div className="flex items-center gap-4 font-mono text-[9px] tracking-[0.04em] text-ink-muted">
        <span className="text-teal/90">Sumber: MongoDB sensor_data & data.csv</span>
        <span className="text-ink-soft">{time} WIB</span>
      </div>
    </div>
  );
}
