"use client";

import { useId } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export function HealthRing({
  value,
  size = 132,
  stroke = 8,
  className,
  label = "Kesehatan",
  hideValue = false,
}: {
  value: number;
  size?: number;
  stroke?: number;
  className?: string;
  label?: string;
  hideValue?: boolean;
}) {
  const rawId = useId();
  const id = `ring-${rawId.replace(/[^a-zA-Z0-9]/g, "")}`;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference;
  const color = value >= 85 ? "#19a99a" : value >= 70 ? "#f4b860" : "#ef4444";

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.55" />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--line)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${id})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
          style={{ filter: `drop-shadow(0 0 8px ${color}55)` }}
        />
      </svg>
      {!hideValue ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="data-value text-[26px] leading-none font-semibold text-ink">
            {value}
            <span className="ml-0.5 text-[12px] text-ink-muted">%</span>
          </span>
          <span className="mt-1.5 font-mono text-[8px] tracking-[0.18em] text-ink-muted uppercase">
            {label}
          </span>
        </div>
      ) : null}
    </div>
  );
}
