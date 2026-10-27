export type SensorKey = "temperature" | "vibration" | "power" | "noise";

export type MachineStatus = "normal" | "warning" | "critical" | "maintenance";
export type Severity = "critical" | "warning" | "info";
export type AnomalyStatus = "open" | "reviewing" | "resolved";
export type RangeKey = "24h" | "7d" | "30d";

export interface SensorMeta {
  key: SensorKey;
  label: string;
  short: string;
  unit: string;
  color: string;
  decimals: number;
  warning: number;
  critical: number;
  baselineLabel: string;
}

export const SENSORS: SensorMeta[] = [
  {
    key: "temperature",
    label: "Temperature",
    short: "Temp",
    unit: "°C",
    color: "#f4b860",
    decimals: 1,
    warning: 125,
    critical: 145,
    baselineLabel: "Suhu mesin",
  },
  {
    key: "vibration",
    label: "Vibration",
    short: "Vib",
    unit: "mm/s",
    color: "#19a99a",
    decimals: 2,
    warning: 0.32,
    critical: 0.45,
    baselineLabel: "Getaran mesin",
  },
  {
    key: "power",
    label: "Power",
    short: "Power",
    unit: "kW",
    color: "#5b9df9",
    decimals: 1,
    warning: 54,
    critical: 60,
    baselineLabel: "Daya listrik",
  },
  {
    key: "noise",
    label: "Noise",
    short: "Noise",
    unit: "dB",
    color: "#a78bfa",
    decimals: 1,
    warning: 78,
    critical: 85,
    baselineLabel: "Akustik mesin",
  },
];

export const SENSOR_MAP = Object.fromEntries(
  SENSORS.map((sensor) => [sensor.key, sensor]),
) as Record<SensorKey, SensorMeta>;

export interface SensorReading {
  timestamp: string;
  temperature: number;
  vibration: number;
  power: number;
  noise: number;
  isAnomaly?: boolean;
}

export interface Machine {
  id: string;
  name: string;
  line: string;
  type: string;
  location: string;
  status: MachineStatus;
  health: number;
  installedAt: string;
  lastService: string;
  uptime: number;
  base: Record<SensorKey, number>;
  description: string;
}

export interface MachineView extends Machine {
  latest: SensorReading;
  sparkline: SensorReading[];
  anomalyCount: number;
}

export interface Anomaly {
  id: string;
  machineId: string;
  timestamp: string;
  severity: Severity;
  score: number;
  status: AnomalyStatus;
  parameter: SensorKey;
  sensors: Record<SensorKey, number>;
  note: string;
  model: string;
}

export interface MaintenanceLog {
  id: string;
  machineId: string;
  type: "preventive" | "corrective" | "inspection";
  title: string;
  technician: string;
  date: string;
  status: "scheduled" | "in-progress" | "completed";
  notes: string;
}

export interface DataQuality {
  missing: number;
  duplicates: number;
  invalid: number;
  completeness: number;
  records: number;
}

export interface PipelineStage {
  key: string;
  label: string;
  description: string;
  status: "completed" | "running" | "pending";
  duration: string;
  records: string;
}

export interface BenchmarkRow {
  dataset: string;
  records: number;
  ingestion: number;
  query: number;
  processing: number;
  throughput: number;
}

export interface DashboardSummary {
  totalMachines: number;
  activeMachines: number;
  totalRecords: number;
  totalAnomalies: number;
  criticalAnomalies: number;
  healthAvg: number;
  resolutionRate: number;
  uptime: number;
  lastSync: string;
}

export interface HeatmapDay {
  date: string;
  label: string;
  cells: number[];
}

export function sensorStatus(key: SensorKey, value: number) {
  const sensor = SENSOR_MAP[key];
  if (value >= sensor.critical) return "critical" as const;
  if (value >= sensor.warning) return "warning" as const;
  return "normal" as const;
}

export const STATUS_LABEL: Record<MachineStatus, string> = {
  normal: "Normal",
  warning: "Perhatian",
  critical: "Kritis",
  maintenance: "Maintenance",
};

export const SEVERITY_LABEL: Record<Severity, string> = {
  critical: "Kritis",
  warning: "Peringatan",
  info: "Info",
};

export const ANOMALY_STATUS_LABEL: Record<AnomalyStatus, string> = {
  open: "Terbuka",
  reviewing: "Ditinjau",
  resolved: "Selesai",
};

export const RANGES: Record<
  RangeKey,
  { label: string; short: string; hours: number; points: number }
> = {
  "24h": { label: "24 jam terakhir", short: "24 jam", hours: 24, points: 48 },
  "7d": { label: "7 hari terakhir", short: "7 hari", hours: 168, points: 84 },
  "30d": { label: "30 hari terakhir", short: "30 hari", hours: 720, points: 90 },
};
