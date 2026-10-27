import Link from "next/link";
import { BrandSymbol } from "@/components/layout/brand";

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 text-center">
      <div className="grid-backdrop" />
      <div className="relative z-10">
        <div className="flex justify-center">
          <BrandSymbol className="size-14 rounded-2xl" />
        </div>
        <p className="mono-label mt-6 text-teal">Error 404</p>
        <h1 className="mt-3 text-[40px] font-extrabold tracking-[-0.05em] text-ink">
          Halaman tidak ditemukan
        </h1>
        <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-ink-muted">
          Rute yang kamu buka tidak tersedia pada preview frontend SenseForge.
          Kembali ke dashboard untuk melanjutkan eksplorasi data demo.
        </p>
        <div className="mt-6 flex items-center justify-center gap-2">
          <Link
            href="/dashboard"
            className="inline-flex h-10 items-center justify-center rounded-xl border border-teal bg-teal px-4 text-[12px] font-bold text-[#032422] transition hover:bg-teal-bright"
          >
            Buka dashboard
          </Link>
          <Link
            href="/login"
            className="inline-flex h-10 items-center justify-center rounded-xl border border-line bg-surface-2/50 px-4 text-[12px] font-semibold text-ink-soft transition hover:border-teal/40 hover:text-teal"
          >
            Halaman login
          </Link>
        </div>
      </div>
    </main>
  );
}
