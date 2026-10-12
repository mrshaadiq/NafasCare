import type { ReactNode } from "react";
import { Link } from "react-router-dom";

export function SimulasiBanner() {
  return (
    <div className="bg-amber-100 border-b border-amber-300 text-amber-900 text-sm text-center py-2 px-4">
      <strong>SIMULASI.</strong> Data demo dan sintetis. Jangan isi data pribadi atau rekam medis asli.
    </div>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <SimulasiBanner />
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <Link to="/" className="font-semibold text-indigo-900">
          NapasCare
        </Link>
        <nav className="flex gap-4 text-sm">
          <Link to="/skrining" className="hover:underline">Skrining</Link>
          <Link to="/instruksi" className="hover:underline">Instruksi</Link>
          <Link to="/catatan" className="hover:underline">Catatan</Link>
          <Link to="/ringkasan" className="hover:underline">Ringkasan</Link>
        </nav>
      </header>
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}

export function Notice({ tone, children }: { tone: "info" | "error" | "ok"; children: ReactNode }) {
  const cls =
    tone === "error"
      ? "bg-red-50 border-red-300 text-red-900"
      : tone === "ok"
        ? "bg-emerald-50 border-emerald-300 text-emerald-900"
        : "bg-slate-100 border-slate-300 text-slate-800";
  return <div className={`border rounded-lg p-3 text-sm ${cls}`} role={tone === "error" ? "alert" : "status"}>{children}</div>;
}

export const btn =
  "inline-flex items-center justify-center rounded-lg bg-indigo-700 px-4 py-2 text-white font-medium hover:bg-indigo-800 disabled:opacity-50";
export const btnGhost =
  "inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2 font-medium hover:bg-slate-100 disabled:opacity-50";
export const field = "w-full rounded-lg border border-slate-300 px-3 py-2 bg-white";
