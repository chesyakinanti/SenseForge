"use client";

import { useState } from "react";
import { motion } from "motion/react";
import {
  CheckCircle2,
  Cpu,
  Database,
  Gauge,
  HardDrive,
  Loader2,
  RefreshCw,
  Rows3,
  Timer,
  TriangleAlert,
  Zap,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { PageSkeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { PipelineStepper } from "@/components/domain/pipeline-stepper";
import { BenchmarkChart } from "@/components/charts/benchmark-chart";
import { DemoNotice } from "@/components/domain/demo-notice";
import { api } from "@/lib/api";
import { useAsyncData } from "@/lib/hooks";
import { cn, formatFullDateTime, formatNumber } from "@/lib/utils";

export default function ProcessingPage() {
  const { data, loading, error, reload } = useAsyncData(() => api.getProcessing(), []);
  const { push } = useToast();
  const [refreshing, setRefreshing] = useState(false);

  const runLiveSync = async () => {
    setRefreshing(true);
    try {
      api.clearCache();
      reload();
      push({
        tone: "success",
        title: "Data pipeline & evaluasi diperbarui",
        description: "Ringkasan dataset, agregasi MongoDB, dan evaluasi model dimuat langsung dari FastAPI.",
      });
    } finally {
      setRefreshing(false);
    }
  };

  if (loading && !data) return <PageSkeleton />;

  if (error || !data) {
    return (
      <div className="space-y-5">
        <PageHeader
          eyebrow="Big data pipeline"
          title="Processing & Benchmark"
          description="Gagal memuat data pipeline dan evaluasi model dari backend FastAPI."
        />
        <EmptyState
          title="Backend tidak dapat dijangkau"
          description={error ?? "Pastikan backend FastAPI berjalan dan terhubung ke MongoDB."}
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

  const maxRecords = Math.max(...data.benchmarks.map((b) => b.records), 0);

  const quality = [
    {
      label: "Missing value",
      value: data.quality.missing,
      display: `${data.quality.missing}% (${formatNumber(data.details.totalMissing)} sel)`,
      tone: "amber" as const,
      icon: TriangleAlert,
    },
    {
      label: "Duplikat dihapus",
      value: data.quality.duplicates,
      display: `${data.quality.duplicates}%`,
      tone: "steel" as const,
      icon: Rows3,
    },
    {
      label: "Baris invalid",
      value: data.quality.invalid,
      display: `${data.quality.invalid}%`,
      tone: "steel" as const,
      icon: HardDrive,
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Big data pipeline"
        title="Processing & Benchmark"
        description="Status pipeline telemetri, kualitas dataset, benchmark agregasi MongoDB, dan evaluasi model RandomForest."
        actions={
          <>
            <Badge tone="green" dot pulse>
              FastAPI · MongoDB
            </Badge>
            <Button
              variant="primary"
              size="sm"
              className="h-9"
              onClick={() => void runLiveSync()}
              disabled={refreshing || loading}
            >
              {refreshing || loading ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" /> Memuat…
                </>
              ) : (
                <>
                  <RefreshCw className="size-3.5" /> Muat ulang metrik
                </>
              )}
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-4">
        {[
          { label: "Latensi p95", value: data.summary.ingestion, icon: Database, tone: "text-teal" },
          { label: "Latensi query p50", value: data.summary.query, icon: Timer, tone: "text-amber-500" },
          { label: "Throughput puncak", value: data.summary.throughput, icon: Zap, tone: "text-violet-400" },
          { label: "Dataset aktif", value: data.summary.dataset, icon: HardDrive, tone: "text-ink" },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="panel p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-ink-muted">{item.label}</span>
                <Icon className={cn("size-3.5", item.tone)} />
              </div>
              <p className={cn("data-value mt-1.5 text-[17px] font-semibold", item.tone)}>
                {item.value}
              </p>
            </div>
          );
        })}
      </div>

      <section className="panel overflow-hidden">
        <div className="flex flex-col gap-2 border-b border-line px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mono-label text-teal/90">Processing pipeline</div>
            <h2 className="mt-1 text-[14px] font-bold tracking-[-0.02em] text-ink">
              Dataset → MongoDB → FastAPI → Dashboard
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[9px] text-ink-muted">
              Laporan benchmark: {formatFullDateTime(data.summary.lastRun)}
            </span>
            <Badge tone="green" dot>Semua tahap aktif</Badge>
          </div>
        </div>
        <div className="p-4">
          <PipelineStepper stages={data.pipeline} />
          <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
            <div className="flex items-center justify-between rounded-xl border border-line bg-surface-2/30 px-3 py-2.5">
              <span className="flex items-center gap-1.5 text-[10px] text-ink-muted">
                <CheckCircle2 className="size-3 text-emerald-500" /> Rekaman bersih
              </span>
              <span className="data-value text-[11px] font-semibold text-emerald-500">
                {formatNumber(data.details.validRecords)}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-line bg-surface-2/30 px-3 py-2.5">
              <span className="flex items-center gap-1.5 text-[10px] text-ink-muted">
                <Rows3 className="size-3 text-teal" /> Grup agregasi ({data.details.collection})
              </span>
              <span className="data-value text-[11px] font-semibold text-ink">
                {formatNumber(data.details.aggregationGroups)}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-line bg-surface-2/30 px-3 py-2.5">
              <span className="flex items-center gap-1.5 text-[10px] text-ink-muted">
                <Cpu className="size-3 text-amber-500" /> Total anomali dataset
              </span>
              <span className="data-value text-[11px] font-semibold text-amber-500">
                {formatNumber(data.details.anomalyCount)}
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-3">
        <section className="panel min-w-0 p-4 xl:col-span-2">
          <BenchmarkChart rows={data.benchmarks} />
          <div className="mt-4 border-t border-line pt-3">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left">
                <thead>
                  <tr className="border-b border-line">
                    {[
                      "Sampel",
                      "Dokumen",
                      "Latency p95",
                      "Latency p50",
                      "Waktu Proses",
                      "Throughput",
                    ].map((header) => (
                      <th
                        key={header}
                        className="pb-2 font-mono text-[8px] font-medium tracking-[0.12em] text-ink-muted uppercase"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60">
                  {data.benchmarks.map((row) => (
                    <tr
                      key={row.dataset}
                      className={cn("table-row", row.records === maxRecords && "bg-teal/[0.035]")}
                    >
                      <td className="py-2.5 text-[10.5px] font-semibold text-ink">
                        {row.dataset}
                        {row.records === maxRecords ? (
                          <span className="ml-1.5 font-mono text-[7.5px] text-teal">PENUH</span>
                        ) : null}
                      </td>
                      <td className="data-value py-2.5 text-[10px] text-ink-soft">
                        {formatNumber(row.records)}
                      </td>
                      <td className="data-value py-2.5 text-[10px] text-ink-soft">
                        {row.ingestion} dtk
                      </td>
                      <td className="data-value py-2.5 text-[10px] text-ink-soft">
                        {row.query} ms
                      </td>
                      <td className="data-value py-2.5 text-[10px] text-ink-soft">
                        {row.processing} dtk
                      </td>
                      <td className="data-value py-2.5 text-[10px] text-ink-soft">
                        {formatNumber(row.throughput)} dok/dtk
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="mt-3 rounded-xl border border-line bg-surface-2/25 px-3 py-2 font-mono text-[9px] text-ink-muted">
            Tahap agregasi MongoDB ({data.details.database}.{data.details.collection}):{" "}
            {data.details.pipelineStages.join(" → ")}
          </div>
        </section>

        <section className="panel flex min-w-0 flex-col overflow-hidden">
          <div className="border-b border-line px-4 py-3.5">
            <div className="mono-label">Data quality & ML evaluation</div>
            <h2 className="mt-1 text-[14px] font-bold tracking-[-0.02em] text-ink">
              Kualitas dataset & evaluasi model
            </h2>
          </div>
          <div className="p-4">
            <div className="flex items-end justify-between">
              <div>
                <p className="mono-label">Completeness</p>
                <p className="data-value mt-1 text-[30px] font-semibold text-teal">
                  {data.quality.completeness}%
                </p>
              </div>
              <Badge tone="green" dot>Terverifikasi</Badge>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
              <motion.div
                className="h-full rounded-full bg-teal"
                initial={{ width: 0 }}
                animate={{ width: `${data.quality.completeness}%` }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>

            <div className="mt-5 space-y-3">
              {quality.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-[10px] text-ink-muted">
                        <Icon
                          className={cn(
                            "size-3",
                            item.tone === "amber" ? "text-amber-500" : "text-ink-muted",
                          )}
                        />
                        {item.label}
                      </span>
                      <span className="data-value text-[10px] text-ink-soft">{item.display}</span>
                    </div>
                    <div className="h-1 overflow-hidden rounded-full bg-surface-2">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          item.tone === "amber" ? "bg-amber-500" : "bg-ink-muted/60",
                        )}
                        style={{ width: `${Math.min(100, Math.max(2, item.value * 12))}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 rounded-xl border border-line bg-surface-2/30 p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Gauge className="size-3.5 text-teal" />
                  <p className="text-[10.5px] font-semibold text-ink">
                    RandomForest · Holdout Kronologis
                  </p>
                </div>
                <span className="font-mono text-[8.5px] text-teal">
                  sklearn {data.details.scikitLearnVersion}
                </span>
              </div>
              <div className="mt-2.5 grid grid-cols-2 gap-2 text-[10px]">
                <div className="rounded-lg border border-line bg-surface/60 px-2.5 py-1.5">
                  <span className="text-ink-muted">Akurasi Test</span>
                  <p className="data-value mt-0.5 font-semibold text-ink">
                    {(data.details.metrics.accuracy * 100).toFixed(2)}%
                  </p>
                </div>
                <div className="rounded-lg border border-line bg-surface/60 px-2.5 py-1.5">
                  <span className="text-ink-muted">ROC-AUC</span>
                  <p className="data-value mt-0.5 font-semibold text-ink">
                    {data.details.metrics.roc_auc.toFixed(3)}
                  </p>
                </div>
                <div className="rounded-lg border border-line bg-surface/60 px-2.5 py-1.5">
                  <span className="text-ink-muted">Precision / Recall</span>
                  <p className="data-value mt-0.5 font-semibold text-ink">
                    {(data.details.metrics.precision_anomaly * 100).toFixed(1)}% /{" "}
                    {(data.details.metrics.recall_anomaly * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="rounded-lg border border-line bg-surface/60 px-2.5 py-1.5">
                  <span className="text-ink-muted">Akurasi Baseline</span>
                  <p className="data-value mt-0.5 font-semibold text-ink">
                    {(data.details.baselineAccuracy * 100).toFixed(2)}%
                  </p>
                </div>
              </div>
              <p className="mt-2 text-[9.5px] leading-relaxed text-ink-muted">
                Split: train {formatNumber(data.details.trainRows)} · val{" "}
                {formatNumber(data.details.validationRows)} · test{" "}
                {formatNumber(data.details.testRows)} baris. Fitur:{" "}
                <span className="font-mono">{data.details.featureColumns.join(", ")}</span>.
              </p>
            </div>
          </div>
          <div className="mt-auto border-t border-line p-3">
            <DemoNotice className="border-line bg-surface-2/35 text-[10px]">
              Seluruh metrik bersumber dari endpoint evaluasi FastAPI dan laporan benchmark agregasi MongoDB.
            </DemoNotice>
          </div>
        </section>
      </div>
    </div>
  );
}
