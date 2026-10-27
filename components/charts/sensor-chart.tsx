"use client";

import { useId } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  type RangeKey,
  type SensorKey,
  type SensorReading,
  SENSORS,
  SENSOR_MAP,
} from "@/lib/types";
import { formatDateShort, formatDecimal, formatTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

type TooltipEntry = {
  dataKey?: string | number;
  value?: number | string;
  color?: string;
  name?: string;
};

function ChartTooltip({
  active,
  payload,
  label,
  range,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
  range: RangeKey;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="min-w-[180px] rounded-xl border border-line-strong bg-surface/95 p-3 shadow-2xl backdrop-blur-xl">
      <div className="mono-label mb-2">
        {range === "24h"
          ? `${formatTime(label ?? "")} WIB`
          : `${formatDateShort(label ?? "")} · ${formatTime(label ?? "")} WIB`}
      </div>
      <div className="space-y-1.5">
        {payload.map((entry) => {
          const sensor = SENSOR_MAP[entry.dataKey as SensorKey];
          if (!sensor) return null;
          return (
            <div
              key={String(entry.dataKey)}
              className="flex items-center justify-between gap-4 text-[11px]"
            >
              <span className="flex items-center gap-1.5 text-ink-soft">
                <span
                  className="size-1.5 rounded-full"
                  style={{ backgroundColor: sensor.color }}
                />
                {sensor.label}
              </span>
              <span className="data-value font-medium text-ink">
                {formatDecimal(Number(entry.value), sensor.decimals)}
                <span className="ml-1 text-[9px] font-normal text-ink-muted">
                  {sensor.unit}
                </span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function SensorChart({
  data,
  visible,
  range,
  height = 300,
  className,
  minimal = false,
}: {
  data: SensorReading[];
  visible: SensorKey[];
  range: RangeKey;
  height?: number;
  className?: string;
  minimal?: boolean;
}) {
  const rawId = useId();
  const id = `chart-${rawId.replace(/[^a-zA-Z0-9]/g, "")}`;
  const tickFormatter = (value: string) =>
    range === "24h" ? formatTime(value) : formatDateShort(value);

  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{ top: 8, right: visible.some((key) => key === "vibration" || key === "power") ? 4 : 0, left: minimal ? -22 : -10, bottom: 0 }}
        >
          <defs>
            <linearGradient id={`${id}-temp`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f4b860" stopOpacity={0.26} />
              <stop offset="100%" stopColor="#f4b860" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="2 6"
            stroke="var(--line)"
            vertical={false}
          />
          <XAxis
            dataKey="timestamp"
            tickFormatter={tickFormatter}
            tickLine={false}
            axisLine={false}
            minTickGap={48}
            tickMargin={10}
          />
          <YAxis
            yAxisId="left"
            domain={["auto", "auto"]}
            tickLine={false}
            axisLine={false}
            width={36}
            tickCount={minimal ? 3 : 5}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            domain={[0, "auto"]}
            tickLine={false}
            axisLine={false}
            width={minimal ? 28 : 36}
            tickCount={minimal ? 3 : 5}
            hide={!visible.includes("vibration")}
          />
          <Tooltip
            cursor={{ stroke: "var(--line-strong)", strokeDasharray: "3 4" }}
            content={<ChartTooltip range={range} />}
          />

          {visible.includes("temperature") ? (
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="temperature"
              stroke="#f4b860"
              strokeWidth={1.9}
              fill={`url(#${id}-temp)`}
              dot={false}
              activeDot={{ r: 3.5, strokeWidth: 0, fill: "#f4b860" }}
              animationDuration={900}
            />
          ) : null}
          {visible.includes("vibration") ? (
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="vibration"
              stroke="#19a99a"
              strokeWidth={1.9}
              dot={false}
              activeDot={{ r: 3.5, strokeWidth: 0, fill: "#19a99a" }}
              animationDuration={900}
            />
          ) : null}
          {visible.includes("power") ? (
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="power"
              stroke="#5b9df9"
              strokeWidth={1.7}
              dot={false}
              activeDot={{ r: 3.5, strokeWidth: 0, fill: "#5b9df9" }}
              animationDuration={900}
            />
          ) : null}
          {visible.includes("noise") ? (
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="noise"
              stroke="#a78bfa"
              strokeWidth={1.7}
              dot={false}
              activeDot={{ r: 3.5, strokeWidth: 0, fill: "#a78bfa" }}
              animationDuration={900}
            />
          ) : null}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SensorLegend({
  visible,
  onToggle,
  latest,
}: {
  visible: SensorKey[];
  onToggle: (key: SensorKey) => void;
  latest?: SensorReading;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {SENSORS.map((sensor) => {
        const active = visible.includes(sensor.key);
        return (
          <button
            key={sensor.key}
            type="button"
            onClick={() => onToggle(sensor.key)}
            className={cn(
              "group inline-flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[10px] font-semibold transition-all duration-200",
              active
                ? "border-line-strong bg-surface-2/70 text-ink"
                : "border-transparent bg-transparent text-ink-muted hover:bg-surface-2/60",
            )}
          >
            <span
              className="size-1.5 rounded-full transition-opacity"
              style={{
                backgroundColor: sensor.color,
                opacity: active ? 1 : 0.35,
              }}
            />
            <span>{sensor.label}</span>
            {latest ? (
              <span className="data-value text-[9.5px] font-medium text-ink-muted">
                {formatDecimal(latest[sensor.key], sensor.decimals)}
                {sensor.unit}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
