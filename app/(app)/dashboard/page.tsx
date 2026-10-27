"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "motion/react";
import {
  ArrowUpRight,
  RefreshCw,
  ShieldAlert,
  Siren,
  Sparkles,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { PageSkeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Segmented } from "@/components/ui/segmented";
import { Reveal } from "@/components/ui/reveal";
import { useToast } from "@/components/ui/toast";
import { SensorCard } from "@/components/domain/sensor-card";
import { SensorChart, SensorLegend } from "@/components/charts/sensor-chart";
import { HealthRing } from "@/components/charts/health-ring";
import { AnomalyHeatmap } from "@/components/charts/anomaly-heatmap";
import { PipelineStepper } from "@/components/domain/pipeline-stepper";
import { DemoNotice } from "@/components/domain/demo-notice";
import { api } from "@/lib/api";
import { useAsyncData } from "@/lib/hooks";
import {
  type RangeKey,
  type SensorKey,
  RANGES,
  SENSORS,
  SENSOR_MAP,
} from "@/lib/types";
import {
  cn,
  formatDecimal,
  formatNumber,
  formatRelative,
  formatTime,
} from "@/lib/utils";

const statusDistribution = [
  { key: "normal", label: "Normal", color: "#22c55e" },
  { key: "warning", label: "Perhatian", color: "#f4b860" },
  { key: "critical", label: "Kritis", color: "#ef4444" },
  { key: "maintenance", label: "Maintenance", color: "#94a3b8" },
];

export default function DashboardPage() {
  const { data, loading, error, reload } = useAsyncData(() => api.getDashboard(), []);
  const { push } = useToast();
  const [machineId, setMachineId] = useState("");
  const [range, setRange] = useState<RangeKey>("24h");
  const [visible, setVisible] = useState<SensorKey[]>([
    "temperature",
    "vibration",
    "power",
    "noise",
  ]);

  const activeMachineId = data?.machines.some((machine) => machine.id === machineId)
    ? machineId
    : (data?.machines[0]?.id ?? "");

  const selectedMachine =
    data?.machines.find((machine) => machine.id === activeMachineId) ?? data?.machines[0];

  const { data: seriesData } = useAsyncData(
    () =>
      activeMachineId
        ? api.getMachineSeries(activeMachineId, range)
        : Promise.resolve([]),
    [activeMachineId, range],
  );

  const series =
    seriesData && seriesData.length > 0
      ? seriesData
      : activeMachineId === data?.trendMachine?.id && range === "24h"
        ? (data?.trend ?? [])
        : [];
  const latest = series[series.length - 1] ?? selectedMachine?.latest;

  if (loading && !data) return <PageSkeleton />;

  if (error || !data || !selectedMachine || !latest) {
    return (
      <div className="space-y-5">
        <PageHeader
          eyebrow="Command center"
          title="Dashboard"
          description="Tidak dapat memuat data telemetri dari backend FastAPI."
        />
        <div className="panel flex flex-col items-center justify-center gap-3 p-12 text-center">
          <Siren className="size-7 text-amber-500" />
          <p className="text-sm font-semibold text-ink">Gagal memuat dashboard dari backend</p>
          <p className="max-w-md text-xs text-ink-muted">
            {error ?? "Pastikan server FastAPI dan koneksi MongoDB berjalan dengan baik."}
          </p>
          <Button
            variant="secondary"
            onClick={() => {
              api.clearCache();
              reload();
            }}
          >
            <RefreshCw className="size-3.5" /> Coba lagi
          </Button>
        </div>
      </div>
    );
  }

  const toggleSensor = (key: SensorKey) => {
    setVisible((current) => {
      if (current.includes(key)) {
        if (current.length === 1) return current;
        return current.filter((item) => item !== key);
      }
      return [...current, key];
    });
  };

  const deltas = Object.fromEntries(
    SENSORS.map((sensor) => {
      const first = series[0]?.[sensor.key] ?? latest[sensor.key];
      const current = latest[sensor.key];
      return [
        sensor.key,
        first === 0 ? 0 : ((current - first) / first) * 100,
      ];
    }),
  ) as Record<SensorKey, number>;

  const attentionMachines = [...data.machines]
    .sort((a, b) => a.health - b.health)
    .slice(0, 4);

  const sync = () => {
    api.clearCache();
    reload();
    push({
      tone: "success",
      title: "Sinkronisasi backend selesai",
      description: "Data telemetri dimuat ulang dari FastAPI dan MongoDB.",
    });
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Command center"
        title="Dashboard"
        description="Ringkasan kondisi armada, tren empat parameter sensor, dan temuan anomali terbaru dari backend."
        actions={
          <>
            <Select
              value={activeMachineId}
              onChange={(event) => setMachineId(event.target.value)}
              wrapperClassName="w-[204px] max-w-full"
              aria-label="Pilih mesin"
            >
              {data.machines.map((machine) => (
                <option key={machine.id} value={machine.id}>
                  {machine.id} · {machine.name}
                </option>
              ))}
            </Select>
            <Button variant="secondary" size="sm" onClick={sync} className="h-9">
              <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
              Sinkronkan
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Badge tone="green" dot pulse>
            Backend terhubung
          </Badge>
          <span className="font-mono text-[9.5px] text-ink-muted">
            Sinkron terakhir {formatRelative(data.summary.lastSync)} ·{" "}
            {formatTime(data.summary.lastSync)} WIB
          </span>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[9.5px] text-ink-muted">
          <Sparkles className="size-3 text-teal" />
          {formatNumber(data.summary.totalRecords)} rekaman ·{" "}
          {data.summary.activeMachines}/{data.summary.totalMachines} mesin aktif
        </div>
      </div>

      <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        {SENSORS.map((sensor, index) => (
          <SensorCard
            key={sensor.key}
            sensor={sensor}
            value={latest[sensor.key]}
            delta={deltas[sensor.key]}
            history={series.map((point) => point[sensor.key])}
            index={index}
            deltaLabel={RANGES[range].short}
          />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Reveal className="min-w-0 xl:col-span-2" delay={0.08}>
          <section className="panel overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-line px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="mono-label text-teal/90">Sensor trend</span>
                  <span className="size-0.5 rounded-full bg-ink-muted/50" />
                  <span className="font-mono text-[9px] text-ink-muted">
                    {selectedMachine.id}
                  </span>
                </div>
                <h2 className="mt-1 text-[14px] font-bold tracking-[-0.02em] text-ink">
                  {selectedMachine.name}
                </h2>
              </div>
              <Segmented
                value={range}
                onChange={(value) => setRange(value)}
                options={[
                  { value: "24h", label: "24 jam" },
                  { value: "7d", label: "7 hari" },
                  { value: "30d", label: "30 hari" },
                ]}
              />
            </div>
            <div className="p-4">
              <SensorLegend
                visible={visible}
                onToggle={toggleSensor}
                latest={latest}
              />
              <div className="mt-2">
                <SensorChart
                  data={series}
                  visible={visible}
                  range={range}
                  height={310}
                />
              </div>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-line/70 pt-2.5">
                <span className="font-mono text-[8.5px] tracking-[0.04em] text-ink-muted">
                  Sumber: MongoDB sensor_data · FastAPI Telemetry
                </span>
                <Link
                  href={`/sensors?machine=${selectedMachine.id}`}
                  className="flex items-center gap-1 text-[10px] font-medium text-teal transition hover:text-teal-bright"
                >
                  Buka sensor data <ArrowUpRight className="size-3" />
                </Link>
              </div>
            </div>
          </section>
        </Reveal>

        <Reveal className="min-w-0" delay={0.14}>
          <section className="panel flex h-full flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-line px-4 py-3.5">
              <div>
                <div className="mono-label">Fleet health</div>
                <h2 className="mt-1 text-[14px] font-bold tracking-[-0.02em] text-ink">
                  Status armada
                </h2>
              </div>
              <Link
                href="/machines"
                className="flex items-center gap-1 text-[10px] font-medium text-teal transition hover:text-teal-bright"
              >
                Semua <ArrowUpRight className="size-3" />
              </Link>
            </div>

            <div className="flex flex-col items-center px-4 pt-5">
              <HealthRing value={data.summary.healthAvg} label="Rata-rata" size={124} />
              <p className="mt-2 text-center text-[10.5px] leading-relaxed text-ink-muted">
                {data.summary.criticalAnomalies} temuan kritis perlu ditinjau
              </p>
            </div>

            <div className="space-y-2 px-4 py-4">
              {statusDistribution.map((status) => {
                const count =
                  data.statusCounts[
                    status.key as keyof typeof data.statusCounts
                  ] ?? 0;
                return (
                  <div key={status.key}>
                    <div className="mb-1 flex items-center justify-between text-[10px]">
                      <span className="flex items-center gap-1.5 text-ink-soft">
                        <span
                          className="size-1.5 rounded-full"
                          style={{ backgroundColor: status.color }}
                        />
                        {status.label}
                      </span>
                      <span className="font-mono text-ink-muted">{count}</span>
                    </div>
                    <div className="h-1 overflow-hidden rounded-full bg-surface-2">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: status.color }}
                        initial={{ width: 0 }}
                        animate={{
                          width: `${(count / Math.max(1, data.summary.totalMachines)) * 100}%`,
                        }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-auto border-t border-line px-4 py-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="mono-label">Perlu perhatian</span>
                <span className="font-mono text-[8px] text-ink-muted">HEALTH</span>
              </div>
              <div className="space-y-1">
                {attentionMachines.map((machine) => (
                  <Link
                    key={machine.id}
                    href={`/machines/${machine.id}`}
                    className="flex items-center justify-between gap-2 rounded-lg px-1.5 py-1.5 transition hover:bg-surface-2/60"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <StatusBadge status={machine.status} className="scale-90 px-1.5 py-0.5" />
                      <span className="truncate text-[10px] text-ink-soft">
                        {machine.name}
                      </span>
                    </span>
                    <span
                      className={cn(
                        "data-value text-[10px] font-medium",
                        machine.health < 70
                          ? "text-red-500"
                          : machine.health < 85
                            ? "text-amber-500"
                            : "text-emerald-500",
                      )}
                    >
                      {machine.health}%
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        </Reveal>
      </div>

      <div className="grid gap-4 xl:grid-cols-5">
        <Reveal className="min-w-0 xl:col-span-3" delay={0.1}>
          <section className="panel overflow-hidden p-4">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <div className="mono-label">Anomaly heatmap</div>
                <h2 className="mt-1 text-[14px] font-bold tracking-[-0.02em] text-ink">
                  Pola temuan per jam
                </h2>
                <p className="mt-0.5 text-[10.5px] text-ink-muted">
                  Distribusi indikasi anomali tujuh hari terakhir pada dataset.
                </p>
              </div>
              <Badge tone="amber" dot>
                {formatNumber(data.summary.totalAnomalies)} temuan
              </Badge>
            </div>
            <AnomalyHeatmap days={data.heatmap} />
          </section>
        </Reveal>

        <Reveal className="min-w-0 xl:col-span-2" delay={0.16}>
          <section className="panel flex h-full flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-line px-4 py-3.5">
              <div>
                <div className="mono-label">Recent findings</div>
                <h2 className="mt-1 text-[14px] font-bold tracking-[-0.02em] text-ink">
                  Anomali terbaru
                </h2>
              </div>
              <Link
                href="/anomalies"
                className="flex items-center gap-1 text-[10px] font-medium text-teal transition hover:text-teal-bright"
              >
                Semua <ArrowUpRight className="size-3" />
              </Link>
            </div>
            <div className="divide-y divide-line/70">
              {data.anomalies.map((anomaly) => {
                const machine = data.machines.find(
                  (item) => item.id === anomaly.machineId,
                );
                const sensor = SENSOR_MAP[anomaly.parameter];
                return (
                  <Link
                    key={anomaly.id}
                    href="/anomalies"
                    className="group flex gap-3 px-4 py-2.5 transition hover:bg-surface-2/40"
                  >
                    <span
                      className={cn(
                        "mt-1 flex size-6 shrink-0 items-center justify-center rounded-md border",
                        anomaly.severity === "critical"
                          ? "border-red-500/25 bg-red-500/10 text-red-500"
                          : anomaly.severity === "warning"
                            ? "border-amber-500/25 bg-amber-500/10 text-amber-500"
                            : "border-teal/25 bg-teal/10 text-teal",
                      )}
                    >
                      <ShieldAlert className="size-3" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-[11px] font-semibold text-ink">
                          {machine?.name ?? anomaly.machineId}
                        </span>
                        <span className="shrink-0 font-mono text-[8.5px] text-ink-muted">
                          {formatRelative(anomaly.timestamp)}
                        </span>
                      </span>
                      <span className="mt-0.5 flex items-center gap-1.5 text-[9.5px] text-ink-muted">
                        <span
                          className="size-1 rounded-full"
                          style={{ backgroundColor: sensor.color }}
                        />
                        {sensor.label} · {formatDecimal(anomaly.sensors[anomaly.parameter], sensor.decimals)}
                        {sensor.unit}
                      </span>
                    </span>
                    <span className="mt-0.5 data-value shrink-0 text-[10px] font-medium text-amber-500 group-hover:text-amber-400">
                      {anomaly.score.toFixed(2)}
                    </span>
                  </Link>
                );
              })}
            </div>
            <div className="mt-auto border-t border-line p-3">
              <DemoNotice className="border-line bg-surface-2/35 text-[10px]">
                Temuan berasal dari evaluasi model RandomForest & dataset telemetri MongoDB.
              </DemoNotice>
            </div>
          </section>
        </Reveal>
      </div>

      <Reveal delay={0.12}>
        <section className="panel overflow-hidden">
          <div className="flex flex-col gap-2 border-b border-line px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mono-label">Data pipeline</div>
              <h2 className="mt-1 text-[14px] font-bold tracking-[-0.02em] text-ink">
                Dataset → Dashboard
              </h2>
            </div>
            <Link
              href="/processing"
              className="flex items-center gap-1 text-[10px] font-medium text-teal transition hover:text-teal-bright"
            >
              Processing & benchmark <ArrowUpRight className="size-3" />
            </Link>
          </div>
          <div className="p-4">
            <PipelineStepper stages={data.pipeline} compact />
            <div className="mt-4 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: "Missing value", value: `${data.quality.missing}%`, tone: "text-amber-500" },
                { label: "Duplikat", value: `${data.quality.duplicates}%`, tone: "text-ink" },
                { label: "Format invalid", value: `${data.quality.invalid}%`, tone: "text-ink" },
                { label: "Completeness", value: `${data.quality.completeness}%`, tone: "text-emerald-500" },
              ].map((metric) => (
                <div
                  key={metric.label}
                  className="flex items-center justify-between rounded-xl border border-line bg-surface-2/35 px-3 py-2.5"
                >
                  <span className="text-[10px] text-ink-muted">{metric.label}</span>
                  <span className={cn("data-value text-[12px] font-semibold", metric.tone)}>
                    {metric.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </Reveal>
    </div>
  );
}
