"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  Activity,
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  Download,
  Factory,
  MapPin,
  RefreshCw,
  ShieldAlert,
  Wrench,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { PageSkeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Segmented } from "@/components/ui/segmented";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { HealthRing } from "@/components/charts/health-ring";
import { Sparkline } from "@/components/charts/sparkline";
import { SensorChart, SensorLegend } from "@/components/charts/sensor-chart";
import { ScoreBar } from "@/components/charts/score-bar";
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
  formatDate,
  formatDateTime,
  formatDecimal,
  formatNumber,
  formatTime,
} from "@/lib/utils";

const tabs = ["Ringkasan", "Sensor", "Anomali", "Maintenance"] as const;
type Tab = (typeof tabs)[number];

export default function MachineDetailPage() {
  const params = useParams<{ id: string }>();
  const id = typeof params.id === "string" ? params.id : "";
  const [range, setRange] = useState<RangeKey>("24h");
  const { data: machine, loading, error, reload } = useAsyncData(() => api.getMachine(id), [id]);
  const { data: logs } = useAsyncData(() => api.getMaintenance(), []);
  const { data: seriesData } = useAsyncData(() => api.getMachineSeries(id, range), [id, range]);
  const { data: anomalyData } = useAsyncData(() => api.getAnomalies(), []);
  const { push } = useToast();
  const [tab, setTab] = useState<Tab>("Ringkasan");
  const [visible, setVisible] = useState<SensorKey[]>([
    "temperature",
    "vibration",
    "power",
    "noise",
  ]);

  const series = seriesData ?? [];
  const anomalies = useMemo(
    () => (anomalyData ?? []).filter((anomaly) => anomaly.machineId === id),
    [anomalyData, id],
  );
  const machineLogs = useMemo(
    () => (logs ?? []).filter((log) => log.machineId === id),
    [logs, id],
  );

  if (loading && !machine) return <PageSkeleton />;

  if (error) {
    return (
      <div className="space-y-5">
        <PageHeader
          eyebrow="Asset detail"
          title="Gagal memuat detail mesin"
          description={error}
        />
        <EmptyState
          title="Backend tidak dapat dijangkau"
          description="Pastikan server FastAPI dan koneksi MongoDB berjalan dengan baik."
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

  if (!machine) {
    return (
      <div className="space-y-5">
        <PageHeader
          eyebrow="Asset detail"
          title="Mesin tidak ditemukan"
          description="Equipment ID tidak ditemukan pada koleksi MongoDB sensor_data."
        />
        <EmptyState
          title="Tidak ada mesin dengan ID tersebut"
          description="Kembali ke daftar mesin untuk memilih unit equipment yang tersedia (EQ-001 s/d EQ-005)."
          action={
            <Link href="/machines">
              <Button variant="secondary" size="sm">
                <ArrowLeft className="size-3.5" /> Kembali ke machines
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  const latest =
    series[series.length - 1] ??
    ({
      timestamp: new Date().toISOString(),
      temperature: machine?.base.temperature ?? 0,
      vibration: machine?.base.vibration ?? 0,
      power: machine?.base.power ?? 0,
      noise: machine?.base.noise ?? 0,
    } as (typeof series)[number]);
  const deltas = Object.fromEntries(
    SENSORS.map((sensor) => {
      const first = series[0]?.[sensor.key] ?? latest[sensor.key];
      return [
        sensor.key,
        first === 0 ? 0 : ((latest[sensor.key] - first) / first) * 100,
      ];
    }),
  ) as Record<SensorKey, number>;

  const toggleSensor = (key: SensorKey) => {
    setVisible((current) => {
      if (current.includes(key)) {
        if (current.length === 1) return current;
        return current.filter((item) => item !== key);
      }
      return [...current, key];
    });
  };

  const exportMachineCsv = () => {
    const rows: (string | number)[][] = [
      ["Timestamp", "Temperature (C)", "Vibration (mm/s)", "Power (kW)", "Noise (dB)", "Anomali"],
      ...series.map((point) => [
        point.timestamp,
        point.temperature,
        point.vibration,
        point.power,
        point.noise,
        point.isAnomaly ? "ya" : "tidak",
      ]),
    ];
    downloadCsv(`senseforge-${machine.id}-${range}.csv`, rows);
    push({
      tone: "success",
      title: "Data mesin diekspor",
      description: `${series.length} baris telemetri ${machine.id} diunduh.`,
    });
  };

  const trendPanel = (
    <section className="panel overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-line px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mono-label text-teal/90">Sensor trend</div>
          <h2 className="mt-1 text-[14px] font-bold tracking-[-0.02em] text-ink">
            Empat parameter utama
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Segmented
            value={range}
            onChange={setRange}
            options={[
              { value: "24h", label: "24 jam" },
              { value: "7d", label: "7 hari" },
              { value: "30d", label: "30 hari" },
            ]}
          />
          <Button variant="secondary" size="sm" onClick={exportMachineCsv} className="h-8">
            <Download className="size-3" />
            <span className="hidden sm:inline">CSV</span>
          </Button>
        </div>
      </div>
      <div className="p-4">
        <SensorLegend visible={visible} onToggle={toggleSensor} latest={latest} />
        <div className="mt-2">
          <SensorChart data={series} visible={visible} range={range} height={300} />
        </div>
        <div className="mt-2 flex items-center justify-between border-t border-line/70 pt-2.5 font-mono text-[8.5px] text-ink-muted">
          <span>{RANGES[range].label} · {series.length} sampel</span>
          <span>MongoDB sensor_data · WIB</span>
        </div>
      </div>
    </section>
  );

  return (
    <div className="space-y-5">
      <Link
        href="/machines"
        className="inline-flex items-center gap-1.5 font-mono text-[9px] tracking-[0.12em] text-ink-muted uppercase transition hover:text-teal"
      >
        <ArrowLeft className="size-3" /> Kembali ke machines
      </Link>

      <PageHeader
        eyebrow={`${machine.id} · ${machine.line}`}
        title={machine.name}
        description={machine.description}
        actions={
          <>
            <StatusBadge status={machine.status} />
            <Link href={`/sensors?machine=${machine.id}`}>
              <Button variant="secondary" size="sm" className="h-9">
                <Activity className="size-3.5" /> Buka sensor data
              </Button>
            </Link>
          </>
        }
      />

      <div className="grid gap-3.5 xl:grid-cols-4">
        <section className="panel flex flex-col items-center p-4 xl:col-span-1">
          <div className="flex w-full items-center justify-between">
            <span className="mono-label">Machine health</span>
            <Badge tone="teal" dot pulse>
              Telemetry aktif
            </Badge>
          </div>
          <div className="py-3">
            <HealthRing value={machine.health} label="Health score" size={136} />
          </div>
          <div className="grid w-full grid-cols-3 gap-2 border-t border-line pt-3">
            <div className="text-center">
              <p className="data-value text-[13px] font-semibold text-ink">{machine.uptime}%</p>
              <p className="mt-0.5 font-mono text-[7.5px] tracking-[0.1em] text-ink-muted uppercase">
                Uptime
              </p>
            </div>
            <div className="border-x border-line text-center">
              <p className={cn("data-value text-[13px] font-semibold", machine.anomalyCount > 0 ? "text-amber-500" : "text-emerald-500")}>
                {formatNumber(machine.anomalyCount)}
              </p>
              <p className="mt-0.5 font-mono text-[7.5px] tracking-[0.1em] text-ink-muted uppercase">
                Anomali
              </p>
            </div>
            <div className="text-center">
              <p className="data-value text-[13px] font-semibold text-ink">{machine.health}%</p>
              <p className="mt-0.5 font-mono text-[7.5px] tracking-[0.1em] text-ink-muted uppercase">
                Skor
              </p>
            </div>
          </div>
        </section>

        <section className="panel p-4 xl:col-span-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="mono-label">Parameter terakhir</div>
              <h2 className="mt-1 text-[14px] font-bold tracking-[-0.02em] text-ink">
                Snapshot sensor
              </h2>
            </div>
            <span className="font-mono text-[8.5px] text-ink-muted">
              {formatDateTime(latest.timestamp)} WIB
            </span>
          </div>
          <div className="mt-3 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
            {SENSORS.map((sensor) => {
              const status = sensorStatus(sensor.key, latest[sensor.key]);
              return (
                <div
                  key={sensor.key}
                  className="rounded-xl border border-line bg-surface-2/30 p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-ink-muted">{sensor.label}</span>
                    <span
                      className="size-1.5 rounded-full"
                      style={{ backgroundColor: sensor.color }}
                    />
                  </div>
                  <div className="mt-1.5 flex items-baseline gap-1">
                    <span className="data-value text-[20px] font-semibold text-ink">
                      {formatDecimal(latest[sensor.key], sensor.decimals)}
                    </span>
                    <span className="font-mono text-[8.5px] text-ink-muted">{sensor.unit}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <Badge
                      tone={status === "normal" ? "green" : status === "warning" ? "amber" : "red"}
                      dot
                      className="px-1.5 py-0.5 text-[8px]"
                    >
                      {status === "normal" ? "Normal" : status === "warning" ? "Perhatian" : "Kritis"}
                    </Badge>
                    <span
                      className={cn(
                        "font-mono text-[8.5px]",
                        deltas[sensor.key] >= 0 ? "text-amber-500" : "text-emerald-500",
                      )}
                    >
                      {deltas[sensor.key] >= 0 ? "+" : ""}
                      {deltas[sensor.key].toFixed(1)}%
                    </span>
                  </div>
                  <div className="mt-1.5 h-7">
                    <Sparkline
                      values={series.map((point) => point[sensor.key])}
                      color={sensor.color}
                      height={28}
                      delay={0.2}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-line pt-3 text-[10px] sm:grid-cols-4">
            <span className="flex items-center gap-1.5 text-ink-muted">
              <Factory className="size-3" /> {machine.type}
            </span>
            <span className="flex items-center gap-1.5 text-ink-muted">
              <MapPin className="size-3" /> {machine.location}
            </span>
            <span className="flex items-center gap-1.5 text-ink-muted">
              <CalendarDays className="size-3" /> Terpasang {formatDate(machine.installedAt)}
            </span>
            <span className="flex items-center gap-1.5 text-ink-muted">
              <Wrench className="size-3" /> Servis {formatDate(machine.lastService)}
            </span>
          </div>
        </section>
      </div>

      <div className="flex items-center gap-1 border-b border-line">
        {tabs.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={cn(
              "relative px-3.5 py-2.5 text-[11.5px] font-semibold transition",
              tab === item ? "text-teal" : "text-ink-muted hover:text-ink",
            )}
          >
            {item}
            {item === "Anomali" && anomalies.length > 0 ? (
              <span className="ml-1.5 rounded border border-amber-500/20 bg-amber-500/10 px-1 py-0.5 font-mono text-[8px] text-amber-500">
                {anomalies.length}
              </span>
            ) : null}
            {tab === item ? (
              <motion.span
                layoutId="machine-tab"
                className="absolute right-1 bottom-0 left-1 h-0.5 rounded-full bg-teal"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            ) : null}
          </button>
        ))}
      </div>

      {tab === "Ringkasan" ? (
        <div className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-3">
            <div className="xl:col-span-2">{trendPanel}</div>
            <section className="panel flex flex-col overflow-hidden">
              <div className="flex items-center justify-between border-b border-line px-4 py-3.5">
                <div>
                  <div className="mono-label">Anomaly history</div>
                  <h2 className="mt-1 text-[14px] font-bold tracking-[-0.02em] text-ink">
                    Temuan mesin
                  </h2>
                </div>
                <Link href={`/anomalies?machine=${machine.id}`} className="text-[10px] font-medium text-teal">
                  Semua
                </Link>
              </div>
              {anomalies.length ? (
                <div className="divide-y divide-line/70">
                  {anomalies.slice(0, 4).map((anomaly) => (
                    <Link
                      key={anomaly.id}
                      href={`/anomalies?machine=${machine.id}`}
                      className="flex items-start gap-2.5 px-4 py-3 transition hover:bg-surface-2/40"
                    >
                      <ShieldAlert
                        className={cn(
                          "mt-0.5 size-3.5 shrink-0",
                          anomaly.severity === "critical"
                            ? "text-red-500"
                            : anomaly.severity === "warning"
                              ? "text-amber-500"
                              : "text-teal",
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[10.5px] font-semibold text-ink">
                          {anomaly.note}
                        </p>
                        <p className="mt-0.5 font-mono text-[8.5px] text-ink-muted">
                          {anomaly.id} · {formatTime(anomaly.timestamp)} WIB
                        </p>
                      </div>
                      <ScoreBar value={anomaly.score} />
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="flex flex-1 items-center justify-center p-6 text-center">
                  <p className="text-[11px] text-ink-muted">Tidak ada anomali pada mesin ini.</p>
                </div>
              )}
              <div className="mt-auto border-t border-line p-3">
                <DemoNotice className="border-line bg-surface-2/35 text-[10px]">
                  Skor anomali dihitung dari prioritas perawatan & evaluasi model RandomForest.
                </DemoNotice>
              </div>
            </section>
          </div>

          <section className="panel overflow-hidden">
            <div className="flex items-center justify-between border-b border-line px-4 py-3.5">
              <div>
                <div className="mono-label">Maintenance</div>
                <h2 className="mt-1 text-[14px] font-bold tracking-[-0.02em] text-ink">
                  Riwayat perawatan
                </h2>
              </div>
              <Link href="/maintenance" className="flex items-center gap-1 text-[10px] font-medium text-teal">
                Buka log <ArrowUpRight className="size-3" />
              </Link>
            </div>
            {machineLogs.length ? (
              <div className="grid gap-2 p-4 sm:grid-cols-2 xl:grid-cols-4">
                {machineLogs.map((log) => (
                  <div key={log.id} className="rounded-xl border border-line bg-surface-2/30 p-3">
                    <div className="flex items-center justify-between">
                      <StatusBadge status={log.status} />
                      <span className="font-mono text-[8px] text-ink-muted">{log.id}</span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-[10.5px] font-semibold text-ink">
                      {log.title}
                    </p>
                    <p className="mt-1 text-[9.5px] text-ink-muted">{log.technician}</p>
                    <p className="mt-1 font-mono text-[8.5px] text-ink-muted">
                      {formatDate(log.date)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-[11px] text-ink-muted">
                Belum ada catatan perawatan untuk mesin ini.
              </div>
            )}
          </section>
        </div>
      ) : null}

      {tab === "Sensor" ? (
        <div className="space-y-4">
          {trendPanel}
          <section className="panel overflow-hidden">
            <div className="flex items-center justify-between border-b border-line px-4 py-3.5">
              <div>
                <div className="mono-label">Sample log</div>
                <h2 className="mt-1 text-[14px] font-bold tracking-[-0.02em] text-ink">
                  10 sampel terakhir
                </h2>
              </div>
              <Button variant="secondary" size="sm" onClick={exportMachineCsv} className="h-8">
                <Download className="size-3" /> Export
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left">
                <thead>
                  <tr className="border-b border-line bg-surface-2/30">
                    {["Waktu", ...SENSORS.map((sensor) => `${sensor.label} (${sensor.unit})`), "Status"].map(
                      (header) => (
                        <th key={header} className="px-4 py-2.5 font-mono text-[8px] font-medium tracking-[0.12em] text-ink-muted uppercase">
                          {header}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/70">
                  {[...series].slice(-10).reverse().map((reading, idx) => (
                    <tr key={`${reading.timestamp}-${idx}`} className="table-row">
                      <td className="px-4 py-2.5 font-mono text-[9.5px] text-ink-soft">
                        {formatDateTime(reading.timestamp)}
                      </td>
                      {SENSORS.map((sensor) => (
                        <td key={sensor.key} className="px-4 py-2.5 data-value text-[10.5px] text-ink">
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
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      ) : null}

      {tab === "Anomali" ? (
        <section className="panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-4 py-3.5">
            <div>
              <div className="mono-label">Anomaly history</div>
              <h2 className="mt-1 text-[14px] font-bold tracking-[-0.02em] text-ink">
                Semua temuan · {machine.id}
              </h2>
            </div>
            <Link href={`/anomalies?machine=${machine.id}`} className="flex items-center gap-1 text-[10px] font-medium text-teal">
              Buka daftar anomali <ArrowUpRight className="size-3" />
            </Link>
          </div>
          {anomalies.length ? (
            <div className="divide-y divide-line/70">
              {anomalies.map((anomaly) => (
                <div key={anomaly.id} className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg border border-line bg-surface-2 text-ink-muted">
                      <ShieldAlert className="size-3.5" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[9px] text-ink-muted">{anomaly.id}</span>
                        <Badge tone={anomaly.severity === "critical" ? "red" : anomaly.severity === "warning" ? "amber" : "teal"} dot>
                          {anomaly.severity === "critical" ? "Kritis" : anomaly.severity === "warning" ? "Peringatan" : "Info"}
                        </Badge>
                        <StatusBadge status={anomaly.status} />
                      </div>
                      <p className="mt-1 text-[11px] font-medium text-ink">{anomaly.note}</p>
                      <p className="mt-0.5 font-mono text-[8.5px] text-ink-muted">
                        {formatDateTime(anomaly.timestamp)} WIB · {anomaly.parameter}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                    <ScoreBar value={anomaly.score} />
                    <span className="font-mono text-[8.5px] text-ink-muted">{anomaly.model}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="Tidak ada anomali" description="Mesin ini tidak memiliki temuan anomali pada dataset." className="border-0" />
          )}
        </section>
      ) : null}

      {tab === "Maintenance" ? (
        <section className="panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-4 py-3.5">
            <div>
              <div className="mono-label">Maintenance log</div>
              <h2 className="mt-1 text-[14px] font-bold tracking-[-0.02em] text-ink">
                Riwayat · {machine.id}
              </h2>
            </div>
            <Link href="/maintenance">
              <Button variant="secondary" size="sm" className="h-8">
                <Wrench className="size-3" /> Kelola log
              </Button>
            </Link>
          </div>
          {machineLogs.length ? (
            <div className="divide-y divide-line/70">
              {machineLogs.map((log) => (
                <div key={log.id} className="flex flex-col gap-2 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-line bg-surface-2 text-teal">
                      <Wrench className="size-3.5" />
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-semibold text-ink">{log.title}</span>
                        <StatusBadge status={log.status} />
                      </div>
                      <p className="mt-1 max-w-2xl text-[10.5px] leading-relaxed text-ink-muted">
                        {log.notes}
                      </p>
                      <p className="mt-1 font-mono text-[8.5px] text-ink-muted">
                        {log.id} · {log.technician} · {formatDate(log.date)}
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 font-mono text-[8.5px] text-ink-muted">
                    {log.type}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Belum ada log perawatan"
              description="Tambahkan catatan perawatan dari halaman Maintenance Log."
              action={
                <Link href="/maintenance">
                  <Button variant="secondary" size="sm">
                    <Wrench className="size-3" /> Buka maintenance
                  </Button>
                </Link>
              }
              className="border-0"
            />
          )}
        </section>
      ) : null}
    </div>
  );
}
