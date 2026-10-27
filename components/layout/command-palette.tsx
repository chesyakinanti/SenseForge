"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  Activity,
  ArrowRight,
  DatabaseZap,
  Factory,
  LayoutDashboard,
  Search,
  Server,
  Settings,
  ShieldAlert,
  Wrench,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAsyncData } from "@/lib/hooks";
import { cn } from "@/lib/utils";

const pages = [
  {
    label: "Dashboard",
    description: "Ringkasan kondisi mesin dan tren sensor",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Machines",
    description: "Daftar equipment dan kesehatan armada",
    href: "/machines",
    icon: Factory,
  },
  {
    label: "Sensor Data",
    description: "Histori dan eksplorasi empat parameter sensor",
    href: "/sensors",
    icon: Activity,
  },
  {
    label: "Anomaly Detection",
    description: "Temuan anomali dan skor model",
    href: "/anomalies",
    icon: ShieldAlert,
  },
  {
    label: "Maintenance Log",
    description: "Catatan perawatan turunan telemetri",
    href: "/maintenance",
    icon: Wrench,
  },
  {
    label: "Processing & Benchmark",
    description: "Pipeline data, benchmark MongoDB, dan evaluasi ML",
    href: "/processing",
    icon: DatabaseZap,
  },
  {
    label: "Backend API",
    description: "Status FastAPI, dataset, analytics, dan uji prediksi",
    href: "/backend",
    icon: Server,
  },
  {
    label: "Settings",
    description: "Tampilan, profil operator, dan konfigurasi API",
    href: "/settings",
    icon: Settings,
  },
];

export function CommandPalette() {
  const router = useRouter();
  const { data: machinesData } = useAsyncData(() => api.getMachines(), []);
  const machines = machinesData ?? [];
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
      if (event.key === "Escape") setOpen(false);
    };
    const onOpen = () => setOpen(true);
    document.addEventListener("keydown", onKey);
    window.addEventListener("senseforge:command", onOpen);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("senseforge:command", onOpen);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setIndex(0);
      window.setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [open]);

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pageItems = pages.map((page) => ({ ...page, kind: "Halaman" }));
    const machineItems = machines.map((machine) => ({
      label: machine.name,
      description: `${machine.id} · ${machine.line} · ${machine.location}`,
      href: `/machines/${machine.id}`,
      icon: Factory,
      kind: "Mesin",
    }));
    const all = [...pageItems, ...machineItems];
    if (!q) return all.slice(0, 9);
    return all
      .filter(
        (item) =>
          item.label.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.kind.toLowerCase().includes(q),
      )
      .slice(0, 9);
  }, [query, machines]);

  useEffect(() => {
    setIndex(0);
  }, [query]);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[110] flex items-start justify-center px-4 pt-[10vh] sm:pt-[14vh]">
          <motion.button
            type="button"
            aria-label="Tutup pencarian"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="drawer-backdrop absolute inset-0 h-full w-full cursor-default"
          />
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.985 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="panel relative z-10 w-full max-w-[560px] overflow-hidden p-0"
          >
            <div className="flex items-center gap-3 border-b border-line px-4 py-3.5">
              <Search className="size-4 shrink-0 text-teal" />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "ArrowDown") {
                    event.preventDefault();
                    setIndex((value) => Math.min(items.length - 1, value + 1));
                  }
                  if (event.key === "ArrowUp") {
                    event.preventDefault();
                    setIndex((value) => Math.max(0, value - 1));
                  }
                  if (event.key === "Enter" && items[index]) {
                    go(items[index].href);
                  }
                }}
                placeholder="Cari halaman atau equipment (EQ-001)…"
                className="min-w-0 flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-ink-muted"
              />
              <kbd className="rounded-md border border-line bg-surface-2 px-1.5 py-0.5 font-mono text-[9px] text-ink-muted">
                ESC
              </kbd>
            </div>
            <div className="max-h-[360px] overflow-y-auto p-1.5">
              {items.length ? (
                items.map((item, itemIndex) => {
                  const Icon = item.icon;
                  const active = itemIndex === index;
                  return (
                    <button
                      key={`${item.kind}-${item.href}`}
                      type="button"
                      onMouseEnter={() => setIndex(itemIndex)}
                      onClick={() => go(item.href)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                        active ? "bg-teal/10" : "hover:bg-surface-2/60",
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-lg border",
                          active
                            ? "border-teal/25 bg-teal/10 text-teal"
                            : "border-line bg-surface-2 text-ink-muted",
                        )}
                      >
                        <Icon className="size-3.5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[12px] font-semibold text-ink">
                          {item.label}
                        </span>
                        <span className="block truncate text-[10.5px] text-ink-muted">
                          {item.description}
                        </span>
                      </span>
                      <span className="font-mono text-[8px] tracking-wider text-ink-muted uppercase">
                        {item.kind}
                      </span>
                      <ArrowRight
                        className={cn(
                          "size-3.5 shrink-0 transition",
                          active ? "text-teal" : "text-ink-muted/40",
                        )}
                      />
                    </button>
                  );
                })
              ) : (
                <div className="px-4 py-10 text-center">
                  <p className="text-[12px] font-medium text-ink">Tidak ada hasil</p>
                  <p className="mt-1 text-[11px] text-ink-muted">
                    Coba kata kunci lain seperti “EQ-001” atau “sensor”.
                  </p>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between border-t border-line px-4 py-2.5 text-[9px] text-ink-muted">
              <span className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-line bg-surface-2 px-1 font-mono">↑</kbd>
                  <kbd className="rounded border border-line bg-surface-2 px-1 font-mono">↓</kbd>
                  navigasi
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-line bg-surface-2 px-1 font-mono">↵</kbd>
                  buka
                </span>
              </span>
              <span className="font-mono tracking-[0.14em] uppercase">SenseForge</span>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
