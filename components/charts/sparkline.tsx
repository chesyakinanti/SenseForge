"use client";

import { useId } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

function buildPoints(values: number[], width: number, height: number, pad = 3) {
  if (!values.length) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  return values.map((value, index) => ({
    x: pad + (index / Math.max(1, values.length - 1)) * (width - pad * 2),
    y: pad + (1 - (value - min) / span) * (height - pad * 2),
  }));
}

function smoothPath(points: { x: number; y: number }[]) {
  if (!points.length) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    const midX = (previous.x + current.x) / 2;
    path += ` C ${midX} ${previous.y}, ${midX} ${current.y}, ${current.x} ${current.y}`;
  }
  return path;
}

export function Sparkline({
  values,
  color = "#19a99a",
  width = 140,
  height = 44,
  showArea = true,
  className,
  delay = 0.15,
}: {
  values: number[];
  color?: string;
  width?: number;
  height?: number;
  showArea?: boolean;
  className?: string;
  delay?: number;
}) {
  const rawId = useId();
  const id = `spark-${rawId.replace(/[^a-zA-Z0-9]/g, "")}`;
  const points = buildPoints(values, width, height);
  const line = smoothPath(points);
  const area = `${line} L ${width - 3} ${height} L 3 ${height} Z`;
  const last = points[points.length - 1];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={cn("h-full w-full overflow-visible", className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {showArea ? (
        <motion.path
          d={area}
          fill={`url(#${id})`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay }}
        />
      ) : null}
      <motion.path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0.5 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.1, delay, ease: [0.22, 1, 0.36, 1] }}
      />
      {last ? (
        <>
          <motion.circle
            cx={last.x}
            cy={last.y}
            r="2.4"
            fill={color}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: delay + 0.7, type: "spring", stiffness: 380 }}
          />
          <motion.circle
            cx={last.x}
            cy={last.y}
            r="5"
            fill="none"
            stroke={color}
            strokeWidth="0.8"
            initial={{ scale: 0.4, opacity: 0.6 }}
            animate={{ scale: [0.5, 1.7], opacity: [0.5, 0] }}
            transition={{
              duration: 2.2,
              repeat: Infinity,
              delay: delay + 0.8,
              ease: "easeOut",
            }}
          />
        </>
      ) : null}
    </svg>
  );
}
