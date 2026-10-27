"use client";

import { flushSync } from "react-dom";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useMounted } from "@/lib/hooks";
import { cn } from "@/lib/utils";

type ViewTransitionDocument = Document & {
  startViewTransition?: (callback: () => void) => { ready: Promise<void> };
};

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();
  const isDark = resolvedTheme === "dark";
  const label = mounted
    ? isDark
      ? "Aktifkan mode terang"
      : "Aktifkan mode gelap"
    : "Ganti tema";

  const toggle = (event: React.MouseEvent<HTMLButtonElement>) => {
    const next = isDark ? "light" : "dark";
    const doc = document as ViewTransitionDocument;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!doc.startViewTransition || reduced) {
      setTheme(next);
      return;
    }

    const x = event.clientX;
    const y = event.clientY;
    const radius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    );

    const transition = doc.startViewTransition(() => {
      flushSync(() => setTheme(next));
    });

    transition.ready.then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${radius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 560,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          pseudoElement: "::view-transition-new(root)",
        },
      );
    });
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={mounted ? (isDark ? "Mode terang" : "Mode gelap") : "Ganti tema"}
      className={cn(
        "group relative inline-flex size-9 items-center justify-center overflow-hidden rounded-xl border border-line bg-surface-2/40 text-ink-soft transition-all duration-200 hover:border-teal/40 hover:text-teal",
        className,
      )}
    >
      {mounted ? (
        <>
          <Sun
            className={cn(
              "absolute size-4 transition-all duration-300",
              isDark
                ? "translate-y-5 rotate-90 opacity-0"
                : "translate-y-0 rotate-0 opacity-100",
            )}
          />
          <Moon
            className={cn(
              "absolute size-4 transition-all duration-300",
              isDark
                ? "translate-y-0 rotate-0 opacity-100"
                : "-translate-y-5 -rotate-90 opacity-0",
            )}
          />
        </>
      ) : (
        <span className="size-4" />
      )}
    </button>
  );
}
