"use client";

import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  LineChart,
  RefreshCw,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { PageSkeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Segmented } from "@/components/ui/segmented";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { SensorChart, SensorLegend } from "@/components/charts/sensor-chart";
import { Sparkline } from "@/components/charts/sparkline";
import { DemoNotice } from "@/components/domain/demo-notice";
import { api } from "@/lib/api";
import { useAsyncData } from "@/lib/hooks";
import {
  type RangeKey,
  type SensorKey,
  RANGES,
  SENSORS,
  sensorStatus,
} from "@/lib/types";
import {
  cn,
  downloadCsv,
  formatDateTime,
  formatDecimal,
} from "@/lib/utils";

const PAGE_SIZE = 12;

function SensorsContent() {
  const searchParams = useSearchParams();
  const { data: machines, loading, error, reload } = useAsyncData(() => api.getMachines(), []);
  const { push } = useToast();
  const [machineId, setMachineId] = useState(searchParams.get("machine") ?? "EQ-001");
  const [range, setRange] = useState<RangeKey>("24h");
  const [visible, setVisible] = useState<SensorKey[]>([
    "temperature",
    "vibration",
    "power",
    "noise",
  ]);
  const [page, setPage] = useState(1);
  const [onlyAnomalies, setOnlyAnomalies] = useState(false);

  const activeId = machines?.some((machine) => machine.id === machineId)
    ? machineId
    : (machines?.[0]?.id ?? "");
  const machine = machines?.find((item) => item.id === activeId);
  const { data: seriesData } = useAsyncData(
    () => (activeId ? api.getMachineSeries(activeId, range) : Promise.resolve([])),
    [activeId, range],
  );
  const series = seriesData ?? [];
  const latest =
    series[series.length - 1] ??
    ({
      timestamp: new Date().toISOString(),
      temperature: machine?.base.temperature ?? 0,
      vibration: machine?.base.vibration ?? 0,
      power: machine?.base.power ?? 0,
      noise: machine?.base.noise ?? 0,
    } as (typeof series)[number]);

  const rows = useMemo(() => {
    const list = [...series].reverse();
    return onlyAnomalies ? list.filter((reading) => reading.isAnomaly) : list;
  }, [series, onlyAnomalies]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = rows.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  if (loading && !machines) return <PageSkeleton />;

  if (error) {
    return (
      <div className="space-y-5">
        <PageHeader
          eyebrow="Data explorer"
          title="Sensor Data"
          description="Gagal memuat data sensor dari backend FastAPI."
        />
        <EmptyState
          title="Backend tidak dapat dijangkau"
          description={error}
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                api.clearCache();
                reload();
              }}
            >
              <RefreshCw className="size-3.5" /> Coba lagi
            </Button>
          }
        />
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

  const changeMachine = (value: string) => {
    setMachineId(value);
    setPage(1);
  };

  const changeRange = (value: RangeKey) => {
    setRange(value);
    setPage(1);
  };

  const exportCsv = () => {
    if (!machine) return;
    const csvRows: (string | number)[][] = [
      ["Timestamp", "Temperature (C)", "Vibration (mm/s)", "Power (kW)", "Noise (dB)", "Anomali"],
      ...series.map((reading) => [
        reading.timestamp,
        reading.temperature,
        reading.vibration,
        reading.power,
        reading.noise,
        reading.isAnomaly ? "ya" : "tidak",
      ]),
    ];
    downloadCsv(`senseforge-${machine.id}-${range}-sensors.csv`, csvRows);
    push({
      tone: "success",
      title: "Sensor data diekspor",
      description: `${series.length} baris ${machine.id} diunduh sebagai CSV.`,
    });
  };

  if (!machine || !latest) {
    return (
      <div className="space-y-5">
        <PageHeader eyebrow="Data explorer" title="Sensor Data" />
        <EmptyState
          title="Data sensor belum tersedia"
          description="Pastikan koleksi MongoDB sensor_data telah diimpor melalui halaman Backend API."
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Data explorer"
        title="Sensor Data"
        description="Telusuri histori empat parameter sensor dari koleksi MongoDB sensor_data berdasarkan equipment dan periode."
        actions={
          <>
            <Select
              value={activeId}
              onChange={(event) => changeMachine(event.target.value)}
              wrapperClassName="w-[236px] max-w-full"
              aria-label="Pilih mesin"
            >
              {(machines ?? []).map((item) => (
                <option key={item.id} value={item.id}>
                  {item.id} · {item.name}
                </option>
              ))}
            </Select>
            <Button variant="secondary" size="sm" onClick={exportCsv} className="h-9">
              <Download className="size-3.5" /> Export CSV
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge tone="teal" dot pulse>MongoDB sensor_data</Badge>
          <span className="font-mono text-[9.5px] text-ink-muted">
            {machine.id} · {machine.name} · {RANGES[range].label}
          </span>
        </div>
        <Link
          href={`/machines/${machine.id}`}
          className="flex items-center gap-1 text-[10px] font-medium text-teal transition hover:text-teal-bright"
        >
          Detail mesin <ArrowUpRight className="size-3" />
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {SENSORS.map((sensor, index) => {
          const status = sensorStatus(sensor.key, latest[sensor.key]);
          const first = series[0]?.[sensor.key] ?? 0;
          const delta = first === 0 ? 0 : ((latest[sensor.key] - first) / first) * 100;
          return (
            <motion.div
              key={sensor.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className="panel p-3.5"
            >
              <div className="flex items-center justify-between">
                <span className="mono-label">{sensor.label}</span>
                <span className="size-1.5 rounded-full" style={{ backgroundColor: sensor.color }} />
              </div>
              <div className="mt-1.5 flex items-baseline gap-1">
                <span className="data-value text-[24px] font-semibold tracking-[-0.04em] text-ink">
                  {formatDecimal(latest[sensor.key], sensor.decimals)}
                </span>
                <span className="font-mono text-[9px] text-ink-muted">{sensor.unit}</span>
                <span
                  className={cn(
                    "ml-auto font-mono text-[9px]",
                    delta >= 0 ? "text-amber-500" : "text-emerald-500",
                  )}
                >
                  {delta >= 0 ? "+" : ""}
                  {delta.toFixed(1)}%
                </span>
              </div>
              <div className="mt-2 flex items-end justify-between gap-3">
                <Badge
                  tone={status === "normal" ? "green" : status === "warning" ? "amber" : "red"}
                  dot
                  className="px-1.5 py-0.5 text-[8px]"
                >
                  {status === "normal" ? "Normal" : status === "warning" ? "Perhatian" : "Kritis"}
                </Badge>
                <div className="h-8 w-24">
                  <Sparkline
                    values={series.map((reading) => reading[sensor.key])}
                    color={sensor.color}
                    height={32}
                    delay={0.2}
                  />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <section className="panel overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-line px-4 py-3.5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mono-label text-teal/90">Sensor trend</div>
            <h2 className="mt-1 text-[14px] font-bold tracking-[-0.02em] text-ink">
              {machine.name}
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Segmented
              value={range}
              onChange={changeRange}
              options={[
                { value: "24h", label: "24 jam" },
                { value: "7d", label: "7 hari" },
                { value: "30d", label: "30 hari" },
              ]}
            />
            <Badge tone="steel" className="hidden sm:inline-flex">
              <LineChart className="size-3" /> {series.length} sampel
            </Badge>
          </div>
        </div>
        <div className="p-4">
          <SensorLegend visible={visible} onToggle={toggleSensor} latest={latest} />
          <div className="mt-2">
            <SensorChart data={series} visible={visible} range={range} height={340} />
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-line/70 pt-2.5 font-mono text-[8.5px] text-ink-muted">
            <span>
              {RANGES[range].label} · {series.length} sampel telemetri
            </span>
            <span>Klik legenda untuk menyembunyikan parameter</span>
          </div>
        </div>
      </section>

      <section className="panel overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-line px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mono-label">Sample table</div>
            <h2 className="mt-1 text-[14px] font-bold tracking-[-0.02em] text-ink">
              Histori pembacaan sensor
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setOnlyAnomalies((value) => !value);
                setPage(1);
              }}
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[10px] font-semibold transition",
                onlyAnomalies
                  ? "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  : "border-line text-ink-muted hover:text-ink",
              )}
            >
              <Filter className="size-3" /> Hanya anomali
            </button>
            <span className="font-mono text-[9px] text-ink-muted">
              {rows.length} baris
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead>
              <tr className="border-b border-line bg-surface-2/35">
                <th className="px-4 py-2.5 font-mono text-[8px] font-medium tracking-[0.14em] text-ink-muted uppercase">
                  Timestamp
                </th>
                {SENSORS.map((sensor) => (
                  <th
                    key={sensor.key}
                    className="px-4 py-2.5 font-mono text-[8px] font-medium tracking-[0.14em] text-ink-muted uppercase"
                  >
                    <span className="flex items-center gap-1.5">
                      <span className="size-1 rounded-full" style={{ backgroundColor: sensor.color }} />
                      {sensor.label} ({sensor.unit})
                    </span>
                  </th>
                ))}
                <th className="px-4 py-2.5 font-mono text-[8px] font-medium tracking-[0.14em] text-ink-muted uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/70">
              {pageRows.length ? (
                pageRows.map((reading, idx) => (
                  <tr
                    key={`${reading.timestamp}-${idx}`}
                    className={cn("table-row", reading.isAnomaly && "bg-amber-500/[0.035]")}
                  >
                    <td className="px-4 py-2.5 font-mono text-[9.5px] text-ink-soft">
                      {formatDateTime(reading.timestamp)}
                    </td>
                    {SENSORS.map((sensor) => (
                      <td key={sensor.key} className="data-value px-4 py-2.5 text-[10.5px] text-ink">
                        {formatDecimal(reading[sensor.key], sensor.decimals)}
                      </td>
                    ))}
                    <td className="px-4 py-2.5">
                      {reading.isAnomaly ? (
                        <Badge tone="amber" dot>Anomali</Badge>
                      ) : (
                        <Badge tone="green" dot>Normal</Badge>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-[11px] text-ink-muted">
                    Tidak ada baris anomali pada sampel ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-2 border-t border-line px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between">
          <span className="font-mono text-[9px] text-ink-muted">
            Menampilkan {rows.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0}–
            {Math.min(currentPage * PAGE_SIZE, rows.length)} dari {rows.length} baris
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              variant="secondary"
              size="sm"
              className="h-7 px-2"
              disabled={currentPage <= 1}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
            >
              <ChevronLeft className="size-3.5" />
            </Button>
            <span className="min-w-14 text-center font-mono text-[9px] text-ink-soft">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="secondary"
              size="sm"
              className="h-7 px-2"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
            >
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        </div>
      </section>

      <DemoNotice>
        Data pembacaan sensor diambil langsung dari koleksi MongoDB{" "}
        <span className="font-mono">sensor_data</span> melalui endpoint{" "}
        <span className="font-mono">GET /dataset/records</span>.
      </DemoNotice>
    </div>
  );
}

export default function SensorsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <SensorsContent />
    </Suspense>
  );
}
