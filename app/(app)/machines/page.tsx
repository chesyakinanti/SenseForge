"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  Download,
  Factory,
  LayoutGrid,
  List,
  RefreshCw,
  Search,
  ShieldAlert,
  SlidersHorizontal,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { PageSkeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { MachineCard } from "@/components/domain/machine-card";
import { api } from "@/lib/api";
import { useAsyncData } from "@/lib/hooks";
import type { MachineStatus } from "@/lib/types";
import { SENSORS } from "@/lib/types";
import {
  cn,
  downloadCsv,
  formatDecimal,
  formatNumber,
} from "@/lib/utils";

type Filter = "all" | MachineStatus;
type Sort = "health" | "name" | "anomalies";
type View = "grid" | "list";

const filters: { value: Filter; label: string }[] = [
  { value: "all", label: "Semua" },
  { value: "normal", label: "Normal" },
  { value: "warning", label: "Perhatian" },
  { value: "critical", label: "Kritis" },
  { value: "maintenance", label: "Maintenance" },
];

export default function MachinesPage() {
  const { data, loading, error, reload } = useAsyncData(() => api.getMachines(), []);
  const { push } = useToast();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("health");
  const [view, setView] = useState<View>("grid");

  const counts = useMemo(() => {
    const machines = data ?? [];
    return {
      total: machines.length,
      normal: machines.filter((m) => m.status === "normal").length,
      warning: machines.filter((m) => m.status === "warning").length,
      critical: machines.filter((m) => m.status === "critical").length,
      maintenance: machines.filter((m) => m.status === "maintenance").length,
    };
  }, [data]);

  const filtered = useMemo(() => {
    let machines = data ?? [];
    if (filter !== "all") {
      machines = machines.filter((machine) => machine.status === filter);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      machines = machines.filter(
        (machine) =>
          machine.name.toLowerCase().includes(q) ||
          machine.id.toLowerCase().includes(q) ||
          machine.location.toLowerCase().includes(q) ||
          machine.line.toLowerCase().includes(q),
      );
    }
    return [...machines].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "anomalies") return b.anomalyCount - a.anomalyCount;
      return a.health - b.health;
    });
  }, [data, filter, query, sort]);

  if (loading && !data) return <PageSkeleton />;

  if (error) {
    return (
      <div className="space-y-5">
        <PageHeader
          eyebrow="Asset overview"
          title="Machines"
          description="Gagal memuat daftar mesin dari backend FastAPI."
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

  const exportCsv = () => {
    const rows: (string | number)[][] = [
      [
        "ID",
        "Nama",
        "Lini",
        "Tipe",
        "Lokasi",
        "Status",
        "Health",
        "Temperature",
        "Vibration",
        "Power",
        "Noise",
        "Anomali",
      ],
      ...(data ?? []).map((machine) => [
        machine.id,
        machine.name,
        machine.line,
        machine.type,
        machine.location,
        machine.status,
        machine.health,
        machine.latest.temperature,
        machine.latest.vibration,
        machine.latest.power,
        machine.latest.noise,
        machine.anomalyCount,
      ]),
    ];
    downloadCsv("senseforge-machines.csv", rows);
    push({
      tone: "success",
      title: "Export siap",
      description: "Daftar equipment dari backend diunduh sebagai CSV.",
    });
  };

  const firstMachineId = data?.[0]?.id ?? "EQ-001";

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Asset overview"
        title="Machines"
        description="Pantau kesehatan armada dan buka detail histori sensor tiap equipment dari MongoDB."
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={exportCsv} className="h-9">
              <Download className="size-3.5" /> Export CSV
            </Button>
            <Link
              href={`/machines/${firstMachineId}`}
              className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-teal bg-teal px-3 text-[12px] font-semibold text-[#04201f] shadow-[0_8px_24px_-12px_rgba(25,169,154,0.8)] transition hover:bg-teal-bright"
            >
              <Factory className="size-3.5" /> Detail {firstMachineId}
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {[
          { label: "Total mesin", value: counts.total, tone: "text-ink" },
          { label: "Normal", value: counts.normal, tone: "text-emerald-500" },
          { label: "Perlu perhatian", value: counts.warning, tone: "text-amber-500" },
          { label: "Kritis / maintenance", value: counts.critical + counts.maintenance, tone: "text-red-500" },
        ].map((item) => (
          <div key={item.label} className="panel flex items-center justify-between px-3.5 py-3">
            <span className="text-[10px] text-ink-muted">{item.label}</span>
            <span className={cn("data-value text-[18px] font-semibold", item.tone)}>
              {String(item.value).padStart(2, "0")}
            </span>
          </div>
        ))}
      </div>

      <div className="panel flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-[280px]">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-ink-muted" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari ID (EQ-001), nama, atau lokasi…"
            className="surface-input h-9 pl-9"
            aria-label="Cari mesin"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 overflow-x-auto rounded-xl border border-line bg-surface-2/40 p-1">
            {filters.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setFilter(item.value)}
                className={cn(
                  "shrink-0 rounded-lg px-2.5 py-1 text-[10px] font-semibold transition",
                  filter === item.value
                    ? "bg-teal/12 text-teal"
                    : "text-ink-muted hover:text-ink",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>

          <Select
            value={sort}
            onChange={(event) => setSort(event.target.value as Sort)}
            wrapperClassName="w-[150px]"
            aria-label="Urutkan mesin"
          >
            <option value="health">Kesehatan terendah</option>
            <option value="name">Nama A–Z</option>
            <option value="anomalies">Anomali terbanyak</option>
          </Select>

          <div className="flex items-center rounded-xl border border-line bg-surface-2/40 p-1">
            <button
              type="button"
              onClick={() => setView("grid")}
              aria-pressed={view === "grid"}
              aria-label="Tampilan grid"
              className={cn(
                "flex size-7 items-center justify-center rounded-lg transition",
                view === "grid" ? "bg-surface text-teal shadow-sm" : "text-ink-muted",
              )}
            >
              <LayoutGrid className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setView("list")}
              aria-pressed={view === "list"}
              aria-label="Tampilan tabel"
              className={cn(
                "flex size-7 items-center justify-center rounded-lg transition",
                view === "list" ? "bg-surface text-teal shadow-sm" : "text-ink-muted",
              )}
            >
              <List className="size-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="font-mono text-[9.5px] tracking-[0.05em] text-ink-muted">
          {filtered.length} mesin ditampilkan
        </p>
        <span className="flex items-center gap-1.5 text-[9.5px] text-ink-muted">
          <SlidersHorizontal className="size-3" /> Agregasi real-time dari MongoDB sensor_data
        </span>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Mesin tidak ditemukan"
          description="Coba ubah kata kunci atau filter status untuk melihat mesin lain."
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setQuery("");
                setFilter("all");
              }}
            >
              Reset filter
            </Button>
          }
        />
      ) : view === "grid" ? (
        <div className="grid gap-3.5 md:grid-cols-2 2xl:grid-cols-3">
          {filtered.map((machine, index) => (
            <MachineCard key={machine.id} machine={machine} index={index} />
          ))}
        </div>
      ) : (
        <div className="panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead>
                <tr className="border-b border-line bg-surface-2/35">
                  {["Mesin", "Lokasi", "Health", "Sensor terakhir", "Anomali", "Status", ""].map(
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
                {filtered.map((machine) => (
                  <tr key={machine.id} className="table-row">
                    <td className="px-4 py-3">
                      <Link href={`/machines/${machine.id}`} className="group block">
                        <span className="font-mono text-[9px] text-ink-muted">{machine.id}</span>
                        <span className="mt-0.5 block text-[11.5px] font-semibold text-ink transition group-hover:text-teal">
                          {machine.name}
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-[10.5px] text-ink-muted">
                      {machine.location}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-2">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              machine.health >= 85
                                ? "bg-teal"
                                : machine.health >= 70
                                  ? "bg-amber-500"
                                  : "bg-red-500",
                            )}
                            style={{ width: `${machine.health}%` }}
                          />
                        </div>
                        <span className="data-value text-[10.5px] text-ink-soft">
                          {machine.health}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2.5">
                        {SENSORS.slice(0, 2).map((sensor) => (
                          <span key={sensor.key} className="text-[9.5px] text-ink-muted">
                            {sensor.short}{" "}
                            <span className="data-value text-ink-soft">
                              {formatDecimal(machine.latest[sensor.key], sensor.decimals)}
                            </span>
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {machine.anomalyCount > 0 ? (
                        <Badge tone="amber" className="px-1.5 py-0.5">
                          {formatNumber(machine.anomalyCount)}
                        </Badge>
                      ) : (
                        <span className="text-[9.5px] text-ink-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={machine.status} />
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/machines/${machine.id}`}
                        aria-label={`Buka ${machine.name}`}
                        className="flex size-7 items-center justify-center rounded-lg text-ink-muted transition hover:bg-teal/10 hover:text-teal"
                      >
                        <ArrowUpRight className="size-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-line px-4 py-2.5 font-mono text-[9px] text-ink-muted">
            <span>{filtered.length} mesin</span>
            <span>{formatNumber(data?.reduce((sum, m) => sum + m.anomalyCount, 0) ?? 0)} total temuan</span>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 rounded-xl border border-line bg-surface-2/25 px-3 py-2.5">
        <ShieldAlert className="size-3.5 text-teal" />
        <p className="text-[10px] leading-relaxed text-ink-muted">
          Health score dihitung dari rasio anomali aktual per equipment pada agregasi MongoDB.
        </p>
      </div>
    </div>
  );
}
