"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { BenchmarkRow } from "@/lib/types";
import { formatNumber } from "@/lib/utils";
import { Segmented } from "@/components/ui/segmented";

type Metric = "ingestion" | "query" | "processing" | "throughput";

const metrics: Record<
  Metric,
  { label: string; unit: string; color: string; description: string; decimals: number }
> = {
  ingestion: {
    label: "Latency p95",
    unit: "detik",
    color: "#19a99a",
    description: "Latensi p95 agregasi MongoDB per ukuran sampel dokumen",
    decimals: 3,
  },
  query: {
    label: "Latency p50",
    unit: "ms",
    color: "#f4b860",
    description: "Median latensi query agregasi MongoDB",
    decimals: 1,
  },
  processing: {
    label: "Waktu Proses",
    unit: "detik",
    color: "#5b9df9",
    description: "Rata-rata waktu pemrosesan agregasi MongoDB",
    decimals: 3,
  },
  throughput: {
    label: "Throughput",
    unit: "dok/dtk",
    color: "#a78bfa",
    description: "Dokumen yang diproses per detik pada pipeline MongoDB",
    decimals: 0,
  },
};

export function BenchmarkChart({ rows }: { rows: BenchmarkRow[] }) {
  const [metric, setMetric] = useState<Metric>("throughput");
  const config = metrics[metric];

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[13px] font-semibold text-ink">Perbandingan performa MongoDB</p>
          <p className="mt-0.5 text-[11px] text-ink-muted">{config.description}</p>
        </div>
        <Segmented
          size="sm"
          value={metric}
          onChange={setMetric}
          options={[
            { value: "throughput", label: "Throughput" },
            { value: "query", label: "Query p50" },
            { value: "processing", label: "Proses" },
            { value: "ingestion", label: "Latency p95" },
          ]}
        />
      </div>
      <div className="h-[240px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
            <defs>
              <linearGradient id="benchmark-bar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={config.color} stopOpacity={0.9} />
                <stop offset="100%" stopColor={config.color} stopOpacity={0.3} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="2 6"
              stroke="var(--line)"
              vertical={false}
            />
            <XAxis
              dataKey="dataset"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
            />
            <YAxis tickLine={false} axisLine={false} width={52} />
            <Tooltip
              cursor={{ fill: "var(--surface-2)", opacity: 0.45 }}
              contentStyle={{
                background: "var(--surface)",
                border: "1px solid var(--line-strong)",
                borderRadius: "12px",
                fontSize: "11px",
                color: "var(--ink)",
                boxShadow: "0 18px 40px -20px rgba(0,0,0,.35)",
              }}
              formatter={(value) => [
                `${formatNumber(Number(value), config.decimals)} ${config.unit}`,
                config.label,
              ]}
            />
            <Bar
              dataKey={metric}
              fill="url(#benchmark-bar)"
              radius={[6, 6, 2, 2]}
              maxBarSize={56}
              animationDuration={700}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
