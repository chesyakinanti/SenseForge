"use client";

import { motion } from "motion/react";
import type { HeatmapDay } from "@/lib/types";
import { cn } from "@/lib/utils";

const cellStyles = [
  "bg-surface-2/50 border-line/60",
  "bg-teal/15 border-teal/20",
  "bg-teal/30 border-teal/25",
  "bg-amber/45 border-amber/40",
  "bg-red-500/65 border-red-400/50",
];

const levelLabels = ["Tidak ada", "Rendah", "Sedang", "Tinggi", "Kritis"];

export function AnomalyHeatmap({
  days,
  className,
}: {
  days: HeatmapDay[];
  className?: string;
}) {
  return (
    <div className={cn("w-full", className)}>
      <div className="overflow-x-auto pb-1">
        <div className="min-w-[560px]">
          <div className="mb-1.5 grid grid-cols-[38px_repeat(24,minmax(14px,1fr))] gap-1">
            <span />
            {Array.from({ length: 24 }).map((_, hour) => (
              <span
                key={hour}
                className="text-center font-mono text-[8px] text-ink-muted"
              >
                {hour % 6 === 0 ? String(hour).padStart(2, "0") : ""}
              </span>
            ))}
          </div>
          <div className="space-y-1">
            {days.map((day, rowIndex) => (
              <div
                key={day.date}
                className="grid grid-cols-[38px_repeat(24,minmax(14px,1fr))] items-center gap-1"
              >
                <span className="font-mono text-[9px] text-ink-muted capitalize">
                  {day.label}
                </span>
                {day.cells.map((level, hour) => (
                  <motion.div
                    key={`${day.date}-${hour}`}
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      duration: 0.3,
                      delay: Math.min(0.45, rowIndex * 0.04 + hour * 0.006),
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    title={`${day.label} ${String(hour).padStart(2, "0")}:00 · ${levelLabels[level]}`}
                    className={cn(
                      "aspect-square rounded-[3px] border transition-transform duration-150 hover:scale-125 hover:border-white/40",
                      cellStyles[level],
                    )}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-4">
        <span className="text-[10px] text-ink-muted">
          Intensitas temuan per jam · 7 hari terakhir
        </span>
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[8px] text-ink-muted">Rendah</span>
          {cellStyles.map((style, index) => (
            <span
              key={index}
              className={cn("size-2.5 rounded-[2px] border", style)}
            />
          ))}
          <span className="font-mono text-[8px] text-ink-muted">Tinggi</span>
        </div>
      </div>
    </div>
  );
}
