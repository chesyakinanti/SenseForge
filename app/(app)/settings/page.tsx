"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Check,
  CircleUserRound,
  Database,
  LogOut,
  Monitor,
  Moon,
  Plug,
  RotateCcw,
  Save,
  Sun,
  UserRound,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { BrandSymbol } from "@/components/layout/brand";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Field, Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api";
import { API_BASE_URL, getBackendHealth } from "@/lib/backend";
import { useAsyncData, useMounted } from "@/lib/hooks";
import { cn, formatNumber } from "@/lib/utils";

const themes = [
  { value: "light", label: "Steel Lab", description: "Terang, bersih, presisi", icon: Sun },
  { value: "dark", label: "Forge Console", description: "Gelap, teknis, fokus", icon: Moon },
  { value: "system", label: "Ikuti sistem", description: "Mengikuti preferensi perangkat", icon: Monitor },
] as const;

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();
  const { push } = useToast();
  const router = useRouter();
  const { data: dashboard } = useAsyncData(() => api.getDashboard(), []);
  const { data: health, error: healthError, reload: reloadHealth } = useAsyncData(
    () => getBackendHealth(),
    [],
  );

  const [profile, setProfile] = useState({
    name: "Operator Telemetry",
    email: "operator@senseforge.id",
    role: "Operations / Telemetry",
  });
  const [apiUrl, setApiUrl] = useState(API_BASE_URL);
  const [defaultRange, setDefaultRange] = useState("24h");

  const saveProfile = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    push({
      tone: "success",
      title: "Profil operator diperbarui",
      description: "Perubahan tersimpan pada sesi browser ini.",
    });
  };

  const testApi = () => {
    api.clearCache();
    reloadHealth();
    push({
      tone: healthError ? "warning" : "success",
      title: healthError ? "Backend belum merespons" : "Koneksi FastAPI aktif",
      description: `Endpoint ${apiUrl} diperiksa.`,
    });
  };

  const reset = () => {
    localStorage.removeItem("senseforge.sidebar");
    api.clearCache();
    setTheme("dark");
    push({
      tone: "success",
      title: "Preferensi direset",
      description: "Sidebar, cache telemetri, dan tema kembali ke pengaturan awal.",
    });
  };

  const logout = () => {
    localStorage.removeItem("senseforge.demo");
    router.push("/login");
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Workspace preferences"
        title="Settings"
        description="Atur tampilan, profil operator, dan pantau integrasi API FastAPI & MongoDB."
        actions={
          <Badge tone={health?.status === "ok" ? "green" : "amber"} dot pulse={health?.status === "ok"}>
            {health?.status === "ok" ? "FastAPI Terhubung" : "FastAPI Offline"}
          </Badge>
        }
      />

      <div className="grid gap-4 xl:grid-cols-3">
        <section className="panel p-4 xl:col-span-2">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-lg border border-line bg-surface-2 text-teal">
              <Sun className="size-4" />
            </span>
            <div>
              <h2 className="text-[14px] font-bold tracking-[-0.02em] text-ink">Tema tampilan</h2>
              <p className="mt-0.5 text-[10.5px] text-ink-muted">
                Dua mode dengan karakter yang sama, bukan sekadar ganti warna.
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
            {themes.map((item) => {
              const Icon = item.icon;
              const active = mounted && theme === item.value;
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setTheme(item.value)}
                  className={cn(
                    "group rounded-xl border p-2.5 text-left transition-all duration-200",
                    active
                      ? "border-teal/45 bg-teal/[0.06] shadow-[0_0_0_1px_rgba(25,169,154,0.08)]"
                      : "border-line bg-surface-2/20 hover:border-teal/25",
                  )}
                >
                  <div
                    className={cn(
                      "relative h-[76px] overflow-hidden rounded-lg border",
                      item.value === "light"
                        ? "border-[#dce8ee] bg-[#f8fafc]"
                        : item.value === "dark"
                          ? "border-white/10 bg-[#081923]"
                          : "border-line bg-gradient-to-r from-[#f8fafc] via-[#e8eef2] to-[#081923]",
                    )}
                  >
                    <div
                      className={cn(
                        "absolute inset-y-0 left-0 w-7 border-r",
                        item.value === "light"
                          ? "border-[#dce8ee] bg-white"
                          : item.value === "dark"
                            ? "border-white/10 bg-[#0f2634]"
                            : "border-white/10 bg-gradient-to-b from-white/90 to-[#0f2634]",
                      )}
                    />
                    <div className="absolute top-2 right-2 left-9 space-y-1.5">
                      <div
                        className={cn(
                          "h-1.5 w-10 rounded-full",
                          item.value === "dark" ? "bg-white/20" : "bg-[#0b2333]/20",
                        )}
                      />
                      <div className="grid grid-cols-3 gap-1">
                        {[0, 1, 2].map((index) => (
                          <div
                            key={index}
                            className={cn(
                              "h-6 rounded border",
                              item.value === "dark"
                                ? "border-white/10 bg-white/[0.06]"
                                : "border-[#dce8ee] bg-white",
                            )}
                          >
                            <div className="mx-1 mt-1 h-1 w-3 rounded-full bg-teal/70" />
                            <div
                              className={cn(
                                "mx-1 mt-1 h-1 w-5 rounded-full",
                                item.value === "dark" ? "bg-white/15" : "bg-[#0b2333]/10",
                              )}
                            />
                          </div>
                        ))}
                      </div>
                      <div
                        className={cn(
                          "h-5 rounded border",
                          item.value === "dark"
                            ? "border-white/10 bg-white/[0.04]"
                            : "border-[#dce8ee] bg-white",
                        )}
                      />
                    </div>
                    {active ? (
                      <span className="absolute right-1.5 bottom-1.5 flex size-4 items-center justify-center rounded-full bg-teal text-[#032422]">
                        <Check className="size-2.5" strokeWidth={3} />
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-2 flex items-center gap-1.5">
                    <Icon className="size-3 text-ink-muted" />
                    <span className="text-[11px] font-semibold text-ink">{item.label}</span>
                  </div>
                  <p className="mt-0.5 text-[9px] text-ink-muted">{item.description}</p>
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex flex-col gap-2 border-t border-line pt-3.5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10.5px] font-medium text-ink-soft">Rentang default dashboard</p>
              <p className="mt-0.5 text-[9.5px] text-ink-muted">
                Pilihan awal saat membuka halaman dashboard.
              </p>
            </div>
            <Select
              value={defaultRange}
              onChange={(event) => setDefaultRange(event.target.value)}
              wrapperClassName="w-[160px]"
            >
              <option value="24h">24 jam</option>
              <option value="7d">7 hari</option>
              <option value="30d">30 hari</option>
            </Select>
          </div>
        </section>

        <section className="panel p-4">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-lg border border-line bg-surface-2 text-teal">
              <CircleUserRound className="size-4" />
            </span>
            <div>
              <h2 className="text-[14px] font-bold tracking-[-0.02em] text-ink">Profil operator</h2>
              <p className="mt-0.5 text-[10.5px] text-ink-muted">Identitas operator command center.</p>
            </div>
          </div>

          <form onSubmit={saveProfile} className="mt-4 space-y-3">
            <div className="flex items-center gap-3 rounded-xl border border-line bg-surface-2/30 p-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal to-[#0d6e66] font-mono text-[12px] font-semibold text-[#032422]">
                SF
              </span>
              <div>
                <p className="text-[11.5px] font-semibold text-ink">{profile.name}</p>
                <p className="font-mono text-[8.5px] text-ink-muted">{profile.role}</p>
              </div>
            </div>
            <Field label="Nama">
              <input
                value={profile.name}
                onChange={(event) => setProfile({ ...profile, name: event.target.value })}
                className="surface-input h-9"
              />
            </Field>
            <Field label="Email">
              <input
                type="email"
                value={profile.email}
                onChange={(event) => setProfile({ ...profile, email: event.target.value })}
                className="surface-input h-9"
              />
            </Field>
            <Field label="Peran">
              <input
                value={profile.role}
                onChange={(event) => setProfile({ ...profile, role: event.target.value })}
                className="surface-input h-9"
              />
            </Field>
            <Button variant="secondary" size="sm" type="submit" className="w-full">
              <Save className="size-3.5" /> Simpan profil
            </Button>
          </form>
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <section className="panel p-4 xl:col-span-2">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-lg border border-line bg-surface-2 text-teal">
              <Plug className="size-4" />
            </span>
            <div>
              <h2 className="text-[14px] font-bold tracking-[-0.02em] text-ink">
                Konfigurasi API FastAPI
              </h2>
              <p className="mt-0.5 text-[10.5px] text-ink-muted">
                Terhubung langsung ke server FastAPI dan koleksi MongoDB.
              </p>
            </div>
            <Badge
              tone={health?.status === "ok" ? "green" : "amber"}
              dot
              className="ml-auto"
            >
              {health?.status === "ok" ? "Backend aktif" : "Offline"}
            </Badge>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <Field label="API base URL" hint="Diatur melalui NEXT_PUBLIC_API_BASE_URL.">
              <input
                value={apiUrl}
                onChange={(event) => setApiUrl(event.target.value)}
                className="surface-input h-9 font-mono text-[11px]"
              />
            </Field>
            <Button variant="secondary" size="sm" onClick={testApi} className="h-9">
              <Save className="size-3.5" /> Cek koneksi
            </Button>
          </div>

          <div className="mt-4 space-y-2">
            {[
              { method: "GET", path: "/health", label: "Status kesehatan API & model" },
              { method: "GET", path: "/dataset/summary", label: "Ringkasan statistik data.csv" },
              { method: "GET", path: "/dataset/records", label: " Pembacaan sensor dari MongoDB" },
              { method: "GET", path: "/analytics/equipment", label: "Agregasi per equipment & mode" },
              { method: "GET", path: "/analytics/benchmark", label: "Benchmark agregasi MongoDB" },
              { method: "GET", path: "/model/muti/evaluation", label: "Evaluasi holdout kronologis" },
            ].map((endpoint) => (
              <div
                key={endpoint.path}
                className="flex items-center gap-2.5 rounded-lg border border-line bg-surface-2/25 px-2.5 py-2"
              >
                <span className="rounded border border-teal/20 bg-teal/10 px-1.5 py-0.5 font-mono text-[8px] font-medium text-teal">
                  {endpoint.method}
                </span>
                <span className="font-mono text-[9.5px] text-ink-soft">{endpoint.path}</span>
                <span className="ml-auto hidden text-[9px] text-ink-muted sm:block">
                  {endpoint.label}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[9.5px] leading-relaxed text-ink-muted">
            Semua halaman di aplikasi ini mengambil data secara real-time dari endpoint FastAPI di atas tanpa fallback data mock.
          </p>
        </section>

        <section className="panel flex flex-col p-4">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-lg border border-line bg-surface-2 text-teal">
              <Database className="size-4" />
            </span>
            <div>
              <h2 className="text-[14px] font-bold tracking-[-0.02em] text-ink">
                Data & koneksi database
              </h2>
              <p className="mt-0.5 text-[10.5px] text-ink-muted">
                Status koleksi MongoDB & dataset.
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-2.5">
            <div className="rounded-xl border border-line bg-surface-2/30 p-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-ink-muted">Sumber data</span>
                <Badge tone="teal">MongoDB · FastAPI</Badge>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[10px] text-ink-muted">Rekaman dataset</span>
                <span className="data-value text-[10.5px] text-ink-soft">
                  {dashboard ? formatNumber(dashboard.summary.totalRecords) : "-"}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[10px] text-ink-muted">MongoDB</span>
                <span className="font-mono text-[9px] text-ink-soft">
                  {health?.database_configured ? "Terkonfigurasi" : "Belum dikonfigurasi"}
                </span>
              </div>
            </div>

            <Button variant="secondary" size="sm" onClick={reset} className="w-full">
              <RotateCcw className="size-3.5" /> Reset cache & preferensi
            </Button>
            <Button variant="danger" size="sm" onClick={logout} className="w-full">
              <LogOut className="size-3.5" /> Keluar sesi
            </Button>
          </div>

          <div className="mt-auto border-t border-line pt-3">
            <div className="flex items-center gap-2.5">
              <BrandSymbol className="size-8 rounded-lg" />
              <div>
                <p className="text-[10.5px] font-semibold text-ink">SenseForge</p>
                <p className="font-mono text-[7.5px] tracking-[0.12em] text-ink-muted uppercase">
                  Monitor. Analyze. Optimize.
                </p>
              </div>
            </div>
            <p className="mt-2 text-[9px] leading-relaxed text-ink-muted">
              Sistem pemantauan telemetri industri Big Data 2 terintegrasi penuh dengan FastAPI dan MongoDB.
            </p>
          </div>
        </section>
      </div>

      <section className="panel flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-xl border border-line bg-surface-2 text-teal">
            <UserRound className="size-4" />
          </span>
          <div>
            <p className="text-[11.5px] font-semibold text-ink">Ganti operator?</p>
            <p className="mt-0.5 text-[10px] text-ink-muted">
              Kembali ke halaman login untuk mengganti sesi operator.
            </p>
          </div>
        </div>
        <Button variant="secondary" size="sm" onClick={logout}>
          <LogOut className="size-3.5" /> Kembali ke login
        </Button>
      </section>
    </div>
  );
}
