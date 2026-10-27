"use client";

import { motion } from "motion/react";
import {
  Activity,
  AudioWaveform,
  Thermometer,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Sparkline } from "@/components/charts/sparkline";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { AnimatedNumber } from "@/components/ui/animated-number";
import type { SensorMeta } from "@/lib/types";
import { sensorStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const icons = {
  temperature: Thermometer,
  vibration: AudioWaveform,
  power: Zap,
  noise: Activity,
};

const statusTone: Record<string, BadgeTone> = {
  normal: "green",
  warning: "amber",
  critical: "red",
};

const statusLabel: Record<string, string> = {
  normal: "Normal",
  warning: "Perhatian",
  critical: "Kritis",
};

export function SensorCard({
  sensor,
  value,
  delta,
  history,
  index = 0,
  className,
  deltaLabel = "24 jam",
}: {
  sensor: SensorMeta;
  value: number;
  delta: number;
  history: number[];
  index?: number;
  className?: string;
  deltaLabel?: string;
}) {
  const Icon = icons[sensor.key];
  const status = sensorStatus(sensor.key, value);
  const positiveDelta = delta >= 0;
  const DeltaIcon = positiveDelta ? TrendingUp : TrendingDown;

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: 0.06 * index,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={cn(
        "panel panel-interactive scanline group overflow-hidden p-4",
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="mono-label">{sensor.baselineLabel}</div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <AnimatedNumber
              value={value}
              decimals={sensor.decimals}
              className="data-value text-[30px] leading-none font-semibold tracking-[-0.05em] text-ink"
            />
            <span className="font-mono text-[10px] text-ink-muted">{sensor.unit}</span>
          </div>
        </div>
        <div
          className="flex size-9 items-center justify-center rounded-xl border transition-transform duration-300 group-hover:scale-105"
          style={{
            borderColor: `${sensor.color}25`,
            backgroundColor: `${sensor.color}12`,
            color: sensor.color,
          }}
        >
          <Icon className="size-4" strokeWidth={1.8} />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <Badge tone={statusTone[status]} dot pulse={status === "critical"}>
          {statusLabel[status]}
        </Badge>
        <span
          className={cn(
            "flex items-center gap-1 font-mono text-[9.5px]",
            positiveDelta ? "text-amber-500" : "text-emerald-500",
          )}
        >
          <DeltaIcon className="size-3" />
          {positiveDelta ? "+" : ""}
          {delta.toFixed(1)}%
          <span className="text-ink-muted">{deltaLabel}</span>
        </span>
      </div>

      <div className="mt-3 h-11 w-full">
        <Sparkline
          values={history}
          color={sensor.color}
          height={44}
          delay={0.2 + index * 0.05}
        />
      </div>
    </motion.article>
  );
}
