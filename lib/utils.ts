import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const DEMO_NOW = new Date("2026-10-26T14:32:18+07:00");

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

const numberFormatter = new Intl.NumberFormat("id-ID");
const decimalFormatter = new Intl.NumberFormat("id-ID", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export function formatNumber(value: number, decimals = 0) {
  return decimals > 0
    ? new Intl.NumberFormat("id-ID", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(value)
    : numberFormatter.format(value);
}

export function formatCompact(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} jt`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)} rb`;
  return formatNumber(value);
}

export function formatDecimal(value: number, decimals = 1) {
  if (decimals === 1) return decimalFormatter.format(value);
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatTime(iso: string | Date) {
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(new Date(iso));
}

export function formatDate(iso: string | Date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date(iso));
}

export function formatDateShort(iso: string | Date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(iso));
}

export function formatDateTime(iso: string | Date) {
  return `${formatDateShort(iso)} · ${formatTime(iso)}`;
}

export function formatFullDateTime(iso: string | Date) {
  return `${formatDate(iso)} · ${formatTime(iso)} WIB`;
}

export function formatRelative(iso: string | Date, base: Date = new Date()) {
  const target = new Date(iso);
  const diff = base.getTime() - target.getTime();
  if (!Number.isFinite(diff)) return "-";
  if (diff < 0) return formatDateTime(target);
  const minutes = Math.max(1, Math.round(diff / 60000));
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.round(hours / 24);
  if (days > 30) return formatDateTime(target);
  return `${days} hari lalu`;
}

export function percent(value: number) {
  return `${formatDecimal(value)}%`;
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function downloadCsv(filename: string, rows: (string | number)[][]) {
  const content = rows
    .map((row) =>
      row
        .map((cell) => {
          const value = String(cell ?? "");
          return value.includes(",") || value.includes('"')
            ? `"${value.replaceAll('"', '""')}"`
            : value;
        })
        .join(","),
    )
    .join("\n");
  const blob = new Blob([`\uFEFF${content}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function seededRandom(seed: number) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(value: string) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
