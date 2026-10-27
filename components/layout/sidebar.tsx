"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { motion } from "motion/react";
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  DatabaseZap,
  Factory,
  LayoutDashboard,
  Settings,
  Server,
  ShieldAlert,
  Wrench,
  X,
} from "lucide-react";
import { BrandLockup } from "@/components/layout/brand";
import { api } from "@/lib/api";
import { useAsyncData } from "@/lib/hooks";
import { cn, formatNumber } from "@/lib/utils";

export function Sidebar({
  collapsed,
  onToggle,
  mobileOpen,
  onMobileClose,
}: {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}) {
  const pathname = usePathname();
  const { data: dashboardData, error } = useAsyncData(() => api.getDashboard(), []);

  useEffect(() => {
    onMobileClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  const anomalyBadge = dashboardData
    ? formatNumber(dashboardData.summary.totalAnomalies)
    : undefined;

  const navGroups = [
    {
      label: "Workspace",
      items: [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/machines", label: "Machines", icon: Factory },
      ],
    },
    {
      label: "Monitoring",
      items: [
        { href: "/sensors", label: "Sensor Data", icon: Activity },
        { href: "/anomalies", label: "Anomaly Detection", icon: ShieldAlert, badge: anomalyBadge },
      ],
    },
    {
      label: "Operations",
      items: [
        { href: "/maintenance", label: "Maintenance Log", icon: Wrench },
        { href: "/processing", label: "Processing", icon: DatabaseZap },
        { href: "/backend", label: "Backend API", icon: Server },
      ],
    },
    {
      label: "General",
      items: [{ href: "/settings", label: "Settings", icon: Settings }],
    },
  ];

  return (
    <>
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Tutup navigasi"
          onClick={onMobileClose}
          className="drawer-backdrop fixed inset-0 z-40 lg:hidden"
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-line bg-[var(--sidebar)] transition-[width,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          collapsed ? "w-[88px]" : "w-[272px]",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div
          className={cn(
            "flex h-[72px] shrink-0 items-center border-b border-line",
            collapsed ? "justify-center px-3" : "justify-between px-5",
          )}
        >
          <Link
            href="/dashboard"
            className="flex min-w-0 items-center"
            aria-label="SenseForge Dashboard"
          >
            <BrandLockup collapsed={collapsed} />
          </Link>
          {!collapsed ? (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onToggle}
                className="hidden size-7 items-center justify-center rounded-lg text-ink-muted transition hover:bg-surface-2 hover:text-ink lg:flex"
                aria-label="Ciutkan sidebar"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                type="button"
                onClick={onMobileClose}
                className="flex size-7 items-center justify-center rounded-lg text-ink-muted transition hover:bg-surface-2 hover:text-ink lg:hidden"
                aria-label="Tutup navigasi"
              >
                <X className="size-4" />
              </button>
            </div>
          ) : null}
        </div>

        {collapsed ? (
          <div className="flex justify-center py-3">
            <button
              type="button"
              onClick={onToggle}
              className="hidden size-8 items-center justify-center rounded-lg border border-line text-ink-muted transition hover:border-teal/40 hover:text-teal lg:flex"
              aria-label="Buka sidebar"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        ) : null}

        <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
          {navGroups.map((group) => (
            <div key={group.label} className="mb-4 last:mb-0">
              {!collapsed ? (
                <div className="mb-1.5 px-3 font-mono text-[8px] tracking-[0.2em] text-ink-muted/80 uppercase">
                  {group.label}
                </div>
              ) : (
                <div className="mx-auto mb-2 h-px w-6 bg-line" />
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isActive(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        "group relative flex h-10 items-center rounded-xl text-[12.5px] font-medium transition-colors duration-200",
                        collapsed ? "justify-center px-0" : "gap-3 px-3",
                        active
                          ? "text-teal"
                          : "text-ink-soft hover:bg-surface-2/60 hover:text-ink",
                      )}
                    >
                      {active ? (
                        <motion.span
                          layoutId="sidebar-active"
                          className="absolute inset-0 rounded-xl border border-teal/20 bg-teal/10"
                          transition={{ type: "spring", stiffness: 380, damping: 32 }}
                        />
                      ) : null}
                      {active ? (
                        <span className="absolute top-1/2 left-0 h-5 w-0.5 -translate-y-1/2 rounded-full bg-teal shadow-[0_0_10px_2px_rgba(25,169,154,0.55)]" />
                      ) : null}
                      <Icon
                        className={cn(
                          "relative size-[17px] shrink-0 transition-transform duration-200 group-hover:scale-105",
                          active ? "text-teal" : "text-ink-muted",
                        )}
                        strokeWidth={1.8}
                      />
                      {!collapsed ? (
                        <>
                          <span className="relative truncate">{item.label}</span>
                          {item.badge ? (
                            <span className="relative ml-auto rounded-md border border-amber-500/20 bg-amber-500/10 px-1.5 py-0.5 font-mono text-[9px] font-medium text-amber-600 dark:text-amber-400">
                              {item.badge}
                            </span>
                          ) : null}
                        </>
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className={cn("shrink-0 border-t border-line p-3", collapsed && "px-2")}>
          {!collapsed ? (
            <div className="rounded-xl border border-line bg-surface-2/45 p-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[8px] tracking-[0.18em] text-ink-muted uppercase">
                  {error ? "Backend offline" : "FastAPI · MongoDB"}
                </span>
                <span className="relative flex size-1.5">
                  <span
                    className={cn(
                      "animate-pulse-ring absolute inline-flex size-full rounded-full",
                      error ? "bg-amber-500" : "bg-emerald-500",
                    )}
                  />
                  <span
                    className={cn(
                      "relative inline-flex size-1.5 rounded-full",
                      error ? "bg-amber-500" : "bg-emerald-500",
                    )}
                  />
                </span>
              </div>
              <p className="mt-1.5 text-[11px] font-medium text-ink-soft">
                {dashboardData
                  ? `${dashboardData.summary.totalMachines} equipment · ${formatNumber(dashboardData.summary.totalAnomalies)} anomali`
                  : error
                    ? "Menunggu koneksi API"
                    : "Memuat telemetri…"}
              </p>
              <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-surface-3">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-teal/60 to-teal"
                  style={{ width: dashboardData ? `${dashboardData.summary.healthAvg}%` : "0%" }}
                />
              </div>
            </div>
          ) : (
            <div className="flex justify-center py-1">
              <span className="relative flex size-2">
                <span
                  className={cn(
                    "animate-pulse-ring absolute inline-flex size-full rounded-full",
                    error ? "bg-amber-500" : "bg-emerald-500",
                  )}
                />
                <span
                  className={cn(
                    "relative inline-flex size-2 rounded-full",
                    error ? "bg-amber-500" : "bg-emerald-500",
                  )}
                />
              </span>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
