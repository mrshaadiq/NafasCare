import { Link } from "react-router-dom";
import { btn, btnGhost } from "../components/ui";

export default function Home() {
  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-semibold text-indigo-900">Analisis awal keluhan pernapasan</h1>
        <p className="mt-2 text-slate-700">
          NapasCare membantu Anda menyiapkan informasi untuk konsultasi, memahami langkah awal, dan mencatat
          instruksi dokter. Ini bukan diagnosis dan bukan pengganti tenaga medis.
        </p>
      </section>

      <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-900 text-sm">
        <strong>Jika Anda sesak berat, nyeri dada, bibir atau wajah kebiruan, atau kesadaran menurun,</strong>{" "}
        segera cari pertolongan medis darurat. Jangan menunggu hasil aplikasi.
      </div>

      <div className="flex flex-wrap gap-3">
        <Link to="/skrining" className={btn}>Mulai analisis awal</Link>
        <Link to="/instruksi" className={btnGhost}>Masukkan instruksi dokter</Link>
      </div>
    </div>
  );
}
