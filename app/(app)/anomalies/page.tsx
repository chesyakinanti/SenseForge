"use client";

import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence } from "motion/react";
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Filter,
  RefreshCw,
  Search,
  ShieldAlert,
  Siren,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { PageSkeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Drawer } from "@/components/ui/overlay";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { ScoreBar } from "@/components/charts/score-bar";
import { DemoNotice } from "@/components/domain/demo-notice";
import { api } from "@/lib/api";
import { useAsyncData } from "@/lib/hooks";
import {
  type Anomaly,
  type AnomalyStatus,
  type Severity,
  SENSORS,
  SENSOR_MAP,
  sensorStatus,
} from "@/lib/types";
import {
  cn,
  formatDateTime,
  formatDecimal,
  formatFullDateTime,
} from "@/lib/utils";

const severityTone = {
  critical: "red",
  warning: "amber",
  info: "teal",
} as const;

const severityLabel = {
  critical: "Kritis",
  warning: "Peringatan",
  info: "Info",
};

function AnomaliesContent() {
  const searchParams = useSearchParams();
  const { data: anomalies, loading, error, reload } = useAsyncData(() => api.getAnomalies(), []);
  const { data: machines } = useAsyncData(() => api.getMachines(), []);
  const { push } = useToast();
  const [query, setQuery] = useState("");
  const [severity, setSeverity] = useState<Severity | "all">("all");
  const [status, setStatus] = useState<AnomalyStatus | "all">("all");
  const [machineFilter, setMachineFilter] = useState(
    searchParams.get("machine") ?? "all",
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [overrides, setOverrides] = useState<Record<string, AnomalyStatus>>({});

  const enriched = useMemo(
    () =>
      (anomalies ?? []).map((anomaly) => ({
        ...anomaly,
        status: overrides[anomaly.id] ?? anomaly.status,
      })),
    [anomalies, overrides],
  );

  const filtered = useMemo(() => {
    let list = enriched;
    if (severity !== "all") list = list.filter((a) => a.severity === severity);
    if (status !== "all") list = list.filter((a) => a.status === status);
    if (machineFilter !== "all") {
      list = list.filter((a) => a.machineId === machineFilter);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((anomaly) => {
        const machine = machines?.find((item) => item.id === anomaly.machineId);
        return (
          anomaly.id.toLowerCase().includes(q) ||
          anomaly.note.toLowerCase().includes(q) ||
          anomaly.machineId.toLowerCase().includes(q) ||
          anomaly.parameter.toLowerCase().includes(q) ||
          (machine?.name.toLowerCase().includes(q) ?? false)
        );
      });
    }
    return list;
  }, [enriched, severity, status, machineFilter, query, machines]);

  const selected = enriched.find((anomaly) => anomaly.id === selectedId) ?? null;
  const selectedMachine = selected
    ? machines?.find((machine) => machine.id === selected.machineId)
    : null;

  if (loading && !anomalies) return <PageSkeleton />;

  if (error) {
    return (
      <div className="space-y-5">
        <PageHeader
          eyebrow="Model findings"
          title="Anomaly Detection"
          description="Gagal memuat temuan anomali dari backend FastAPI."
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

  const stats = {
    total: enriched.length,
    critical: enriched.filter((a) => a.severity === "critical").length,
    warning: enriched.filter((a) => a.severity === "warning").length,
    open: enriched.filter((a) => a.status === "open").length,
    average:
      enriched.reduce((sum, anomaly) => sum + anomaly.score, 0) /
      Math.max(1, enriched.length),
  };

  const updateStatus = (anomaly: Anomaly, next: AnomalyStatus) => {
    setOverrides((current) => ({ ...current, [anomaly.id]: next }));
    push({
      tone: next === "resolved" ? "success" : "info",
      title:
        next === "resolved"
          ? "Temuan ditandai selesai"
          : next === "reviewing"
            ? "Temuan masuk peninjauan"
            : "Temuan dibuka kembali",
      description: `${anomaly.id} · status diperbarui pada sesi kerja.`,
    });
  };

  const nextStatus = (current: AnomalyStatus): AnomalyStatus =>
    current === "open" ? "reviewing" : current === "reviewing" ? "resolved" : "open";

  const nextLabel = (current: AnomalyStatus) =>
    current === "open"
      ? "Tandai ditinjau"
      : current === "reviewing"
        ? "Tandai selesai"
        : "Buka kembali";

  const resetFilters = () => {
    setQuery("");
    setSeverity("all");
    setStatus("all");
    setMachineFilter("all");
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Model findings"
        title="Anomaly Detection"
        description="Tinjau rekaman anomali dari koleksi MongoDB sensor_data dan model RandomForest FastAPI."
        actions={
          <Link href="/processing">
            <Button variant="secondary" size="sm" className="h-9">
              <ShieldAlert className="size-3.5" /> Lihat pipeline
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-4">
        {[
          { label: "Total temuan", value: stats.total, tone: "text-ink", icon: ShieldAlert },
          { label: "Kritis", value: stats.critical, tone: "text-red-500", icon: Siren },
          { label: "Peringatan", value: stats.warning, tone: "text-amber-500", icon: AlertTriangle },
          { label: "Skor rata-rata", value: stats.average.toFixed(2), tone: "text-teal", icon: CheckCircle2 },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="panel flex items-center justify-between px-3.5 py-3">
              <div>
                <p className="text-[10px] text-ink-muted">{item.label}</p>
                <p className={cn("data-value mt-1 text-[20px] font-semibold", item.tone)}>
                  {item.value}
                </p>
              </div>
              <span className="flex size-8 items-center justify-center rounded-lg border border-line bg-surface-2/50 text-ink-muted">
                <Icon className="size-3.5" />
              </span>
            </div>
          );
        })}
      </div>

      <div className="panel flex flex-col gap-2.5 p-3 lg:flex-row lg:items-center">
        <div className="relative w-full lg:max-w-[240px]">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-ink-muted" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari ID (R001331), mesin, alert…"
            className="surface-input h-9 pl-9"
            aria-label="Cari anomali"
          />
        </div>
        <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-3">
          <Select
            value={severity}
            onChange={(event) => setSeverity(event.target.value as Severity | "all")}
            aria-label="Filter severity"
          >
            <option value="all">Semua severity</option>
            <option value="critical">Kritis</option>
            <option value="warning">Peringatan</option>
            <option value="info">Info</option>
          </Select>
          <Select
            value={machineFilter}
            onChange={(event) => setMachineFilter(event.target.value)}
            aria-label="Filter mesin"
          >
            <option value="all">Semua mesin</option>
            {(machines ?? []).map((machine) => (
              <option key={machine.id} value={machine.id}>
                {machine.id} · {machine.name}
              </option>
            ))}
          </Select>
          <Select
            value={status}
            onChange={(event) => setStatus(event.target.value as AnomalyStatus | "all")}
            aria-label="Filter status"
          >
            <option value="all">Semua status</option>
            <option value="open">Terbuka</option>
            <option value="reviewing">Ditinjau</option>
            <option value="resolved">Selesai</option>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[9px] text-ink-muted">{filtered.length} hasil</span>
          <Button variant="ghost" size="sm" onClick={resetFilters} className="h-9">
            <Filter className="size-3" /> Reset
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Tidak ada anomali yang cocok"
          description="Ubah kata kunci atau filter untuk menampilkan temuan lain."
          action={
            <Button variant="secondary" size="sm" onClick={resetFilters}>
              Reset filter
            </Button>
          }
        />
      ) : (
        <div className="panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left">
              <thead>
                <tr className="border-b border-line bg-surface-2/35">
                  {["Anomali", "Mesin", "Parameter", "Waktu", "Skor", "Status", ""].map(
                    (header) => (
                      <th
                        key={header}
                        className="px-4 py-2.5 font-mono text-[8px] font-medium tracking-[0.14em] text-ink-muted uppercase"
                      >
                        {header}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-line/70">
                {filtered.map((anomaly) => {
                  const machine = machines?.find((item) => item.id === anomaly.machineId);
                  const sensor = SENSOR_MAP[anomaly.parameter];
                  return (
                    <tr
                      key={anomaly.id}
                      tabIndex={0}
                      onClick={() => setSelectedId(anomaly.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") setSelectedId(anomaly.id);
                      }}
                      className="table-row group cursor-pointer"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "flex size-7 items-center justify-center rounded-lg border",
                              anomaly.severity === "critical"
                                ? "border-red-500/25 bg-red-500/10 text-red-500"
                                : anomaly.severity === "warning"
                                  ? "border-amber-500/25 bg-amber-500/10 text-amber-500"
                                  : "border-teal/25 bg-teal/10 text-teal",
                            )}
                          >
                            <ShieldAlert className="size-3.5" />
                          </span>
                          <div>
                            <span className="font-mono text-[9.5px] font-medium text-ink">
                              {anomaly.id}
                            </span>
                            <div className="mt-0.5">
                              <Badge tone={severityTone[anomaly.severity]} dot>
                                {severityLabel[anomaly.severity]}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="block text-[11px] font-medium text-ink">
                          {machine?.name ?? anomaly.machineId}
                        </span>
                        <span className="font-mono text-[8.5px] text-ink-muted">
                          {anomaly.machineId}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1.5 text-[10px] text-ink-soft">
                          <span
                            className="size-1.5 rounded-full"
                            style={{ backgroundColor: sensor.color }}
                          />
                          {sensor.label}
                        </span>
                        <span className="data-value mt-0.5 block text-[10.5px] text-ink">
                          {formatDecimal(anomaly.sensors[anomaly.parameter], sensor.decimals)}
                          <span className="ml-1 text-[8.5px] text-ink-muted">{sensor.unit}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-[9.5px] text-ink-soft">
                        {formatDateTime(anomaly.timestamp)}
                      </td>
                      <td className="px-4 py-3">
                        <ScoreBar value={anomaly.score} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={anomaly.status} />
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex size-7 items-center justify-center rounded-lg text-ink-muted transition group-hover:text-teal">
                          <ArrowUpRight className="size-3.5" />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-line px-4 py-2.5 font-mono text-[9px] text-ink-muted">
            <span>{filtered.length} temuan ditampilkan</span>
            <span>Klik baris untuk membuka detail</span>
          </div>
        </div>
      )}

      <DemoNotice>
        Temuan anomali diambil dari koleksi MongoDB <span className="font-mono">sensor_data</span> (
        <span className="font-mono">is_anomaly=1</span>) beserta skor prioritas perawatan dan kode alert.
      </DemoNotice>

      <Drawer
        open={Boolean(selected)}
        onClose={() => setSelectedId(null)}
        title={selected?.id ?? "Detail anomali"}
        eyebrow="Anomaly detail"
        footer={
          selected ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <Button
                variant="primary"
                size="sm"
                onClick={() => updateStatus(selected, nextStatus(selected.status))}
              >
                <CheckCircle2 className="size-3.5" />
                {nextLabel(selected.status)}
              </Button>
              {selectedMachine ? (
                <Link
                  href={`/machines/${selectedMachine.id}`}
                  className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-line px-3 text-[11px] font-semibold text-ink-soft transition hover:border-teal/40 hover:text-teal"
                >
                  Buka mesin <ArrowUpRight className="size-3" />
                </Link>
              ) : null}
            </div>
          ) : null
        }
      >
        <AnimatePresence mode="wait">
          {selected ? (
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-3 rounded-xl border border-line bg-surface-2/35 p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge tone={severityTone[selected.severity]} dot pulse={selected.severity === "critical"}>
                      {severityLabel[selected.severity]}
                    </Badge>
                    <StatusBadge status={selected.status} />
                  </div>
                  <p className="data-value mt-2 text-[30px] leading-none font-semibold text-ink">
                    {selected.score.toFixed(2)}
                  </p>
                  <p className="mt-1 font-mono text-[8.5px] tracking-[0.12em] text-ink-muted uppercase">
                    anomaly score
                  </p>
                </div>
                <div className="text-right">
                  <p className="mono-label">Model</p>
                  <p className="mt-1 text-[10.5px] font-medium text-ink-soft">{selected.model}</p>
                  <p className="mt-1 font-mono text-[8.5px] text-ink-muted">
                    {formatDateTime(selected.timestamp)} WIB
                  </p>
                </div>
              </div>

              <div>
                <p className="mono-label">Mesin terkait</p>
                <Link
                  href={`/machines/${selected.machineId}`}
                  className="mt-2 flex items-center justify-between rounded-xl border border-line bg-surface-2/30 p-3 transition hover:border-teal/30"
                >
                  <div>
                    <p className="text-[12px] font-semibold text-ink">
                      {selectedMachine?.name ?? selected.machineId}
                    </p>
                    <p className="mt-0.5 font-mono text-[8.5px] text-ink-muted">
                      {selected.machineId} · {selectedMachine?.line} · {selectedMachine?.location}
                    </p>
                  </div>
                  <ArrowUpRight className="size-4 text-teal" />
                </Link>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <p className="mono-label">Nilai sensor</p>
                  <span className="font-mono text-[8.5px] text-ink-muted">nilai vs baseline</span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {SENSORS.map((sensor) => {
                    const value = selected.sensors[sensor.key];
                    const baseline = selectedMachine?.base[sensor.key] ?? value;
                    const status = sensorStatus(sensor.key, value);
                    const delta = baseline === 0 ? 0 : ((value - baseline) / baseline) * 100;
                    return (
                      <div key={sensor.key} className="rounded-xl border border-line bg-surface-2/25 p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[9.5px] text-ink-muted">{sensor.label}</span>
                          <span className="size-1.5 rounded-full" style={{ backgroundColor: sensor.color }} />
                        </div>
                        <p className="data-value mt-1.5 text-[17px] font-semibold text-ink">
                          {formatDecimal(value, sensor.decimals)}
                          <span className="ml-1 font-mono text-[8px] font-normal text-ink-muted">
                            {sensor.unit}
                          </span>
                        </p>
                        <div className="mt-1 flex items-center justify-between">
                          <Badge
                            tone={status === "normal" ? "green" : status === "warning" ? "amber" : "red"}
                            className="px-1.5 py-0.5 text-[8px]"
                          >
                            {status === "normal" ? "Normal" : status === "warning" ? "Perhatian" : "Kritis"}
                          </Badge>
                          <span
                            className={cn(
                              "font-mono text-[8.5px]",
                              delta >= 0 ? "text-amber-500" : "text-emerald-500",
                            )}
                          >
                            {delta >= 0 ? "+" : ""}
                            {delta.toFixed(0)}%
                          </span>
                        </div>
                        <p className="mt-1 font-mono text-[8px] text-ink-muted">
                          baseline {formatDecimal(baseline, sensor.decimals)} {sensor.unit}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="mono-label">Catatan telemetri</p>
                <p className="mt-2 text-[11.5px] leading-relaxed text-ink-soft">
                  {selected.note}
                </p>
              </div>

              <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.06] p-3">
                <div className="flex items-center gap-2">
                  <Clock3 className="size-3.5 text-amber-500" />
                  <p className="text-[10.5px] font-semibold text-ink">Tindak lanjut perawatan</p>
                </div>
                <p className="mt-1 text-[10px] leading-relaxed text-ink-muted">
                  Gunakan halaman Maintenance Log atau Backend API untuk memverifikasi prediksi model terhadap fitur sensor terkait.
                </p>
              </div>

              <div className="flex items-center justify-between font-mono text-[8px] text-ink-muted">
                <span>Waktu rekaman {formatFullDateTime(selected.timestamp)}</span>
                <span>MongoDB sensor_data</span>
              </div>
            </div>
          ) : null}
        </AnimatePresence>
      </Drawer>
    </div>
  );
}

export default function AnomaliesPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <AnomaliesContent />
    </Suspense>
  );
}
