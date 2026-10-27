"use client";

import { useId } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
  size = "md",
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  size?: "sm" | "md";
}) {
  const layoutId = useId();

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-xl border border-line bg-surface-2/50 p-1",
        className,
      )}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "relative rounded-lg font-semibold transition-colors",
              size === "sm"
                ? "px-2.5 py-1 text-[10px]"
                : "px-3 py-1.5 text-[11px]",
              active ? "text-teal" : "text-ink-muted hover:text-ink",
            )}
          >
            {active ? (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-lg border border-teal/25 bg-teal/10"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            ) : null}
            <span className="relative">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
