"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { PageSkeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Field } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { DemoNotice } from "@/components/domain/demo-notice";
import {
  API_BASE_URL,
  getBackendHealth,
  getDatasetSummary,
  getEquipmentAnalytics,
  getBaselineEvaluation,
  getMutiEvaluation,
  predictBaseline,
  predictMuti,
  importDataset,
  getPredictions,
  type BackendHealth,
  type DatasetSummary,
  type EquipmentAnalytics,
  type BaselineEvaluation,
  type MutiEvaluation,
  type PredictionResponse,
  type MutiPredictionResponse,
} from "@/lib/backend";
import { formatDecimal, formatNumber } from "@/lib/utils";

const FEATURE_FIELDS = [
  { key: "temperature_c", label: "Temperature (°C)", step: "0.1" },
  { key: "vibration_mm_s", label: "Vibration (mm/s)", step: "0.01" },
  { key: "pressure_kpa", label: "Pressure (kPa)", step: "0.1" },
  { key: "motor_rpm", label: "Motor RPM", step: "0.1" },
  { key: "flow_rate_lpm", label: "Flow rate (L/min)", step: "0.1" },
  { key: "power_consumption_kw", label: "Power (kW)", step: "0.1" },
  { key: "coolant_temp_c", label: "Coolant temp (°C)", step: "0.1" },
  { key: "acoustic_level_db", label: "Acoustic level (dB)", step: "0.1" },
  { key: "oil_viscosity_cst", label: "Oil viscosity (cSt)", step: "0.1" },
  { key: "humidity_pct", label: "Humidity (%)", step: "0.1" },
  { key: "ambient_temp_c", label: "Ambient temp (°C)", step: "0.1" },
  { key: "equipment_age_hours", label: "Equipment age (h)", step: "0.1" },
  { key: "hours_since_maintenance", label: "Hours since maintenance", step: "0.1" },
] as const;

const DEFAULT_FEATURES: Record<string, number> = {
  temperature_c: 60.1,
  vibration_mm_s: 0.19,
  pressure_kpa: 135.2,
  motor_rpm: 2111.3,
  flow_rate_lpm: 27.3,
  power_consumption_kw: 34.2,
  coolant_temp_c: 25.3,
  acoustic_level_db: 67.1,
  oil_viscosity_cst: 75.3,
  humidity_pct: 53.5,
  ambient_temp_c: 22.0,
  equipment_age_hours: 2240.6,
  hours_since_maintenance: 0,
};

export default function BackendPage() {
  const { push } = useToast();
  const [health, setHealth] = useState<BackendHealth | null>(null);
  const [summary, setSummary] = useState<DatasetSummary | null>(null);
  const [analytics, setAnalytics] = useState<EquipmentAnalytics | null>(null);
  const [baselineEvaluation, setBaselineEvaluation] = useState<BaselineEvaluation | null>(null);
  const [mutiEvaluation, setMutiEvaluation] = useState<MutiEvaluation | null>(null);
  const [predictionsCount, setPredictionsCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [features, setFeatures] = useState<Record<string, number>>(DEFAULT_FEATURES);
  const [readingId, setReadingId] = useState("R000000");
  const [equipmentId, setEquipmentId] = useState("EQ-001");
  const [predicting, setPredicting] = useState(false);
  const [baselineResult, setBaselineResult] = useState<PredictionResponse | null>(null);
  const [mutiResult, setMutiResult] = useState<MutiPredictionResponse | null>(null);
  const [importing, setImporting] = useState(false);

  async function loadBackendData() {
    setLoading(true);
    setError(null);
    try {
      const [healthResult, summaryResult, analyticsResult, baselineResult, mutiResult] =
        await Promise.allSettled([
          getBackendHealth(),
          getDatasetSummary(),
          getEquipmentAnalytics(1000),
          getBaselineEvaluation(),
          getMutiEvaluation(),
        ]);

      if (healthResult.status === "fulfilled") {
        setHealth(healthResult.value);
      } else {
        setError(healthResult.reason instanceof Error ? healthResult.reason.message : "Gagal terhubung ke backend FastAPI.");
      }

      if (summaryResult.status === "fulfilled") setSummary(summaryResult.value);
      if (analyticsResult.status === "fulfilled") setAnalytics(analyticsResult.value);
      if (baselineResult.status === "fulfilled") setBaselineEvaluation(baselineResult.value);
      if (mutiResult.status === "fulfilled") setMutiEvaluation(mutiResult.value);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal terhubung ke backend.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadBackendData();
  }, []);

  async function handlePredict() {
    setPredicting(true);
    setBaselineResult(null);
    setMutiResult(null);
    try {
      const request = {
        features,
        reading_id: readingId,
        equipment_id: equipmentId,
        timestamp: new Date().toISOString(),
        save_to_database: false,
      };
      const [baseline, muti] = await Promise.all([
        predictBaseline(request),
        predictMuti(request),
      ]);
      setBaselineResult(baseline);
      setMutiResult(muti);
      push({
        tone: "success",
        title: "Prediksi selesai",
        description: "Hasil dari backend FastAPI ditampilkan di bawah.",
      });
    } catch (err) {
      push({
        tone: "danger",
        title: "Prediksi gagal",
        description: err instanceof Error ? err.message : "Backend tidak merespons.",
      });
    } finally {
      setPredicting(false);
    }
  }

  async function handleImportDataset() {
    setImporting(true);
    try {
      const result = await importDataset();
      push({
        tone: "success",
        title: "Dataset diimpor",
        description: `${formatNumber(result.processed)} baris diproses ke ${result.collection}.`,
      });
      await loadBackendData();
    } catch (err) {
      push({
        tone: "danger",
        title: "Impor gagal",
        description: err instanceof Error ? err.message : "Backend tidak merespons.",
      });
    } finally {
      setImporting(false);
    }
  }

  async function handleLoadPredictions() {
    try {
      const result = await getPredictions(20);
      setPredictionsCount(result.count);
      push({
        tone: "info",
        title: "Riwayat prediksi dimuat",
        description: `${result.count} prediksi tersimpan di MongoDB.`,
      });
    } catch (err) {
      push({
        tone: "danger",
        title: "Gagal memuat riwayat",
        description: err instanceof Error ? err.message : "Backend tidak merespons.",
      });
    }
  }

  if (loading && !health) return <PageSkeleton />;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Backend integration"
        title="Backend API"
        description="Status koneksi, dataset, analytics MongoDB, evaluasi model, dan prediksi FastAPI."
        actions={
          <>
            <Badge tone={health?.status === "ok" ? "green" : "amber"} dot pulse={health?.status === "ok"}>
              {health?.status === "ok" ? "Backend terhubung" : "Backend belum terhubung"}
            </Badge>
            <Button variant="secondary" size="sm" onClick={() => void loadBackendData()} className="h-9">
              Sinkronisasi
            </Button>
          </>
        }
      />

      <DemoNotice>
        Halaman ini memanggil backend FastAPI secara langsung. Pastikan backend berjalan di{" "}
        <span className="font-mono">{API_BASE_URL}</span>.
      </DemoNotice>

      {error ? (
        <EmptyState
          title="Backend tidak dapat dijangkau"
          description={error}
          action={
            <Button variant="secondary" size="sm" onClick={() => void loadBackendData()}>
              Coba lagi
            </Button>
          }
        />
      ) : null}

      <div className="grid gap-4 xl:grid-cols-3">
        <section className="panel p-4">
          <div className="mono-label text-teal/90">Health</div>
          <h2 className="mt-1 text-[14px] font-bold tracking-[-0.02em] text-ink">Status API</h2>
          <div className="mt-4 space-y-2.5">
            <div className="flex items-center justify-between rounded-xl border border-line bg-surface-2/30 px-3 py-2.5">
              <span className="text-[10.5px] text-ink-muted">Status</span>
              <Badge tone={health?.status === "ok" ? "green" : "amber"}>{health?.status ?? "unknown"}</Badge>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-line bg-surface-2/30 px-3 py-2.5">
              <span className="text-[10.5px] text-ink-muted">Model baseline</span>
              <span className="font-mono text-[10.5px] text-ink">{health?.model ?? "-"}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-line bg-surface-2/30 px-3 py-2.5">
              <span className="text-[10.5px] text-ink-muted">SF Anomaly Detector</span>
              <Badge tone={health?.muti_model_available ? "green" : "amber"}>
                {health?.muti_model_available ? "tersedia" : "belum tersedia"}
              </Badge>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-line bg-surface-2/30 px-3 py-2.5">
              <span className="text-[10.5px] text-ink-muted">MongoDB</span>
              <Badge tone={health?.database_configured ? "green" : "amber"}>
                {health?.database_configured ? "terkonfigurasi" : "belum terkonfigurasi"}
              </Badge>
            </div>
            <div className="rounded-xl border border-line bg-surface-2/30 px-3 py-2.5">
              <p className="mono-label">Fitur model</p>
              <p className="mt-1 font-mono text-[9px] leading-relaxed text-ink-soft">
                {health?.features.join(", ") ?? "-"}
              </p>
            </div>
          </div>
        </section>

        <section className="panel p-4 xl:col-span-2">
          <div className="mono-label text-teal/90">Dataset</div>
          <h2 className="mt-1 text-[14px] font-bold tracking-[-0.02em] text-ink">Ringkasan data.csv</h2>
          {summary ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-line bg-surface-2/30 px-3 py-3">
                <p className="mono-label">Baris</p>
                <p className="data-value mt-1 text-[20px] font-semibold text-ink">{formatNumber(summary.rows)}</p>
              </div>
              <div className="rounded-xl border border-line bg-surface-2/30 px-3 py-3">
                <p className="mono-label">Kolom</p>
                <p className="data-value mt-1 text-[20px] font-semibold text-ink">{summary.columns}</p>
              </div>
              <div className="rounded-xl border border-line bg-surface-2/30 px-3 py-3">
                <p className="mono-label">Anomali</p>
                <p className="data-value mt-1 text-[20px] font-semibold text-red-500">
                  {formatNumber(summary.anomaly_distribution["1"] ?? 0)}
                </p>
              </div>
              <div className="sm:col-span-3 rounded-xl border border-line bg-surface-2/30 px-3 py-3">
                <p className="mono-label">Distribusi target</p>
                <p className="mt-1 text-[11px] text-ink-soft">
                  Normal: {formatNumber(summary.anomaly_distribution["0"] ?? 0)} · Anomali:{" "}
                  {formatNumber(summary.anomaly_distribution["1"] ?? 0)}
                </p>
                <p className="mt-2 font-mono text-[9px] text-ink-muted">
                  Missing values:{" "}
                  {Object.entries(summary.missing_values)
                    .filter(([, value]) => value > 0)
                    .map(([key, value]) => `${key}: ${value}`)
                    .join(", ") || "tidak ada"}
                </p>
              </div>
            </div>
          ) : (
            <EmptyState title="Dataset belum tersedia" description="Backend tidak mengembalikan ringkasan dataset." />
          )}
        </section>
      </div>

      <section className="panel overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-line px-4 py-3.5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mono-label text-teal/90">MongoDB analytics</div>
            <h2 className="mt-1 text-[14px] font-bold tracking-[-0.02em] text-ink">Aggregation per equipment</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => void handleImportDataset()} disabled={importing} className="h-9">
              {importing ? "Mengimpor..." : "Impor dataset"}
            </Button>
            <span className="font-mono text-[9px] text-ink-muted">Impor 50.000 baris dapat memakan waktu beberapa menit.</span>
            <Button variant="ghost" size="sm" onClick={() => void handleLoadPredictions()} className="h-9">
              Muat riwayat prediksi
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead>
              <tr className="border-b border-line bg-surface-2/35">
                {["Equipment", "Mode", "Readings", "Anomalies", "Anomaly rate", "Avg temp", "Avg vibration"].map((header) => (
                  <th key={header} className="px-4 py-3 font-mono text-[9px] tracking-[0.12em] text-ink-muted uppercase">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(analytics?.groups ?? []).map((group, index) => (
                <tr key={`${group._id.equipment_id}-${group._id.operating_mode}-${index}`} className="table-row">
                  <td className="px-4 py-3 text-[11.5px] font-semibold text-ink">{group._id.equipment_id}</td>
                  <td className="px-4 py-3 text-[11px] text-ink-soft">{group._id.operating_mode}</td>
                  <td className="px-4 py-3 font-mono text-[11px] text-ink">{formatNumber(group.readings)}</td>
                  <td className="px-4 py-3 font-mono text-[11px] text-red-500">{formatNumber(group.anomalies)}</td>
                  <td className="px-4 py-3 font-mono text-[11px] text-ink-soft">
                    {(group.anomaly_rate * 100).toFixed(1)}%
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-ink-soft">
                    {formatDecimal(group.average_temperature_c)}°C
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-ink-soft">
                    {formatDecimal(group.average_vibration_mm_s)} mm/s
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {analytics ? (
          <div className="border-t border-line px-4 py-3 font-mono text-[9px] text-ink-muted">
            {formatNumber(analytics.documents_aggregated)} dari {formatNumber(analytics.total_documents_available)} dokumen ·{" "}
            {analytics.groups.length} grup
            {predictionsCount !== null ? ` · ${predictionsCount} prediksi tersimpan` : ""}
          </div>
        ) : null}
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="panel p-4">
          <div className="mono-label text-teal/90">Baseline model</div>
          <h2 className="mt-1 text-[14px] font-bold tracking-[-0.02em] text-ink">Evaluasi RandomForest</h2>
          {baselineEvaluation ? (
            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-line bg-surface-2/30 px-3 py-3">
                  <p className="mono-label">Accuracy</p>
                  <p className="data-value mt-1 text-[20px] font-semibold text-ink">
                    {(baselineEvaluation.accuracy * 100).toFixed(2)}%
                  </p>
                </div>
                <div className="rounded-xl border border-line bg-surface-2/30 px-3 py-3">
                  <p className="mono-label">Rows</p>
                  <p className="data-value mt-1 text-[20px] font-semibold text-ink">
                    {formatNumber(baselineEvaluation.rows_evaluated)}
                  </p>
                </div>
              </div>
              <div className="rounded-xl border border-line bg-surface-2/30 px-3 py-3">
                <p className="mono-label">Confusion matrix</p>
                <p className="mt-1 font-mono text-[10px] text-ink-soft">
                  {baselineEvaluation.confusion_matrix.map((row) => `[${row.join(", ")}]`).join(" ")}
                </p>
              </div>
              <p className="text-[10.5px] leading-relaxed text-ink-muted">{baselineEvaluation.note}</p>
            </div>
          ) : (
            <EmptyState title="Evaluasi belum tersedia" description="Backend tidak mengembalikan evaluasi model baseline." />
          )}
        </section>

        <section className="panel p-4">
          <div className="mono-label text-teal/90">SF Anomaly Detector</div>
          <h2 className="mt-1 text-[14px] font-bold tracking-[-0.02em] text-ink">Holdout kronologis</h2>
          {mutiEvaluation ? (
            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-line bg-surface-2/30 px-3 py-3">
                  <p className="mono-label">Accuracy</p>
                  <p className="data-value mt-1 text-[20px] font-semibold text-ink">
                    {(mutiEvaluation.metrics.accuracy * 100).toFixed(2)}%
                  </p>
                </div>
                <div className="rounded-xl border border-line bg-surface-2/30 px-3 py-3">
                  <p className="mono-label">ROC-AUC</p>
                  <p className="data-value mt-1 text-[20px] font-semibold text-ink">
                    {mutiEvaluation.metrics.roc_auc.toFixed(3)}
                  </p>
                </div>
                <div className="rounded-xl border border-line bg-surface-2/30 px-3 py-3">
                  <p className="mono-label">Precision anomaly</p>
                  <p className="data-value mt-1 text-[20px] font-semibold text-ink">
                    {(mutiEvaluation.metrics.precision_anomaly * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="rounded-xl border border-line bg-surface-2/30 px-3 py-3">
                  <p className="mono-label">Recall anomaly</p>
                  <p className="data-value mt-1 text-[20px] font-semibold text-ink">
                    {(mutiEvaluation.metrics.recall_anomaly * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
              <div className="rounded-xl border border-line bg-surface-2/30 px-3 py-3">
                <p className="mono-label">Threshold</p>
                <p className="mt-1 font-mono text-[10.5px] text-ink-soft">
                  {mutiEvaluation.decision_threshold.toFixed(4)} · fitur:{" "}
                  {mutiEvaluation.feature_columns.join(", ")}
                </p>
              </div>
              <p className="text-[10.5px] leading-relaxed text-ink-muted">
                Train {formatNumber(mutiEvaluation.train_rows)} · validation{" "}
                {formatNumber(mutiEvaluation.validation_rows)} · test{" "}
                {formatNumber(mutiEvaluation.test_rows)}
              </p>
            </div>
          ) : (
            <EmptyState title="Evaluasi belum tersedia" description="Backend tidak mengembalikan evaluasi SF Anomaly Detector." />
          )}
        </section>
      </div>

      <section className="panel p-4">
        <div className="mono-label text-teal/90">Prediksi</div>
        <h2 className="mt-1 text-[14px] font-bold tracking-[-0.02em] text-ink">Uji model FastAPI</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURE_FIELDS.map((field) => (
            <Field key={field.key} label={field.label}>
              <input
                type="number"
                step={field.step}
                value={features[field.key]}
                onChange={(event) =>
                  setFeatures((current) => ({
                    ...current,
                    [field.key]: Number(event.target.value),
                  }))
                }
                className="surface-input h-9"
              />
            </Field>
          ))}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field label="Reading ID">
            <input
              value={readingId}
              onChange={(event) => setReadingId(event.target.value)}
              className="surface-input h-9"
            />
          </Field>
          <Field label="Equipment ID">
            <input
              value={equipmentId}
              onChange={(event) => setEquipmentId(event.target.value)}
              className="surface-input h-9"
            />
          </Field>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button variant="primary" size="sm" onClick={() => void handlePredict()} disabled={predicting} className="h-9">
            {predicting ? "Memprediksi..." : "Jalankan prediksi"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFeatures(DEFAULT_FEATURES)}
            className="h-9"
          >
            Reset nilai contoh
          </Button>
        </div>

        {(baselineResult || mutiResult) && (
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {baselineResult ? (
              <div className="rounded-xl border border-line bg-surface-2/30 px-4 py-3.5">
                <div className="flex items-center justify-between">
                  <p className="mono-label">Baseline</p>
                  <Badge tone={baselineResult.label === "anomaly" ? "red" : "green"}>
                    {baselineResult.label}
                  </Badge>
                </div>
                <p className="data-value mt-2 text-[24px] font-semibold text-ink">
                  {baselineResult.prediction}
                </p>
                <p className="mt-1 font-mono text-[9px] text-ink-muted">
                  confidence:{" "}
                  {baselineResult.confidence === null
                    ? "-"
                    : `${(baselineResult.confidence * 100).toFixed(1)}%`}
                </p>
              </div>
            ) : null}
            {mutiResult ? (
              <div className="rounded-xl border border-line bg-surface-2/30 px-4 py-3.5">
                <div className="flex items-center justify-between">
                  <p className="mono-label">SF Anomaly Detector</p>
                  <Badge tone={mutiResult.label === "anomaly" ? "red" : "green"}>
                    {mutiResult.label}
                  </Badge>
                </div>
                <p className="data-value mt-2 text-[24px] font-semibold text-ink">
                  {mutiResult.prediction}
                </p>
                <p className="mt-1 font-mono text-[9px] text-ink-muted">
                  probability: {(mutiResult.anomaly_probability * 100).toFixed(1)}% · threshold:{" "}
                  {mutiResult.decision_threshold.toFixed(4)}
                </p>
              </div>
            ) : null}
          </div>
        )}
      </section>
    </div>
  );
}
