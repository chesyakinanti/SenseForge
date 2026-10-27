"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowUpRight, MapPin, ShieldAlert } from "lucide-react";
import { Sparkline } from "@/components/charts/sparkline";
import { Badge, StatusBadge } from "@/components/ui/badge";
import type { MachineView } from "@/lib/types";
import { SENSORS } from "@/lib/types";
import { cn, formatDecimal } from "@/lib/utils";

const healthColor = (health: number) =>
  health >= 85 ? "#19a99a" : health >= 70 ? "#f4b860" : "#ef4444";

export function MachineCard({
  machine,
  index = 0,
  className,
}: {
  machine: MachineView;
  index?: number;
  className?: string;
}) {
  const color = healthColor(machine.health);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      <Link
        href={`/machines/${machine.id}`}
        className="panel panel-interactive group block overflow-hidden p-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[9px] tracking-[0.14em] text-ink-muted">
                {machine.id}
              </span>
              <span className="size-0.5 rounded-full bg-ink-muted/50" />
              <span className="font-mono text-[9px] text-ink-muted">{machine.line}</span>
            </div>
            <h3 className="mt-1 truncate text-[14px] font-bold tracking-[-0.02em] text-ink">
              {machine.name}
            </h3>
            <p className="mt-1 flex items-center gap-1.5 truncate text-[10.5px] text-ink-muted">
              <MapPin className="size-3 shrink-0" />
              {machine.location}
            </p>
          </div>
          <StatusBadge status={machine.status} />
        </div>

        <div className="mt-4 flex items-end justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between">
              <span className="mono-label">Health score</span>
              <span className="data-value text-[13px] font-semibold" style={{ color }}>
                {machine.health}%
              </span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-2">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: color }}
                initial={{ width: 0 }}
                animate={{ width: `${machine.health}%` }}
                transition={{ duration: 0.9, delay: 0.15 + index * 0.04 }}
              />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2">
              {SENSORS.map((sensor) => (
                <div key={sensor.key} className="flex items-baseline justify-between gap-1">
                  <span className="text-[9.5px] text-ink-muted">{sensor.short}</span>
                  <span className="data-value text-[10.5px] font-medium text-ink-soft">
                    {formatDecimal(machine.latest[sensor.key], sensor.decimals)}
                    <span className="ml-0.5 text-[8px] text-ink-muted">{sensor.unit}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="w-[84px] shrink-0">
            <Sparkline
              values={machine.sparkline.map((point) => point.vibration)}
              color={color}
              width={84}
              height={54}
              delay={0.2 + index * 0.04}
            />
          </div>
        </div>

        <div className="mt-3.5 flex items-center justify-between border-t border-line/70 pt-3">
          <span className="flex items-center gap-1.5 text-[10px] text-ink-muted">
            {machine.anomalyCount > 0 ? (
              <>
                <ShieldAlert className="size-3 text-amber-500" />
                {machine.anomalyCount} temuan anomali
              </>
            ) : (
              <span className="text-emerald-500">Tidak ada temuan</span>
            )}
          </span>
          <span className="flex items-center gap-1 font-mono text-[9px] text-ink-muted transition group-hover:text-teal">
            Detail <ArrowUpRight className="size-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
