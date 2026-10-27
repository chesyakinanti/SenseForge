"use client";

import { useEffect, useRef, useState } from "react";
import { formatNumber } from "@/lib/utils";

export function AnimatedNumber({
  value,
  decimals = 0,
  duration = 900,
  className,
  suffix,
}: {
  value: number;
  decimals?: number;
  duration?: number;
  className?: string;
  suffix?: string;
}) {
  const [display, setDisplay] = useState(0);
  const current = useRef(0);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      current.current = value;
      setDisplay(value);
      return;
    }

    const from = current.current;
    let frame = 0;
    let start: number | null = null;

    const tick = (time: number) => {
      if (start === null) start = time;
      const progress = Math.min(1, (time - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = from + (value - from) * eased;
      current.current = next;
      setDisplay(next);
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);

  return (
    <span className={className}>
      {formatNumber(display, decimals)}
      {suffix ? <span className="ml-1">{suffix}</span> : null}
    </span>
  );
}
