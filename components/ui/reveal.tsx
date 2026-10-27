"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export function Reveal({
  children,
  delay = 0,
  y = 12,
  className,
  once = false,
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  once?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      whileInView={once ? { opacity: 1, y: 0 } : undefined}
      viewport={once ? { once: true, margin: "-60px" } : undefined}
      transition={{ duration: 0.48, delay, ease: [0.22, 1, 0.36, 1] }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}
