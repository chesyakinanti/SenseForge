"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Bell,
  ChevronDown,
  Command,
  LogOut,
  Menu,
  Search,
  Settings,
  UserRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { api } from "@/lib/api";
import { useAsyncData, useClickOutside, useClock } from "@/lib/hooks";
import { cn, formatRelative } from "@/lib/utils";

const titles: Record<string, string> = {
  dashboard: "Dashboard",
  machines: "Machines",
  sensors: "Sensor Data",
  anomalies: "Anomaly Detection",
  maintenance: "Maintenance Log",
  processing: "Processing & Benchmark",
  backend: "Backend API",
  settings: "Settings",
};

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const clock = useClock();
  const { data: notificationsData, error: notifError } = useAsyncData(
    () => api.getNotifications(),
    [],
  );
  const notifications = notificationsData ?? [];
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const closeNotif = useCallback(() => setNotifOpen(false), []);
  const closeProfile = useCallback(() => setProfileOpen(false), []);
  const notifRef = useClickOutside<HTMLDivElement>(closeNotif);
  const profileRef = useClickOutside<HTMLDivElement>(closeProfile);

  const segments = pathname.split("/").filter(Boolean);
  const isMachineDetail =
    segments[0] === "machines" && segments.length > 1;
  const currentTitle = isMachineDetail
    ? "Detail Mesin"
    : (titles[segments[0] ?? "dashboard"] ?? "Dashboard");

  const time = clock
    ? new Intl.DateTimeFormat("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZone: "Asia/Jakarta",
      }).format(clock)
    : "--:--:--";

  const logout = () => {
    localStorage.removeItem("senseforge.demo");
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-30 flex h-[68px] items-center justify-between gap-3 border-b border-line bg-background/75 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenu}
          className="flex size-9 items-center justify-center rounded-xl border border-line text-ink-soft transition hover:border-teal/40 hover:text-teal lg:hidden"
          aria-label="Buka navigasi"
        >
          <Menu className="size-4" />
        </button>
        <div className="hidden items-center gap-2 text-[11px] sm:flex">
          <Link
            href="/dashboard"
            className="font-mono text-[9px] tracking-[0.16em] text-ink-muted uppercase transition hover:text-teal"
          >
            SenseForge
          </Link>
          <span className="text-ink-muted/40">/</span>
          <span className="font-medium text-ink-soft">{currentTitle}</span>
        </div>
        <span className="truncate text-[13px] font-semibold text-ink sm:hidden">
          {currentTitle}
        </span>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event("senseforge:command"))}
          className="group hidden h-9 items-center gap-2 rounded-xl border border-line bg-surface-2/35 px-3 text-[11px] text-ink-muted transition hover:border-teal/35 hover:text-ink md:flex"
        >
          <Search className="size-3.5" />
          <span className="pr-6">Cari mesin, halaman…</span>
          <span className="flex items-center gap-0.5 rounded-md border border-line bg-surface px-1.5 py-0.5 font-mono text-[9px] text-ink-muted">
            <Command className="size-2.5" />K
          </span>
        </button>

        <div className="hidden font-mono text-[10px] tracking-wider text-ink-muted xl:flex xl:flex-col xl:items-end">
          <span className="text-[8px] tracking-[0.18em] uppercase">Waktu server</span>
          <span className="data-value text-[11px] text-ink-soft">{time} WIB</span>
        </div>

        <Badge
          tone={notifError ? "amber" : "teal"}
          dot
          pulse={!notifError}
          className="hidden lg:inline-flex"
        >
          {notifError ? "Backend offline" : "Backend aktif"}
        </Badge>

        <ThemeToggle />

        <div ref={notifRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setNotifOpen((value) => !value);
              setProfileOpen(false);
            }}
            className="relative flex size-9 items-center justify-center rounded-xl border border-line bg-surface-2/40 text-ink-soft transition hover:border-teal/40 hover:text-teal"
            aria-label="Notifikasi"
          >
            <Bell className="size-4" />
            {notifications.length > 0 ? (
              <span className="absolute top-2 right-2.5 size-1.5 rounded-full bg-amber-500 ring-2 ring-[var(--background)]" />
            ) : null}
          </button>
          <AnimatePresence>
            {notifOpen ? (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.98 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                className="panel absolute top-11 right-0 w-[320px] overflow-hidden p-1.5"
              >
                <div className="flex items-center justify-between px-2.5 py-2">
                  <span className="mono-label">Notifikasi Telemetri</span>
                  <span className="font-mono text-[9px] text-teal">
                    {notifications.length} terbaru
                  </span>
                </div>
                <div className="space-y-1">
                  {notifications.length > 0 ? (
                    notifications.map((item) => (
                      <Link
                        key={item.id}
                        href={item.href}
                        onClick={() => setNotifOpen(false)}
                        className="flex gap-2.5 rounded-xl px-2.5 py-2.5 transition hover:bg-surface-2/70"
                      >
                        <span
                          className={cn(
                            "mt-1 size-1.5 shrink-0 rounded-full",
                            item.tone === "critical"
                              ? "bg-red-500"
                              : item.tone === "warning"
                                ? "bg-amber-500"
                                : "bg-teal",
                          )}
                        />
                        <span className="min-w-0">
                          <span className="block text-[11.5px] font-semibold text-ink">
                            {item.title}
                          </span>
                          <span className="mt-0.5 block line-clamp-2 text-[10.5px] leading-relaxed text-ink-muted">
                            {item.description}
                          </span>
                          <span className="mt-1 block font-mono text-[8.5px] text-ink-muted">
                            {formatRelative(item.time)}
                          </span>
                        </span>
                      </Link>
                    ))
                  ) : (
                    <div className="px-3 py-4 text-center text-[11px] text-ink-muted">
                      {notifError
                        ? "Tidak dapat memuat notifikasi dari backend."
                        : "Belum ada notifikasi anomali."}
                    </div>
                  )}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        <div ref={profileRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setProfileOpen((value) => !value);
              setNotifOpen(false);
            }}
            className="flex h-9 items-center gap-2 rounded-xl border border-line bg-surface-2/40 pr-2 pl-1 transition hover:border-teal/40"
            aria-label="Menu profil"
          >
            <span className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-teal to-[#0d6e66] font-mono text-[10px] font-semibold text-[#032422]">
              SF
            </span>
            <span className="hidden text-left xl:block">
              <span className="block text-[10.5px] leading-tight font-semibold text-ink">
                Operator Telemetry
              </span>
              <span className="block font-mono text-[8px] leading-tight text-ink-muted">
                FASTAPI · MONGODB
              </span>
            </span>
            <ChevronDown className="hidden size-3 text-ink-muted xl:block" />
          </button>
          <AnimatePresence>
            {profileOpen ? (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.98 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                className="panel absolute top-11 right-0 w-[220px] overflow-hidden p-1.5"
              >
                <div className="border-b border-line px-2.5 py-2.5">
                  <p className="text-[12px] font-semibold text-ink">Operator Telemetry</p>
                  <p className="mt-0.5 font-mono text-[9px] text-ink-muted">
                    operator@senseforge.id
                  </p>
                </div>
                <div className="pt-1">
                  <Link
                    href="/settings"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[11.5px] text-ink-soft transition hover:bg-surface-2 hover:text-ink"
                  >
                    <UserRound className="size-3.5" /> Profil operator
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[11.5px] text-ink-soft transition hover:bg-surface-2 hover:text-ink"
                  >
                    <Settings className="size-3.5" /> Pengaturan
                  </Link>
                  <button
                    type="button"
                    onClick={logout}
                    className="mt-0.5 flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[11.5px] text-red-500 transition hover:bg-red-500/10"
                  >
                    <LogOut className="size-3.5" /> Keluar sesi
                  </button>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
