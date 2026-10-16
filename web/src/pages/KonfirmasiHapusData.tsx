import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PrimaryButton, SecondaryButton } from "../components/ui";
import Pengaturan from "./Pengaturan";

const pilihan = ["Catat Gejala", "Instruksi dan Jadwal", "Rekaman Audio", "Semua"];

/** Lembar konfirmasi di atas halaman Pengaturan, sesuai artboard Figma. */
export default function KonfirmasiHapusData() {
  const navigate = useNavigate();
  const [dipilih, setDipilih] = useState<string[]>(["Catat Gejala"]);
  const [terkirim, setTerkirim] = useState(false);

  const toggle = (nama: string) =>
    setDipilih((prev) => (prev.includes(nama) ? prev.filter((p) => p !== nama) : [...prev, nama]));

  return (
    <div className="relative">
      <Pengaturan />

      <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink/40 p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="judul-hapus"
          className="flex w-full max-w-[367px] flex-col gap-4 rounded-t-3xl rounded-b-2xl border border-[rgba(70,130,180,0.17)] bg-white p-4 shadow-[0_-20px_60px_rgba(52,65,77,0.25)]"
        >
          <span className="mx-auto h-1 w-11 rounded-full bg-line" />
          <div className="flex flex-col gap-3 pt-2">
            <p className="text-xs font-extrabold uppercase tracking-[1.5px] text-steel">Permintaan penghapusan</p>
            <h1 id="judul-hapus" className="font-serif text-[30px] font-bold italic leading-9 text-ink">
              Data apa yang ingin dihapus?
            </h1>
          </div>

          {terkirim ? (
            <p className="text-base leading-[26px] text-muted">
              Permintaan tercatat. Sebagian data operasional dapat disimpan sementara sesuai ketentuan retensi.
            </p>
          ) : (
            <>
              <div className="flex flex-col gap-2.5">
                {pilihan.map((nama) => {
                  const aktif = dipilih.includes(nama);
                  return (
                    <button
                      key={nama}
                      type="button"
                      role="checkbox"
                      aria-checked={aktif}
                      onClick={() => toggle(nama)}
                      className={`flex min-h-14.5 items-center justify-between rounded-[13.6px] border px-4 py-3.5 text-left ${
                        aktif ? "border-steel bg-sky/25" : "border-line bg-paper"
                      }`}
                    >
                      <span className="text-base font-bold text-ink">{nama}</span>
                      <span
                        className={`grid size-6 place-items-center rounded-[11.6px] border text-xs font-bold ${
                          aktif ? "border-steel bg-steel text-white" : "border-line text-transparent"
                        }`}
                      >
                        ✓
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="text-base leading-[26px] text-muted">
                Sebagian data operasional dapat disimpan sementara sesuai ketentuan retensi.
              </p>
            </>
          )}

          <div className="flex flex-col gap-2.5">
            {terkirim ? (
              <PrimaryButton trailing={null} onClick={() => navigate("/pengaturan")}>
                Kembali ke pengaturan
              </PrimaryButton>
            ) : (
              <>
                <button
                  type="button"
                  disabled={dipilih.length === 0}
                  onClick={() => setTerkirim(true)}
                  className="flex w-full items-center justify-center rounded-[14.4px] bg-[#b84444] px-4 py-3.5 text-base font-bold text-cream disabled:opacity-40"
                >
                  Kirim permintaan
                </button>
                <SecondaryButton onClick={() => navigate(-1)}>Batal</SecondaryButton>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
