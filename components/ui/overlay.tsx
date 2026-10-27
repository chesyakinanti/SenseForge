"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMounted } from "@/lib/hooks";
import { IconButton } from "@/components/ui/button";

function OverlayPortal({ children }: { children: React.ReactNode }) {
  const mounted = useMounted();
  if (!mounted) return null;
  return createPortal(children, document.body);
}

function useLockBody(open: boolean) {
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}) {
  useLockBody(open);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <OverlayPortal>
      <AnimatePresence>
        {open ? (
          <div className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-6">
            <motion.button
              type="button"
              aria-label="Tutup dialog"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="drawer-backdrop absolute inset-0 h-full w-full cursor-default"
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={title}
              initial={{ opacity: 0, y: 28, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                "panel relative z-10 flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-b-none sm:rounded-2xl",
                className,
              )}
            >
              <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
                <div>
                  <h2 className="text-[15px] font-bold tracking-tight text-ink">{title}</h2>
                  {description ? (
                    <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">
                      {description}
                    </p>
                  ) : null}
                </div>
                <IconButton onClick={onClose} aria-label="Tutup" className="size-8">
                  <X className="size-4" />
                </IconButton>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>
              {footer ? (
                <div className="flex items-center justify-end gap-2 border-t border-line bg-surface-2/30 px-5 py-3.5">
                  {footer}
                </div>
              ) : null}
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
    </OverlayPortal>
  );
}

export function Drawer({
  open,
  onClose,
  title,
  eyebrow,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  useLockBody(open);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <OverlayPortal>
      <AnimatePresence>
        {open ? (
          <div className="fixed inset-0 z-[100]">
            <motion.button
              type="button"
              aria-label="Tutup detail"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="drawer-backdrop absolute inset-0 h-full w-full cursor-default"
            />
            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-label={title}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
              className="panel absolute inset-y-0 right-0 flex w-full max-w-[460px] flex-col rounded-none border-y-0 border-r-0"
            >
              <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
                <div>
                  {eyebrow ? <div className="mono-label text-teal/90">{eyebrow}</div> : null}
                  <h2 className="mt-1 text-[17px] font-bold tracking-tight text-ink">{title}</h2>
                </div>
                <IconButton onClick={onClose} aria-label="Tutup" className="size-8">
                  <X className="size-4" />
                </IconButton>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>
              {footer ? (
                <div className="border-t border-line bg-surface-2/30 px-5 py-3.5">{footer}</div>
              ) : null}
            </motion.aside>
          </div>
        ) : null}
      </AnimatePresence>
    </OverlayPortal>
  );
}
