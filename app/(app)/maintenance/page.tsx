"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Filter,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  UserRound,
  Wrench,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { PageSkeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Select, Field } from "@/components/ui/select";
import { Modal } from "@/components/ui/overlay";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { DemoNotice } from "@/components/domain/demo-notice";
import { api } from "@/lib/api";
import { useAsyncData } from "@/lib/hooks";
import type { MaintenanceLog } from "@/lib/types";
import { cn, formatDate, formatFullDateTime } from "@/lib/utils";

const statusLabels = {
  scheduled: "Terjadwal",
  "in-progress": "Berjalan",
  completed: "Selesai",
} as const;

const typeLabels = {
  preventive: "Preventif",
  corrective: "Korektif",
  inspection: "Inspeksi",
} as const;

const emptyForm = {
  machineId: "EQ-001",
  type: "preventive" as MaintenanceLog["type"],
  status: "scheduled" as MaintenanceLog["status"],
  title: "",
  technician: "",
  date: "2026-10-27T09:00",
  notes: "",
};

export default function MaintenancePage() {
  const { data, loading, error, reload } = useAsyncData(() => api.getMaintenance(), []);
  const { data: machinesData } = useAsyncData(() => api.getMachines(), []);
  const machines = machinesData ?? [];
  const { push } = useToast();
  const [added, setAdded] = useState<MaintenanceLog[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<MaintenanceLog["status"] | "all">("all");
  const [type, setType] = useState<MaintenanceLog["type"] | "all">("all");
  const [machineFilter, setMachineFilter] = useState("all");

  const logs = useMemo(
    () =>
      [...added, ...(data ?? [])].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      ),
    [added, data],
  );

  const filtered = useMemo(() => {
    let list = logs;
    if (status !== "all") list = list.filter((log) => log.status === status);
    if (type !== "all") list = list.filter((log) => log.type === type);
    if (machineFilter !== "all") {
      list = list.filter((log) => log.machineId === machineFilter);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((log) => {
        const machine = machines.find((item) => item.id === log.machineId);
        return (
          log.title.toLowerCase().includes(q) ||
          log.technician.toLowerCase().includes(q) ||
          log.notes.toLowerCase().includes(q) ||
          log.machineId.toLowerCase().includes(q) ||
          (machine?.name.toLowerCase().includes(q) ?? false)
        );
      });
    }
    return list;
  }, [logs, status, type, machineFilter, query, machines]);

  if (loading && !data) return <PageSkeleton />;

  if (error) {
    return (
      <div className="space-y-5">
        <PageHeader
          eyebrow="Follow-up"
          title="Maintenance Log"
          description="Gagal memuat catatan perawatan dari telemetri backend."
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
    scheduled: logs.filter((log) => log.status === "scheduled").length,
    inProgress: logs.filter((log) => log.status === "in-progress").length,
    completed: logs.filter((log) => log.status === "completed").length,
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.title.trim() || !form.technician.trim()) return;
    const log: MaintenanceLog = {
      id: `MNT-LOCAL-${added.length + 1}`,
      machineId: form.machineId,
      type: form.type,
      title: form.title.trim(),
      technician: form.technician.trim(),
      date: new Date(form.date).toISOString(),
      status: form.status,
      notes: form.notes.trim() || "Tidak ada catatan tambahan.",
    };
    setAdded((current) => [log, ...current]);
    setModalOpen(false);
    setForm(emptyForm);
    push({
      tone: "success",
      title: "Catatan maintenance ditambahkan",
      description: `${log.id} · ${log.title} ditambahkan ke sesi kerja.`,
    });
  };

  const resetFilters = () => {
    setQuery("");
    setStatus("all");
    setType("all");
    setMachineFilter("all");
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Follow-up"
        title="Maintenance Log"
        description="Log perawatan turunan dari telemetri backend (hours_since_maintenance, maintenance_priority_score, alert_code)."
        actions={
          <Button variant="primary" size="sm" onClick={() => setModalOpen(true)} className="h-9">
            <Plus className="size-3.5" /> Tambah Catatan
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-4">
        {[
          { label: "Total catatan", value: logs.length, tone: "text-ink", icon: Wrench },
          { label: "Terjadwal", value: stats.scheduled, tone: "text-ink-soft", icon: CalendarDays },
          { label: "Berjalan", value: stats.inProgress, tone: "text-amber-500", icon: Loader2 },
          { label: "Selesai", value: stats.completed, tone: "text-emerald-500", icon: CheckCircle2 },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="panel flex items-center justify-between px-3.5 py-3">
              <div>
                <p className="text-[10px] text-ink-muted">{item.label}</p>
                <p className={cn("data-value mt-1 text-[20px] font-semibold", item.tone)}>
                  {String(item.value).padStart(2, "0")}
                </p>
              </div>
              <span className="flex size-8 items-center justify-center rounded-lg border border-line bg-surface-2/50 text-ink-muted">
                <Icon className={cn("size-3.5", item.icon === Loader2 && item.value > 0 && "animate-spin")} />
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
            placeholder="Cari catatan, reading ID, atau equipment…"
            className="surface-input h-9 pl-9"
            aria-label="Cari catatan maintenance"
          />
        </div>
        <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-3">
          <Select
            value={status}
            onChange={(event) => setStatus(event.target.value as MaintenanceLog["status"] | "all")}
            aria-label="Filter status"
          >
            <option value="all">Semua status</option>
            <option value="scheduled">Terjadwal</option>
            <option value="in-progress">Berjalan</option>
            <option value="completed">Selesai</option>
          </Select>
          <Select
            value={type}
            onChange={(event) => setType(event.target.value as MaintenanceLog["type"] | "all")}
            aria-label="Filter jenis"
          >
            <option value="all">Semua jenis</option>
            <option value="preventive">Preventif</option>
            <option value="corrective">Korektif</option>
            <option value="inspection">Inspeksi</option>
          </Select>
          <Select
            value={machineFilter}
            onChange={(event) => setMachineFilter(event.target.value)}
            aria-label="Filter mesin"
          >
            <option value="all">Semua mesin</option>
            {machines.map((machine) => (
              <option key={machine.id} value={machine.id}>
                {machine.id} · {machine.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[9px] text-ink-muted">{filtered.length} catatan</span>
          <Button variant="ghost" size="sm" onClick={resetFilters} className="h-9">
            <Filter className="size-3" /> Reset
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Tidak ada catatan"
          description="Ubah filter atau tambahkan catatan perawatan baru untuk mesin."
          action={
            <Button variant="secondary" size="sm" onClick={resetFilters}>
              Reset filter
            </Button>
          }
        />
      ) : (
        <div className="relative space-y-3 before:absolute before:top-3 before:bottom-3 before:left-[19px] before:w-px before:bg-line">
          {filtered.map((log, index) => {
            const machine = machines.find((item) => item.id === log.machineId);
            const tone =
              log.status === "completed"
                ? "text-emerald-500 border-emerald-500/25 bg-emerald-500/10"
                : log.status === "in-progress"
                  ? "text-amber-500 border-amber-500/25 bg-amber-500/10"
                  : "text-ink-muted border-line bg-surface-2";
            return (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.04 }}
                className="relative pl-12"
              >
                <span
                  className={cn(
                    "absolute top-4 left-2 flex size-5 items-center justify-center rounded-full border-2 border-[var(--background)]",
                    tone,
                  )}
                >
                  {log.status === "completed" ? (
                    <CheckCircle2 className="size-3" />
                  ) : log.status === "in-progress" ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    <Clock3 className="size-3" />
                  )}
                </span>
                <article className="panel panel-interactive p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[9px] text-ink-muted">{log.id}</span>
                        <StatusBadge status={log.status} />
                        <Badge tone={log.type === "corrective" ? "amber" : log.type === "preventive" ? "teal" : "steel"}>
                          {typeLabels[log.type]}
                        </Badge>
                      </div>
                      <h2 className="mt-2 text-[13.5px] font-bold tracking-[-0.01em] text-ink">
                        {log.title}
                      </h2>
                      <p className="mt-1 max-w-3xl text-[11px] leading-relaxed text-ink-muted">
                        {log.notes}
                      </p>
                    </div>
                    <div className="shrink-0 text-left sm:text-right">
                      <p className="font-mono text-[9px] text-ink-soft">{formatDate(log.date)}</p>
                      <p className="mt-0.5 font-mono text-[8.5px] text-ink-muted">
                        {formatFullDateTime(log.date).split(" · ")[1] ?? ""}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-line/70 pt-2.5 text-[10px] text-ink-muted">
                    <span className="flex items-center gap-1.5">
                      <Wrench className="size-3" />
                      {machine ? (
                        <Link href={`/machines/${machine.id}`} className="transition hover:text-teal">
                          {machine.name}
                        </Link>
                      ) : (
                        log.machineId
                      )}
                      <span className="font-mono text-[8.5px] text-ink-muted/70">
                        {log.machineId}
                      </span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <UserRound className="size-3" /> {log.technician}
                    </span>
                    <span className="ml-auto font-mono text-[8px] uppercase tracking-[0.12em] text-ink-muted/70">
                      {statusLabels[log.status]}
                    </span>
                  </div>
                </article>
              </motion.div>
            );
          })}
        </div>
      )}

      <DemoNotice>
        Log di atas dibentuk secara otomatis dari atribut telemetri backend (
        <span className="font-mono">hours_since_maintenance</span>,{" "}
        <span className="font-mono">maintenance_priority_score</span>, dan{" "}
        <span className="font-mono">alert_code</span>) pada koleksi MongoDB{" "}
        <span className="font-mono">sensor_data</span>.
      </DemoNotice>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Tambah catatan maintenance"
        description="Tambahkan tindak lanjut manual pada sesi operator."
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" size="sm" type="submit" form="maintenance-form">
              <Plus className="size-3.5" /> Simpan catatan
            </Button>
          </>
        }
      >
        <form id="maintenance-form" onSubmit={submit} className="space-y-3.5">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Mesin">
              <Select
                value={form.machineId}
                onChange={(event) => setForm({ ...form, machineId: event.target.value })}
              >
                {machines.map((machine) => (
                  <option key={machine.id} value={machine.id}>
                    {machine.id} · {machine.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Jenis">
              <Select
                value={form.type}
                onChange={(event) =>
                  setForm({ ...form, type: event.target.value as MaintenanceLog["type"] })
                }
              >
                <option value="preventive">Preventif</option>
                <option value="corrective">Korektif</option>
                <option value="inspection">Inspeksi</option>
              </Select>
            </Field>
          </div>
          <Field label="Judul catatan">
            <input
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              className="surface-input"
              placeholder="Contoh: Inspeksi bantalan kompresor"
              required
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Teknisi">
              <input
                value={form.technician}
                onChange={(event) => setForm({ ...form, technician: event.target.value })}
                className="surface-input"
                placeholder="Nama teknisi"
                required
              />
            </Field>
            <Field label="Jadwal">
              <input
                type="datetime-local"
                value={form.date}
                onChange={(event) => setForm({ ...form, date: event.target.value })}
                className="surface-input"
                required
              />
            </Field>
          </div>
          <Field label="Status">
            <Select
              value={form.status}
              onChange={(event) =>
                setForm({ ...form, status: event.target.value as MaintenanceLog["status"] })
              }
            >
              <option value="scheduled">Terjadwal</option>
              <option value="in-progress">Berjalan</option>
              <option value="completed">Selesai</option>
            </Select>
          </Field>
          <Field label="Catatan">
            <textarea
              value={form.notes}
              onChange={(event) => setForm({ ...form, notes: event.target.value })}
              className="surface-input min-h-[88px] resize-y"
              placeholder="Tindakan, temuan, atau bagian yang perlu diperiksa…"
            />
          </Field>
        </form>
      </Modal>
    </div>
  );
}
