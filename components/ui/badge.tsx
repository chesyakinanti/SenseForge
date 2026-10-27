import { cn } from "@/lib/utils";

export type BadgeTone =
  | "teal"
  | "green"
  | "amber"
  | "red"
  | "steel"
  | "violet"
  | "neutral";

const tones: Record<BadgeTone, string> = {
  teal: "border-teal/25 bg-teal/10 text-teal",
  green: "border-emerald-500/25 bg-emerald-500/10 text-emerald-500 dark:text-emerald-400",
  amber: "border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  red: "border-red-500/25 bg-red-500/10 text-red-600 dark:text-red-400",
  steel: "border-line-strong bg-surface-2 text-ink-soft",
  violet:
    "border-violet-500/25 bg-violet-500/10 text-violet-600 dark:text-violet-400",
  neutral: "border-line bg-surface-2/60 text-ink-muted",
};

export function Badge({
  tone = "steel",
  dot = false,
  pulse = false,
  className,
  children,
}: {
  tone?: BadgeTone;
  dot?: boolean;
  pulse?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-wide whitespace-nowrap",
        tones[tone],
        className,
      )}
    >
      {dot ? (
        <span className="relative flex size-1.5">
          {pulse ? (
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-current opacity-60" />
          ) : null}
          <span className="relative inline-flex size-1.5 rounded-full bg-current" />
        </span>
      ) : null}
      {children}
    </span>
  );
}

const statusTones: Record<string, BadgeTone> = {
  normal: "green",
  warning: "amber",
  critical: "red",
  maintenance: "steel",
  info: "teal",
  open: "red",
  reviewing: "amber",
  resolved: "green",
  completed: "green",
  "in-progress": "amber",
  scheduled: "steel",
};

const statusLabels: Record<string, string> = {
  normal: "Normal",
  warning: "Perhatian",
  critical: "Kritis",
  maintenance: "Maintenance",
  info: "Info",
  open: "Terbuka",
  reviewing: "Ditinjau",
  resolved: "Selesai",
  completed: "Selesai",
  "in-progress": "Berjalan",
  scheduled: "Terjadwal",
};

export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  return (
    <Badge
      tone={statusTones[status] ?? "steel"}
      dot
      pulse={status === "critical" || status === "in-progress"}
      className={className}
    >
      {statusLabels[status] ?? status}
    </Badge>
  );
}
