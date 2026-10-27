import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type ButtonSize = "sm" | "md" | "lg" | "icon";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-teal text-[#04201f] hover:bg-teal-bright shadow-[0_8px_24px_-12px_rgba(25,169,154,0.8)] border border-teal",
  secondary:
    "bg-surface-2/60 text-ink border border-line hover:border-teal/40 hover:bg-surface-2",
  ghost:
    "bg-transparent text-ink-soft hover:bg-surface-2 hover:text-ink border border-transparent",
  danger:
    "bg-danger/10 text-danger border border-danger/25 hover:bg-danger/15",
  outline:
    "bg-transparent text-ink border border-line-strong hover:border-teal/50 hover:text-teal",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-8 gap-1.5 rounded-lg px-3 text-[12px]",
  md: "h-10 gap-2 rounded-xl px-4 text-[13px]",
  lg: "h-11 gap-2 rounded-xl px-5 text-sm",
  icon: "size-10 rounded-xl",
};

export function Button({
  className,
  variant = "secondary",
  size = "md",
  ...props
}: React.ComponentProps<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  return (
    <button
      className={cn(
        "inline-flex shrink-0 items-center justify-center font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-45",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}

export function IconButton({
  className,
  ...props
}: React.ComponentProps<"button">) {
  return (
    <button
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-xl border border-line bg-surface-2/40 text-ink-soft transition-all duration-200 hover:border-teal/40 hover:bg-surface-2 hover:text-ink",
        className,
      )}
      {...props}
    />
  );
}
