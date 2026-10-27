"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { StatusBar } from "@/components/layout/status-bar";
import { CommandPalette } from "@/components/layout/command-palette";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("senseforge.sidebar") === "1") {
      setCollapsed(true);
    }
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((value) => {
      localStorage.setItem("senseforge.sidebar", value ? "0" : "1");
      return !value;
    });
  };

  return (
    <div className="min-h-screen">
      <div className="grid-backdrop" />
      <Sidebar
        collapsed={collapsed}
        onToggle={toggleCollapsed}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div
        className={cn(
          "relative z-10 min-h-screen transition-[padding] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          collapsed ? "lg:pl-[88px]" : "lg:pl-[272px]",
        )}
      >
        <Topbar onMenu={() => setMobileOpen(true)} />
        <main className="mx-auto w-full max-w-[1500px] px-4 pt-5 pb-12 sm:px-6 lg:px-8 lg:pt-7">
          {children}
        </main>
      </div>
      <StatusBar collapsed={collapsed} />
      <CommandPalette />
    </div>
  );
}
