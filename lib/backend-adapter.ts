import {
  getAggregationBenchmark,
  getBackendHealth,
  getBaselineEvaluation,
  getDatasetRecords,
  getDatasetSummary,
  getEquipmentAnalytics,
  getMutiEvaluation,
  type AggregationBenchmark,
} from "./backend";
import type {
  Anomaly,
  BenchmarkRow,
  DashboardSummary,
  DataQuality,
  HeatmapDay,
  Machine,
  MachineView,
  MaintenanceLog,
  PipelineStage,
  RangeKey,
  SensorReading,
} from "./types";
import { clamp, formatNumber } from "./utils";

type BackendRecord = Record<string, unknown>;

const EQUIPMENT_META: Record<
  string,
  Omit<
    Machine,
    | "id"
    | "status"
    | "health"
    | "base"
    | "latest"
    | "sparkline"
    | "anomalyCount"
    | "installedAt"
    | "lastService"
    | "uptime"
  >
> = {
  "EQ-001": {
    name: "Compressor A",
    line: "Line A",
    type: "Compressor",
    location: "Plant 1 · Bay A",
    description:
      "Kompresor udara utama pada Line A. Dipantau secara kontinu melalui telemetri MongoDB sensor_data (EQ-001).",
  },
  "EQ-002": {
    name: "Pump B",
    line: "Line A",
    type: "Pump",
    location: "Plant 1 · Bay B",
    description:
      "Pompa sirkulasi fluida tekanan tinggi pada Line A. Data parameter diambil langsung dari koleksi sensor_data (EQ-002).",
  },
  "EQ-003": {
    name: "Motor C",
    line: "Line B",
    type: "Motor",
    location: "Plant 1 · Bay C",
    description:
      "Motor induksi penggerak utama Line B. Indikator getaran, suhu, dan daya dianalisis oleh model RandomForest (EQ-003).",
  },
  "EQ-004": {
    name: "Press D",
    line: "Line B",
    type: "Press",
    location: "Plant 2 · Bay A",
    description:
      "Unit press hidrolik presisi pada Plant 2. Pemantauan fokus pada stabilitas tekanan, daya, dan akustik (EQ-004).",
  },
  "EQ-005": {
    name: "Conveyor E",
    line: "Line C",
    type: "Conveyor",
    location: "Plant 2 · Bay B",
    description:
      "Konveyor distribusi material Line C. Telemetri real-time dari dataset operasional MongoDB (EQ-005).",
  },
};

const ANOMALY_TYPE_LABEL: Record<string, string> = {
  thermal_runaway: "Thermal Runaway",
  pressure_leak: "Kebocoran Tekanan",
  bearing_degradation: "Degradasi Bantalan",
  sensor_malfunction: "Gangguan Sensor",
  normal: "Operasi Normal",
};

let recordsCache: BackendRecord[] | null = null;
let recordsPromise: Promise<BackendRecord[]> | null = null;
let anomalyRecordsCache: BackendRecord[] | null = null;
let anomalyRecordsPromise: Promise<BackendRecord[]> | null = null;
let machinesCache: MachineView[] | null = null;
let anomaliesCache: Anomaly[] | null = null;
let maintenanceCache: MaintenanceLog[] | null = null;

export function clearBackendCache() {
  recordsCache = null;
  recordsPromise = null;
  anomalyRecordsCache = null;
  anomalyRecordsPromise = null;
  machinesCache = null;
  anomaliesCache = null;
  maintenanceCache = null;
}

function asNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function recordTimestamp(record: BackendRecord) {
  const raw = asString(record.timestamp);
  const parsed = new Date(raw.includes("T") ? raw : raw.replace(" ", "T"));
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function mapSensorReading(record: BackendRecord): SensorReading {
  return {
    timestamp: recordTimestamp(record).toISOString(),
    temperature: Number(asNumber(record.temperature_c).toFixed(1)),
    vibration: Number(asNumber(record.vibration_mm_s).toFixed(2)),
    power: Number(asNumber(record.power_consumption_kw).toFixed(1)),
    noise: Number(asNumber(record.acoustic_level_db).toFixed(1)),
    isAnomaly: record.is_anomaly === 1,
  };
}

async function fetchAllRecords() {
  if (recordsCache) return recordsCache;
  if (recordsPromise) return recordsPromise;
  recordsPromise = (async () => {
    try {
      const result = await getDatasetRecords(0, 1000);
      const pages = result.items as BackendRecord[];
      recordsCache = pages;
      return pages;
    } catch (error) {
      recordsPromise = null;
      throw error;
    }
  })();
  return recordsPromise;
}

async function fetchAllAnomalyRecords() {
  if (anomalyRecordsCache) return anomalyRecordsCache;
  if (anomalyRecordsPromise) return anomalyRecordsPromise;
  anomalyRecordsPromise = (async () => {
    try {
      const result = await getDatasetRecords(0, 1000, 1);
      const pages = result.items as BackendRecord[];
      anomalyRecordsCache = pages;
      return pages;
    } catch (error) {
      anomalyRecordsPromise = null;
      throw error;
    }
  })();
  return anomalyRecordsPromise;
}

function deriveMachineStatus(anomalyRate: number, latestMode: string): Machine["status"] {
  if (latestMode === "maintenance") return "maintenance";
  if (anomalyRate > 0.05) return "critical";
  if (anomalyRate > 0.04) return "warning";
  return "normal";
}

function downsample(records: BackendRecord[], points: number) {
  if (records.length <= points) return records;
  const result: BackendRecord[] = [];
  for (let index = 0; index < points; index += 1) {
    const sourceIndex = Math.round((index * (records.length - 1)) / (points - 1));
    result.push(records[sourceIndex]);
  }
  return result;
}

function severityFromRecord(record: BackendRecord): Anomaly["severity"] {
  const alertCode = asString(record.alert_code);
  const priority = asNumber(record.maintenance_priority_score);
  if (alertCode.includes("CRIT") || priority >= 55) return "critical";
  if (alertCode.includes("WARN") || priority >= 30) return "warning";
  return "info";
}

function parameterFromRecord(record: BackendRecord): Anomaly["parameter"] {
  switch (asString(record.anomaly_type)) {
    case "thermal_runaway":
      return "temperature";
    case "pressure_leak":
      return "power";
    case "bearing_degradation":
      return "vibration";
    case "sensor_malfunction":
      return "noise";
    default:
      return "temperature";
  }
}

function buildMachineViews(
  records: BackendRecord[],
  analytics: Awaited<ReturnType<typeof getEquipmentAnalytics>>,
  anomalies: BackendRecord[],
) {
  const recordsByEquipment = new Map<string, BackendRecord[]>();
  for (const record of records) {
    const equipmentId = asString(record.equipment_id);
    if (!recordsByEquipment.has(equipmentId)) recordsByEquipment.set(equipmentId, []);
    recordsByEquipment.get(equipmentId)?.push(record);
  }

  const anomalyCountByEquipment = new Map<string, number>();
  for (const group of analytics.groups) {
    const eqId = group._id.equipment_id;
    anomalyCountByEquipment.set(eqId, (anomalyCountByEquipment.get(eqId) ?? 0) + group.anomalies);
  }
  if (anomalyCountByEquipment.size === 0) {
    for (const record of anomalies) {
      const equipmentId = asString(record.equipment_id);
      anomalyCountByEquipment.set(equipmentId, (anomalyCountByEquipment.get(equipmentId) ?? 0) + 1);
    }
  }

  const totalReadingsByEquipment = new Map<string, number>();
  for (const group of analytics.groups) {
    const eqId = group._id.equipment_id;
    totalReadingsByEquipment.set(eqId, (totalReadingsByEquipment.get(eqId) ?? 0) + group.readings);
  }

  const equipmentIds = Array.from(
    new Set([
      ...Object.keys(EQUIPMENT_META),
      ...Array.from(recordsByEquipment.keys()).filter(Boolean),
    ]),
  ).sort();

  return equipmentIds.map((equipmentId) => {
    const meta = EQUIPMENT_META[equipmentId] ?? {
      name: `Equipment ${equipmentId}`,
      line: "Line A",
      type: "Industrial Unit",
      location: "Plant 1",
      description: `Data telemetri real dari MongoDB untuk ${equipmentId}.`,
    };
    const equipmentRecords = (recordsByEquipment.get(equipmentId) ?? []).sort((a, b) =>
      asString(a.reading_id).localeCompare(asString(b.reading_id)),
    );
    const latest = equipmentRecords[equipmentRecords.length - 1] ?? {};
    const totalEqReadings = totalReadingsByEquipment.get(equipmentId) || equipmentRecords.length || 1;
    const totalEqAnomalies = anomalyCountByEquipment.get(equipmentId) ?? 0;
    const anomalyRate = totalEqAnomalies / totalEqReadings;
    const latestMode = asString(latest.operating_mode, "normal");
    const status = deriveMachineStatus(anomalyRate, latestMode);
    const health = clamp(Math.round(100 - anomalyRate * 650), 55, 98);
    const sparklineRecords = equipmentRecords.slice(-24);

    const ageHours = asNumber(latest.equipment_age_hours, 2000);
    const hoursSinceMaint = asNumber(latest.hours_since_maintenance, 12);
    const latestTime = recordTimestamp(latest);
    const installedDate = new Date(latestTime.getTime() - ageHours * 3600_000);
    const lastServiceDate = new Date(latestTime.getTime() - hoursSinceMaint * 3600_000);
    const uptime = Number(clamp(100 - anomalyRate * 40, 94.0, 99.9).toFixed(1));

    const normalGroup = analytics.groups.find(
      (g) => g._id.equipment_id === equipmentId && g._id.operating_mode === "normal",
    );

    const machine: Machine = {
      id: equipmentId,
      ...meta,
      status,
      health,
      installedAt: installedDate.toISOString().slice(0, 10),
      lastService: lastServiceDate.toISOString().slice(0, 10),
      uptime,
      base: {
        temperature: Number(
          asNumber(normalGroup?.average_temperature_c, asNumber(latest.temperature_c, 110)).toFixed(1),
        ),
        vibration: Number(
          asNumber(normalGroup?.average_vibration_mm_s, asNumber(latest.vibration_mm_s, 0.22)).toFixed(2),
        ),
        power: Number(asNumber(latest.power_consumption_kw, 49).toFixed(1)),
        noise: Number(asNumber(latest.acoustic_level_db, 73).toFixed(1)),
      },
      description: meta.description,
    };

    const view: MachineView = {
      ...machine,
      latest: mapSensorReading(latest),
      sparkline: sparklineRecords.map(mapSensorReading),
      anomalyCount: totalEqAnomalies,
    };

    return view;
  });
}

export async function getBackendMachines() {
  if (machinesCache) return machinesCache;
  const [records, analytics, anomalies] = await Promise.all([
    fetchAllRecords(),
    getEquipmentAnalytics(100000),
    fetchAllAnomalyRecords(),
  ]);
  const views = buildMachineViews(records, analytics, anomalies);
  machinesCache = views;
  return views;
}

export async function getBackendMachine(id: string) {
  const machines = await getBackendMachines();
  return machines.find((machine) => machine.id === id) ?? null;
}

export async function getBackendMachineSeries(id: string, range: RangeKey) {
  const records = await fetchAllRecords();
  const equipmentRecords = records
    .filter((record) => asString(record.equipment_id) === id)
    .sort((a, b) => asString(a.reading_id).localeCompare(asString(b.reading_id)));

  const pointCount = range === "24h" ? 48 : range === "7d" ? 84 : 90;
  const selectedCount = range === "24h" ? 48 : range === "7d" ? 120 : equipmentRecords.length;
  const selected = equipmentRecords.slice(-selectedCount);
  const sampled = downsample(selected, Math.min(pointCount, selected.length || pointCount));
  return sampled.map(mapSensorReading);
}

export async function getBackendAnomalies() {
  if (anomaliesCache) return anomaliesCache;
  const records = await fetchAllAnomalyRecords();
  const anomalies: Anomaly[] = records.map((record, index) => {
    const severity = severityFromRecord(record);
    const priority = asNumber(record.maintenance_priority_score, 50);
    const score = Number(clamp(priority / 80, 0.35, 0.99).toFixed(2));
    const anomalyType = asString(record.anomaly_type, "anomaly");
    const alertCode = asString(record.alert_code, "ALERT");
    const mode = asString(record.operating_mode, "normal");
    const hoursMaint = asNumber(record.hours_since_maintenance, 0);
    const status: Anomaly["status"] =
      hoursMaint <= 2
        ? "resolved"
        : severity === "critical"
          ? "open"
          : "reviewing";

    return {
      id: asString(record.reading_id, `ANM-${index}`),
      machineId: asString(record.equipment_id),
      timestamp: recordTimestamp(record).toISOString(),
      severity,
      score,
      status,
      parameter: parameterFromRecord(record),
      sensors: {
        temperature: Number(asNumber(record.temperature_c).toFixed(1)),
        vibration: Number(asNumber(record.vibration_mm_s).toFixed(2)),
        power: Number(asNumber(record.power_consumption_kw).toFixed(1)),
        noise: Number(asNumber(record.acoustic_level_db).toFixed(1)),
      },
      note: `${ANOMALY_TYPE_LABEL[anomalyType] ?? anomalyType} (${alertCode}) pada mode ${mode} · prioritas maintenance ${priority.toFixed(1)} · ${hoursMaint.toFixed(1)} jam sejak servis.`,
      model: "RandomForest · FastAPI",
    };
  });
  anomaliesCache = anomalies;
  return anomalies;
}

export async function getBackendAnomaly(id: string) {
  const anomalies = await getBackendAnomalies();
  return anomalies.find((anomaly) => anomaly.id === id) ?? null;
}

export async function getBackendMaintenanceLogs(): Promise<MaintenanceLog[]> {
  if (maintenanceCache) return maintenanceCache;
  const [anomalyRecords, normalRecords] = await Promise.all([
    fetchAllAnomalyRecords(),
    fetchAllRecords(),
  ]);

  const logs: MaintenanceLog[] = [];
  const seenReadings = new Set<string>();

  // Ambil rekaman anomali dengan prioritas tertinggi per equipment untuk tindak lanjut korektif/inspeksi
  const byEquipment = new Map<string, BackendRecord[]>();
  for (const record of anomalyRecords) {
    const eqId = asString(record.equipment_id);
    if (!eqId) continue;
    if (!byEquipment.has(eqId)) byEquipment.set(eqId, []);
    byEquipment.get(eqId)?.push(record);
  }

  for (const [eqId, eqRecords] of byEquipment.entries()) {
    const sortedByPriority = [...eqRecords].sort(
      (a, b) =>
        asNumber(b.maintenance_priority_score) - asNumber(a.maintenance_priority_score),
    );
    const topRecords = sortedByPriority.slice(0, 3);

    for (const record of topRecords) {
      const readingId = asString(record.reading_id);
      if (seenReadings.has(readingId)) continue;
      seenReadings.add(readingId);

      const priority = asNumber(record.maintenance_priority_score);
      const hoursSince = asNumber(record.hours_since_maintenance);
      const alertCode = asString(record.alert_code, "NONE");
      const anomalyType = asString(record.anomaly_type, "anomaly");
      const mode = asString(record.operating_mode, "normal");
      const typeLabel = ANOMALY_TYPE_LABEL[anomalyType] ?? anomalyType;

      const type: MaintenanceLog["type"] =
        alertCode.includes("CRIT") || priority >= 50
          ? "corrective"
          : hoursSince >= 30
            ? "preventive"
            : "inspection";

      const status: MaintenanceLog["status"] =
        hoursSince <= 3
          ? "completed"
          : alertCode.includes("CRIT") || priority >= 55
            ? "in-progress"
            : "scheduled";

      logs.push({
        id: `MNT-${readingId}`,
        machineId: eqId,
        type,
        title: `${type === "corrective" ? "Tindak lanjut" : "Inspeksi"} ${typeLabel} (${alertCode})`,
        technician: `Tim Telemetry · ${eqId} (${mode})`,
        date: recordTimestamp(record).toISOString(),
        status,
        notes: `Rekaman ${readingId} · Skor prioritas maintenance ${priority.toFixed(1)} · ${hoursSince.toFixed(1)} jam sejak maintenance terakhir · Suhu ${asNumber(record.temperature_c).toFixed(1)}°C, Getaran ${asNumber(record.vibration_mm_s).toFixed(2)} mm/s, Daya ${asNumber(record.power_consumption_kw).toFixed(1)} kW.`,
      });
    }
  }

  // Tambahkan siklus preventive maintenance yang baru selesai (hours_since_maintenance === 0) per equipment
  const resetByEquipment = new Map<string, BackendRecord>();
  for (const record of normalRecords) {
    const eqId = asString(record.equipment_id);
    const hoursSince = asNumber(record.hours_since_maintenance, 99);
    if (eqId && hoursSince === 0 && !resetByEquipment.has(eqId)) {
      resetByEquipment.set(eqId, record);
    }
  }

  for (const [eqId, record] of resetByEquipment.entries()) {
    const readingId = asString(record.reading_id);
    if (seenReadings.has(readingId)) continue;
    seenReadings.add(readingId);
    const ageHours = asNumber(record.equipment_age_hours);
    const mode = asString(record.operating_mode, "startup");

    logs.push({
      id: `MNT-${readingId}`,
      machineId: eqId,
      type: "preventive",
      title: `Perawatan preventif terjadwal & reset jam servis (${eqId})`,
      technician: `Unit Pemeliharaan · ${mode}`,
      date: recordTimestamp(record).toISOString(),
      status: "completed",
      notes: `Rekaman ${readingId} · Jam sejak maintenance direset ke 0,0 jam pada usia peralatan ${ageHours.toFixed(1)} jam · Alert: ${asString(record.alert_code, "NONE")}.`,
    });
  }

  logs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  maintenanceCache = logs;
  return logs;
}

export async function getBackendHeatmap() {
  const records = await fetchAllAnomalyRecords();
  const latestDate = records.reduce((latest, record) => {
    const date = recordTimestamp(record);
    return date > latest ? date : latest;
  }, new Date("2024-01-01T00:00:00"));
  const days: HeatmapDay[] = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const day = new Date(latestDate);
    day.setDate(day.getDate() - offset);
    day.setHours(0, 0, 0, 0);
    days.push({
      date: day.toISOString(),
      label: day.toLocaleDateString("id-ID", {
        weekday: "short",
        day: "2-digit",
        month: "short",
      }),
      cells: Array.from({ length: 24 }, () => 0),
    });
  }

  for (const record of records) {
    const date = recordTimestamp(record);
    const day = days.find((item) => item.date.slice(0, 10) === date.toISOString().slice(0, 10));
    if (!day) continue;
    const hour = date.getHours();
    const severity = severityFromRecord(record);
    const weight = severity === "critical" ? 3 : severity === "warning" ? 2 : 1;
    day.cells[hour] = clamp(day.cells[hour] + weight, 0, 4);
  }

  return days;
}

export async function getBackendNotifications() {
  const anomalies = await getBackendAnomalies();
  return anomalies
    .slice()
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 4)
    .map((anomaly, index) => ({
      id: `NTF-${index + 1}`,
      title:
        anomaly.severity === "critical"
          ? `Anomali kritis · ${anomaly.machineId}`
          : `Temuan anomali · ${anomaly.machineId}`,
      description: anomaly.note,
      time: anomaly.timestamp,
      tone:
        anomaly.severity === "critical"
          ? ("critical" as const)
          : anomaly.severity === "warning"
            ? ("warning" as const)
            : ("info" as const),
      href: `/anomalies?machine=${anomaly.machineId}`,
    }));
}

function formatDatasetSizeLabel(docs: number) {
  if (docs >= 1_000_000) return `${docs / 1_000_000} jt`;
  if (docs >= 1_000) return `${docs / 1_000} rb`;
  return String(docs);
}

export async function getBackendProcessingData() {
  const startedAt = performance.now();
  const [health, summary, analytics, baselineEvaluation, mutiEvaluation, benchmarkReport] =
    await Promise.all([
      getBackendHealth(),
      getDatasetSummary(),
      getEquipmentAnalytics(100000),
      getBaselineEvaluation(),
      getMutiEvaluation(),
      getAggregationBenchmark().catch((): AggregationBenchmark | null => null),
    ]);
  const liveLatencyMs = Math.max(1, Math.round(performance.now() - startedAt));

  const totalCells = Math.max(1, summary.rows * summary.columns);
  const totalMissing = Object.values(summary.missing_values).reduce((sum, count) => sum + count, 0);
  const missingPct = Number(((totalMissing / totalCells) * 100).toFixed(2));
  const duplicatesPct = Number(
    ((mutiEvaluation.duplicates_removed / Math.max(1, mutiEvaluation.rows_original)) * 100).toFixed(2),
  );
  const invalidRows = Math.max(
    0,
    mutiEvaluation.rows_original - mutiEvaluation.rows_after_cleaning - mutiEvaluation.duplicates_removed,
  );
  const invalidPct = Number(
    ((invalidRows / Math.max(1, mutiEvaluation.rows_original)) * 100).toFixed(2),
  );
  const completeness = Number(clamp(100 - missingPct - duplicatesPct - invalidPct, 0, 100).toFixed(2));

  const quality: DataQuality = {
    missing: missingPct,
    duplicates: duplicatesPct,
    invalid: invalidPct,
    completeness,
    records: summary.rows,
  };

  let benchmarks: BenchmarkRow[];
  if (benchmarkReport && benchmarkReport.results.length > 0) {
    benchmarks = benchmarkReport.results.map((row) => ({
      dataset: formatDatasetSizeLabel(row.processed_documents),
      records: row.processed_documents,
      ingestion: Number((row.query_latency_p95_ms / 1000).toFixed(3)),
      query: Number(row.query_latency_p50_ms.toFixed(1)),
      processing: Number((row.processing_time_avg_ms / 1000).toFixed(3)),
      throughput: Math.round(row.throughput_documents_per_second),
    }));
  } else {
    const sizes = [100, 1000, 5000, 10000, analytics.total_documents_available || 50000];
    const uniqueSizes = Array.from(new Set(sizes.filter((s) => s > 0))).sort((a, b) => a - b);
    benchmarks = [];
    for (const size of uniqueSizes) {
      const t0 = performance.now();
      const res = await getEquipmentAnalytics(size);
      const elapsedMs = Math.max(1, performance.now() - t0);
      const docs = res.documents_aggregated || size;
      benchmarks.push({
        dataset: formatDatasetSizeLabel(docs),
        records: docs,
        ingestion: Number(((elapsedMs * 1.12) / 1000).toFixed(3)),
        query: Number(elapsedMs.toFixed(1)),
        processing: Number((elapsedMs / 1000).toFixed(3)),
        throughput: Math.round(docs / (elapsedMs / 1000)),
      });
    }
  }

  const topBenchmark = benchmarks[benchmarks.length - 1];
  const anomalyTotal = summary.anomaly_distribution["1"] ?? 0;

  const pipeline: PipelineStage[] = [
    {
      key: "dataset",
      label: "Dataset CSV",
      description: `${mutiEvaluation.dataset} (${summary.columns} kolom sensor & target)`,
      status: "completed",
      duration: `${formatNumber(totalMissing)} missing`,
      records: `${formatNumber(summary.rows)} baris`,
    },
    {
      key: "ingestion",
      label: "MongoDB Ingestion",
      description: `Koleksi ${analytics.collection} terindeks reading_id`,
      status: health.database_configured ? "completed" : "pending",
      duration: `${topBenchmark?.ingestion ?? 0} dtk`,
      records: `${formatNumber(analytics.total_documents_available)} dok`,
    },
    {
      key: "preprocessing",
      label: "Preprocessing",
      description: `Imputasi median & deduplikasi (${mutiEvaluation.cleaned_dataset})`,
      status: "completed",
      duration: `${mutiEvaluation.duplicates_removed} duplikat`,
      records: `${formatNumber(mutiEvaluation.rows_after_cleaning)} valid`,
    },
    {
      key: "aggregation",
      label: "MongoDB Aggregation",
      description: "Pipeline $sort · $limit · $group equipment & mode",
      status: "completed",
      duration: `${topBenchmark?.query ?? liveLatencyMs} ms`,
      records: `${analytics.groups.length} grup`,
    },
    {
      key: "ml",
      label: "ML Evaluation",
      description: `RandomForest (${mutiEvaluation.feature_columns.length} fitur · threshold ${mutiEvaluation.decision_threshold.toFixed(3)})`,
      status: health.muti_model_available ? "completed" : "pending",
      duration: `AUC ${mutiEvaluation.metrics.roc_auc.toFixed(3)}`,
      records: `${formatNumber(anomalyTotal)} anomali`,
    },
    {
      key: "api",
      label: "FastAPI Service",
      description: `Model ${health.model} & endpoint analitik aktif`,
      status: health.status === "ok" ? "completed" : "pending",
      duration: `${liveLatencyMs} ms`,
      records: `Akurasi ${(baselineEvaluation.accuracy * 100).toFixed(1)}%`,
    },
    {
      key: "dashboard",
      label: "Telemetry UI",
      description: "Sinkronisasi real-time dengan FastAPI & MongoDB",
      status: "running",
      duration: "Aktif",
      records: `${Object.keys(EQUIPMENT_META).length} equipment`,
    },
  ];

  return {
    pipeline,
    quality,
    benchmarks,
    summary: {
      ingestion: `${topBenchmark?.ingestion ?? 0} dtk (p95)`,
      query: `${topBenchmark?.query ?? liveLatencyMs} ms (p50)`,
      throughput: `${formatNumber(topBenchmark?.throughput ?? 0)} dok/dtk`,
      lastRun: benchmarkReport?.generated_at_utc ?? new Date().toISOString(),
      dataset: `${formatNumber(summary.rows)} rekaman`,
    },
    details: {
      validRecords: mutiEvaluation.rows_after_cleaning,
      aggregationGroups: analytics.groups.length,
      anomalyCount: anomalyTotal,
      totalMissing,
      collection: analytics.collection,
      database: benchmarkReport?.database ?? "senseforge",
      pipelineStages: benchmarkReport?.pipeline_stages ?? [
        "$sort reading_id",
        "$limit",
        "$group",
        "$set anomaly_rate",
        "$sort groups",
      ],
      baselineAccuracy: baselineEvaluation.accuracy,
      baselineRows: baselineEvaluation.rows_evaluated,
      mutiModel: mutiEvaluation.model,
      scikitLearnVersion: mutiEvaluation.scikit_learn_version,
      featureColumns: mutiEvaluation.feature_columns,
      splitStrategy: mutiEvaluation.split_strategy,
      trainRows: mutiEvaluation.train_rows,
      validationRows: mutiEvaluation.validation_rows,
      testRows: mutiEvaluation.test_rows,
      decisionThreshold: mutiEvaluation.decision_threshold,
      metrics: mutiEvaluation.metrics,
    },
  };
}

export async function getBackendDashboardData() {
  const [machines, summary, anomalies, heatmap, processing, maintenanceLogs] = await Promise.all([
    getBackendMachines(),
    getDatasetSummary(),
    getBackendAnomalies(),
    getBackendHeatmap(),
    getBackendProcessingData(),
    getBackendMaintenanceLogs(),
  ]);
  const criticalAnomalies = anomalies.filter((anomaly) => anomaly.severity === "critical").length;
  const resolvedAnomalies = anomalies.filter((anomaly) => anomaly.status === "resolved").length;
  const healthAvg =
    machines.reduce((sum, machine) => sum + machine.health, 0) / Math.max(1, machines.length);
  const trendMachine = machines[0];
  const trend = trendMachine ? await getBackendMachineSeries(trendMachine.id, "24h") : [];

  const statusCounts = {
    normal: machines.filter((machine) => machine.status === "normal").length,
    warning: machines.filter((machine) => machine.status === "warning").length,
    critical: machines.filter((machine) => machine.status === "critical").length,
    maintenance: machines.filter((machine) => machine.status === "maintenance").length,
  };

  const completedMaint = maintenanceLogs.filter((log) => log.status === "completed").length;
  const resolutionRate =
    anomalies.length > 0
      ? Math.round((resolvedAnomalies / anomalies.length) * 100)
      : maintenanceLogs.length > 0
        ? Math.round((completedMaint / maintenanceLogs.length) * 100)
        : 0;

  const avgUptime =
    machines.reduce((sum, machine) => sum + machine.uptime, 0) / Math.max(1, machines.length);

  const dashboard: DashboardSummary = {
    totalMachines: machines.length,
    activeMachines: machines.filter((m) => m.status !== "maintenance").length,
    totalRecords: summary.rows,
    totalAnomalies: summary.anomaly_distribution["1"] ?? anomalies.length,
    criticalAnomalies,
    healthAvg: Math.round(healthAvg * 10) / 10,
    resolutionRate,
    uptime: Number(avgUptime.toFixed(1)),
    lastSync: new Date().toISOString(),
  };

  return {
    summary: dashboard,
    machines,
    anomalies: anomalies.slice(0, 5),
    heatmap,
    statusCounts,
    trendMachine,
    trend,
    latest: trend[trend.length - 1],
    pipeline: processing.pipeline,
    quality: processing.quality,
  };
}
