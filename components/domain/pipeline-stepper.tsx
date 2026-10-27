"use client";

import { motion } from "motion/react";
import { Check, ChevronRight, Clock3, Loader2 } from "lucide-react";
import type { PipelineStage } from "@/lib/types";
import { cn } from "@/lib/utils";

export function PipelineStepper({
  stages,
  compact = false,
}: {
  stages: PipelineStage[];
  compact?: boolean;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2 sm:hidden">
        <span className="font-mono text-[8px] tracking-[0.14em] text-ink-muted uppercase">
          Geser untuk semua tahap
        </span>
        <span className="font-mono text-[9px] text-ink-muted">→</span>
      </div>
      <div className="overflow-x-auto pb-1">
        <div
          className={cn(
            "flex w-full items-stretch",
            compact ? "min-w-[940px]" : "min-w-[980px]",
          )}
        >
          {stages.map((stage, index) => {
            const complete = stage.status === "completed";
            const running = stage.status === "running";
            return (
              <div key={stage.key} className="flex min-w-0 flex-1 items-stretch">
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.06, duration: 0.35 }}
                  className={cn(
                    "relative min-w-0 flex-1 rounded-xl border p-3",
                    running
                      ? "border-teal/35 bg-teal/5"
                      : complete
                        ? "border-line bg-surface-2/35"
                        : "border-dashed border-line bg-transparent",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "flex size-6 items-center justify-center rounded-md border",
                        running
                          ? "border-teal/30 bg-teal/10 text-teal"
                          : complete
                            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
                            : "border-line bg-surface-2 text-ink-muted",
                      )}
                    >
                      {running ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : complete ? (
                        <Check className="size-3" />
                      ) : (
                        <Clock3 className="size-3" />
                      )}
                    </span>
                    <span className="font-mono text-[8px] tracking-[0.12em] text-ink-muted uppercase">
                      {running ? "Live" : complete ? "OK" : "Queue"}
                    </span>
                  </div>
                  <p className="mt-2 truncate text-[11px] font-semibold text-ink">
                    {stage.label}
                  </p>
                  {!compact ? (
                    <p className="mt-0.5 line-clamp-2 min-h-[24px] text-[9.5px] leading-relaxed text-ink-muted">
                      {stage.description}
                    </p>
                  ) : null}
                  <div className="mt-2 flex items-center justify-between font-mono text-[8.5px] text-ink-muted">
                    <span>{stage.duration}</span>
                    <span className="truncate pl-1 text-ink-soft">{stage.records}</span>
                  </div>
                  {running ? (
                    <span className="absolute right-2 bottom-0 left-2 h-0.5 overflow-hidden rounded-full bg-teal/15">
                      <motion.span
                        className="block h-full w-1/3 rounded-full bg-teal"
                        animate={{ x: ["-100%", "300%"] }}
                        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                      />
                    </span>
                  ) : null}
                </motion.div>
                {index < stages.length - 1 ? (
                  <div className="flex w-4 shrink-0 items-center justify-center">
                    <ChevronRight className="size-3.5 text-ink-muted/40" />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
