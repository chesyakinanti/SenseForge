"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { BrandLockup } from "@/components/layout/brand";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Sparkline } from "@/components/charts/sparkline";
import { api } from "@/lib/api";
import { useAsyncData } from "@/lib/hooks";
import { SENSORS } from "@/lib/types";
import { formatDecimal, formatNumber } from "@/lib/utils";

const highlights = [
  "Empat parameter sensor dari MongoDB dalam satu pandangan",
  "Histori equipment dan temuan anomali RandomForest yang dapat ditelusuri",
  "Terintegrasi langsung dengan API FastAPI dan agregasi MongoDB",
];

export default function LoginPage() {
  const router = useRouter();
  const { data: dashboard } = useAsyncData(() => api.getDashboard(), []);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("operator@senseforge.id");
  const [password, setPassword] = useState("senseforge-telemetry");

  const previewSeries = dashboard?.trend ?? [];
  const latest = dashboard?.latest;
  const previewMachineId = dashboard?.trendMachine?.id ?? "EQ-001";

  const enterWorkspace = () => {
    if (loading) return;
    setLoading(true);
    localStorage.setItem("senseforge.demo", "1");
    window.setTimeout(() => router.push("/dashboard"), 420);
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <div className="grid-backdrop" />

      <div className="relative z-10 grid min-h-screen lg:grid-cols-[1.06fr_0.94fr]">
        <section className="relative hidden min-h-screen overflow-hidden bg-[#051923] lg:flex lg:flex-col lg:justify-between">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute top-[-18%] left-[-10%] size-[520px] rounded-full bg-teal/12 blur-[100px]" />
            <div className="absolute right-[-20%] bottom-[-15%] size-[520px] rounded-full bg-[#1c7f9c]/18 blur-[110px]" />
            <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(148,183,196,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(148,183,196,0.07)_1px,transparent_1px)] [background-size:52px_52px] [mask-image:radial-gradient(ellipse_80%_70%_at_40%_30%,#000_30%,transparent_100%)]" />
            <svg
              className="absolute right-0 bottom-0 left-0 h-[300px] w-full opacity-30"
              viewBox="0 0 800 300"
              fill="none"
              preserveAspectRatio="none"
            >
              {[0, 1, 2, 3, 4].map((line) => (
                <motion.path
                  key={line}
                  d={`M -20 ${120 + line * 26} C 120 ${60 + line * 22}, 210 ${210 - line * 8}, 350 ${145 + line * 18} S 620 ${90 + line * 30}, 840 ${150 + line * 20}`}
                  stroke="#19a99a"
                  strokeOpacity={0.14 + line * 0.04}
                  strokeWidth="1"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 2.4, delay: 0.2 + line * 0.12, ease: "easeOut" }}
                />
              ))}
            </svg>
          </div>

          <div className="relative flex items-center justify-between px-10 pt-9 xl:px-14">
            <div className="flex items-center gap-3">
              <span className="relative flex size-11 shrink-0 overflow-hidden rounded-[13px] border border-white/10 shadow-[0_12px_30px_-18px_rgba(0,0,0,0.9)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/Images/Logo darkmode.png"
                  alt=""
                  className="size-full object-cover"
                />
              </span>
              <span className="flex flex-col leading-none">
                <span className="text-[23px] font-extrabold tracking-[-0.045em] text-white">
                  Sense<span className="text-teal">Forge</span>
                </span>
                <span className="mt-1.5 font-mono text-[6.5px] font-medium tracking-[0.26em] text-white/40">
                  MONITOR. ANALYZE. OPTIMIZE.
                </span>
              </span>
            </div>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 font-mono text-[8.5px] tracking-[0.2em] text-white/50 uppercase">
              FastAPI · MongoDB · v1.0
            </span>
          </div>

          <div className="relative px-10 pb-8 xl:px-14">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-[520px]"
            >
              <div className="flex items-center gap-2.5">
                <span className="h-px w-7 bg-teal" />
                <span className="font-mono text-[9px] tracking-[0.22em] text-teal uppercase">
                  Smart CMMS · Industrial telemetry
                </span>
              </div>
              <h1 className="mt-4 text-[40px] leading-[1.06] font-extrabold tracking-[-0.045em] text-white xl:text-[48px]">
                Pusat kendali
                <br />
                <span className="text-gradient-teal">kondisi mesin.</span>
              </h1>
              <p className="mt-4 max-w-[430px] text-[13px] leading-relaxed text-white/55">
                Pantau suhu, getaran, daya, dan kebisingan mesin. Ubah data sensor
                menjadi keputusan perawatan yang lebih cepat dan terukur.
              </p>

              <ul className="mt-7 space-y-2.5">
                {highlights.map((item, index) => (
                  <motion.li
                    key={item}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35 + index * 0.08, duration: 0.4 }}
                    className="flex items-center gap-2.5 text-[12px] text-white/65"
                  >
                    <span className="flex size-4 items-center justify-center rounded-full border border-teal/30 bg-teal/10 text-teal">
                      <Check className="size-2.5" strokeWidth={3} />
                    </span>
                    {item}
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="mt-9 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] p-4 backdrop-blur-xl xl:p-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="relative flex size-1.5">
                    <span className="animate-pulse-ring absolute inline-flex size-full rounded-full bg-emerald-400" />
                    <span className="relative inline-flex size-1.5 rounded-full bg-emerald-400" />
                  </span>
                  <span className="font-mono text-[8.5px] tracking-[0.18em] text-white/45 uppercase">
                    Live telemetry · {previewMachineId}
                  </span>
                </div>
                <span className="font-mono text-[8.5px] text-white/35">
                  {dashboard ? `${formatNumber(dashboard.summary.totalRecords)} rekaman` : "Memuat backend…"}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-4 gap-3">
                {SENSORS.map((sensor) => (
                  <div key={sensor.key}>
                    <p className="truncate text-[9px] text-white/40">{sensor.short}</p>
                    <p className="data-value mt-1 text-[16px] font-medium text-white">
                      {latest ? formatDecimal(latest[sensor.key], sensor.decimals) : "—"}
                      <span className="ml-0.5 font-mono text-[8px] font-normal text-white/35">
                        {sensor.unit}
                      </span>
                    </p>
                  </div>
                ))}
              </div>
              {previewSeries.length > 0 ? (
                <div className="mt-3 h-16">
                  <Sparkline
                    values={previewSeries.map((point) => point.vibration)}
                    color="#2ad7c2"
                    height={64}
                    delay={0.6}
                  />
                </div>
              ) : null}
            </motion.div>
          </div>

          <div className="relative flex items-center justify-between border-t border-white/[0.06] px-10 py-4 xl:px-14">
            <span className="font-mono text-[8px] tracking-[0.18em] text-white/30 uppercase">
              Monitor. Analyze. Optimize.
            </span>
            <span className="font-mono text-[8px] text-white/25">
              Big Data 2 · FastAPI & MongoDB
            </span>
          </div>
        </section>

        <section className="relative flex min-h-screen flex-col bg-background/60">
          <div className="flex items-center justify-between px-5 py-5 sm:px-8">
            <div className="lg:hidden">
              <BrandLockup />
            </div>
            <div className="hidden lg:block" />
            <ThemeToggle />
          </div>

          <div className="flex flex-1 items-center justify-center px-5 pb-10 sm:px-8">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-[380px]"
            >
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-lg border border-teal/25 bg-teal/10 text-teal">
                  <Sparkles className="size-3.5" />
                </span>
                <span className="mono-label text-teal/90">Selamat datang</span>
              </div>
              <h2 className="mt-4 text-[30px] leading-tight font-extrabold tracking-[-0.04em] text-ink">
                Masuk ke command center.
              </h2>
              <p className="mt-2 text-[12.5px] leading-relaxed text-ink-muted">
                Akses dashboard telemetri, analitik MongoDB, dan evaluasi model RandomForest FastAPI.
              </p>

              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  enterWorkspace();
                }}
                className="mt-7 space-y-3.5"
              >
                <label className="block">
                  <span className="mono-label mb-1.5 block">Email</span>
                  <span className="relative block">
                    <Mail className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-ink-muted" />
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="surface-input h-11 pl-9"
                      placeholder="operator@senseforge.id"
                      autoComplete="email"
                    />
                  </span>
                </label>

                <label className="block">
                  <span className="mono-label mb-1.5 block">Password</span>
                  <span className="relative block">
                    <LockKeyhole className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-ink-muted" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="surface-input h-11 pr-10 pl-9"
                      placeholder="••••••••••"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-md p-1 text-ink-muted transition hover:text-ink"
                      aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                    >
                      {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                    </button>
                  </span>
                </label>

                <div className="flex items-center justify-between pt-0.5">
                  <label className="flex cursor-pointer items-center gap-2 text-[11px] text-ink-soft">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="size-3.5 rounded border-line accent-[#19a99a]"
                    />
                    Ingat sesi operator
                  </label>
                  <button
                    type="button"
                    className="text-[11px] font-medium text-teal transition hover:text-teal-bright"
                    onClick={enterWorkspace}
                  >
                    Lanjutkan langsung
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="group mt-2 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-teal bg-teal px-4 text-[13px] font-bold text-[#032422] shadow-[0_14px_34px_-16px_rgba(25,169,154,0.9)] transition-all duration-200 hover:bg-teal-bright disabled:opacity-70"
                >
                  {loading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Menyiapkan workspace…
                    </>
                  ) : (
                    <>
                      Masuk ke Dashboard
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-line bg-surface-2/35 px-3 py-2.5">
                <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-teal" />
                <p className="text-[10.5px] leading-relaxed text-ink-muted">
                  Seluruh angka pada dashboard terhubung langsung ke backend FastAPI,
                  dataset CSV, dan koleksi MongoDB <span className="font-mono">sensor_data</span>.
                </p>
              </div>

              <div className="mt-6 flex items-center justify-between font-mono text-[8.5px] tracking-[0.12em] text-ink-muted/70 uppercase">
                <span>© 2026 SenseForge</span>
                <span>Backend Connected</span>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </main>
  );
}
