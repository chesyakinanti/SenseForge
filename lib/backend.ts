export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  "http://127.0.0.1:8000";

export interface BackendHealth {
  status: string;
  model: string;
  features: string[];
  muti_model_available: boolean;
  database_configured: boolean;
}

export interface DatasetSummary {
  rows: number;
  columns: number;
  column_names: string[];
  missing_values: Record<string, number>;
  numeric_summary: Record<string, Record<string, number>>;
  anomaly_distribution: Record<string, number>;
  sample: Array<Record<string, unknown>>;
}

export interface EquipmentGroup {
  _id: {
    equipment_id: string;
    operating_mode: string;
  };
  readings: number;
  anomalies: number;
  average_temperature_c: number;
  average_vibration_mm_s: number;
  average_pressure_kpa: number;
  average_motor_rpm: number;
  average_flow_rate_lpm: number;
  anomaly_rate: number;
}

export interface EquipmentAnalytics {
  collection: string;
  total_documents_available: number;
  documents_aggregated: number;
  groups: EquipmentGroup[];
}

export interface BaselineEvaluation {
  accuracy: number;
  confusion_matrix: number[][];
  labels: number[];
  classification_report: Record<string, unknown>;
  rows_evaluated: number;
  note: string;
}

export interface MutiEvaluation {
  dataset: string;
  cleaned_dataset: string;
  model: string;
  scikit_learn_version: string;
  feature_columns: string[];
  feature_selection: string;
  target_column: string;
  rows_original: number;
  rows_after_cleaning: number;
  duplicates_removed: number;
  missing_values_before_imputation: Record<string, number>;
  imputation: string;
  outliers: string;
  split_strategy: string;
  split_fractions: Record<string, number>;
  validation_start_timestamp: string;
  test_start_timestamp: string;
  train_rows: number;
  validation_rows: number;
  test_rows: number;
  train_class_counts: Record<string, number>;
  test_class_counts: Record<string, number>;
  decision_threshold: number;
  validation_f1_at_threshold: number;
  metrics: {
    accuracy: number;
    precision_anomaly: number;
    recall_anomaly: number;
    f1_anomaly: number;
    roc_auc: number;
    average_precision: number;
    specificity: number;
    confusion_matrix_labels_0_1: number[][];
    classification_report: Record<string, unknown>;
  };
}

export interface PredictionRequest {
  features: Record<string, number | null>;
  reading_id?: string;
  equipment_id?: string;
  timestamp?: string;
  save_to_database?: boolean;
}

export interface PredictionResponse {
  prediction: number;
  label: string;
  confidence: number | null;
  reading_id: string | null;
  equipment_id: string | null;
  timestamp: string | null;
  prediction_id?: string;
}

export interface MutiPredictionResponse {
  model: string;
  prediction: number;
  label: string;
  anomaly_probability: number;
  decision_threshold: number;
  features_used: string[];
  reading_id: string | null;
  equipment_id: string | null;
  timestamp: string | null;
}

export interface StoredPrediction {
  prediction_id?: string;
  prediction?: number;
  label?: string;
  confidence?: number | null;
  reading_id?: string | null;
  equipment_id?: string | null;
  timestamp?: string | null;
  features?: Record<string, unknown>;
}

export interface PredictionsResponse {
  items: StoredPrediction[];
  count: number;
}

export interface ImportDatasetResult {
  processed: number;
  collection: string;
}

export interface AggregationBenchmarkRow {
  requested_documents: number;
  processed_documents: number;
  groups_returned: number;
  repeats: number;
  processing_time_avg_ms: number;
  query_latency_p50_ms: number;
  query_latency_p95_ms: number;
  throughput_documents_per_second: number;
}

export interface AggregationBenchmark {
  benchmark: string;
  generated_at_utc: string;
  database: string;
  collection: string;
  total_documents_available: number;
  repeats_per_size: number;
  warmup_runs_per_size: number;
  measurement: string;
  pipeline_stages: string[];
  results: AggregationBenchmarkRow[];
}

async function request<T>(path: string, init?: RequestInit & { timeoutMs?: number }): Promise<T> {
  const controller = new AbortController();
  const timeoutMs = init?.timeoutMs ?? 15000;
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });

    if (!response.ok) {
      let detail = `${response.status} ${response.statusText}`;
      try {
        const body = await response.json();
        detail = typeof body.detail === "string" ? body.detail : JSON.stringify(body.detail ?? body);
      } catch {
        // Keep the HTTP status text when the body is not JSON.
      }
      throw new Error(detail);
    }

    return (await response.json()) as T;
  } finally {
    window.clearTimeout(timeout);
  }
}

export function getBackendHealth() {
  return request<BackendHealth>("/health");
}

export function getDatasetSummary() {
  return request<DatasetSummary>("/dataset/summary");
}

export function getDatasetRecords(skip = 0, limit = 5, isAnomaly?: 0 | 1) {
  const params = new URLSearchParams({ skip: String(skip), limit: String(limit) });
  if (isAnomaly !== undefined) params.set("is_anomaly", String(isAnomaly));
  return request<{ items: Array<Record<string, unknown>>; count: number; total: number; skip: number; limit: number }>(
    `/dataset/records?${params.toString()}`,
  );
}

export function getEquipmentAnalytics(documentLimit = 1000) {
  return request<EquipmentAnalytics>(`/analytics/equipment?document_limit=${documentLimit}`);
}

export function predictBaseline(requestBody: PredictionRequest) {
  return request<PredictionResponse>("/predict", {
    method: "POST",
    body: JSON.stringify(requestBody),
  });
}

export function predictMuti(requestBody: PredictionRequest) {
  return request<MutiPredictionResponse>("/predict/muti", {
    method: "POST",
    body: JSON.stringify(requestBody),
  });
}

export function getBaselineEvaluation() {
  return request<BaselineEvaluation>("/model/evaluation");
}

export function getMutiEvaluation() {
  return request<MutiEvaluation>("/model/muti/evaluation");
}

export function importDataset() {
  return request<ImportDatasetResult>("/predictions/import-dataset", { method: "POST" });
}

export function getPredictions(limit = 20) {
  return request<PredictionsResponse>(`/predictions?limit=${limit}`);
}

export function getAggregationBenchmark() {
  return request<AggregationBenchmark>("/analytics/benchmark");
}

