import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BottomNav, Card, ClinicalNote, Field, inputClass, PageHeading, PrimaryButton, Screen, TopBar } from "../components/ui";
import { ICON } from "../components/icons";

const kolom = [
  { key: "nama", label: "Nama obat sesuai tulisan", placeholder: "Contoh demonstrasi: Obat A" },
  { key: "kekuatan", label: "Kekuatan sediaan", placeholder: "Contoh: tidak tersedia" },
  { key: "dosis", label: "Dosis dan satuan", placeholder: "Contoh: 1 tablet" },
  { key: "frekuensi", label: "Frekuensi", placeholder: "Contoh: 2 kali sehari" },
  { key: "waktu", label: "Waktu / hubungan dengan makan", placeholder: "Contoh: setelah makan" },
  { key: "durasi", label: "Durasi / tanggal akhir", placeholder: "Kosong jika tidak tertulis" },
] as const;

type Kunci = (typeof kolom)[number]["key"];

export default function SalinInstruksiPerawatan() {
  const navigate = useNavigate();
  const [nilai, setNilai] = useState<Record<Kunci | "aturan", string>>({
    nama: "",
    kekuatan: "",
    dosis: "",
    frekuensi: "",
    waktu: "",
    durasi: "",
    aturan: "",
  });

  const ubah = (key: Kunci | "aturan", value: string) => setNilai((prev) => ({ ...prev, [key]: value }));

  return (
    <Screen>
      <TopBar />

      <main className="flex flex-1 flex-col gap-5 px-[17.6px] pb-32 pt-9">
        <PageHeading eyebrow="Instruksi setelah konsultasi" title="Salin sesuai sumber">
          Semua kolom opsional. Bila tidak tertulis, biarkan kosong—NapasCare tidak akan menebaknya.
        </PageHeading>

        <div className="flex gap-3 rounded-2xl border border-[rgba(243,195,99,0.28)] bg-[rgba(243,195,99,0.07)] p-4">
          <img src={ICON.warningAmber} alt="" className="mt-0.5 size-5 shrink-0" />
          <div className="flex flex-col gap-1.5">
            <p className="text-base font-bold text-[#a56417]">Reminder belum aktif</p>
            <p className="text-base leading-[26px] text-muted">
              Periksa dan konfirmasi draf sebelum jadwal dapat dibuat.
            </p>
          </div>
        </div>

        <Card className="flex flex-col gap-4">
          {kolom.map((item) => (
            <Field key={item.key} label={item.label}>
              <input
                className={inputClass}
                placeholder={item.placeholder}
                value={nilai[item.key]}
                onChange={(e) => ubah(item.key, e.target.value)}
              />
            </Field>
          ))}
          <Field label="Aturan bila diperlukan">
            <textarea
              className={`${inputClass} min-h-22 resize-none`}
              placeholder="Salin apa adanya dari sumber"
              value={nilai.aturan}
              onChange={(e) => ubah("aturan", e.target.value)}
            />
          </Field>
          <PrimaryButton disabled={nilai.nama.trim() === ""} trailing={ICON.arrow} onClick={() => navigate("/instruksi/tinjau")}>
            Simpan sebagai draf
          </PrimaryButton>
        </Card>

        <Card className="flex flex-col gap-4">
          <span className="w-fit rounded-full border border-[rgba(70,130,180,0.28)] bg-sky/25 px-2.5 py-1 text-[11.5px] font-extrabold uppercase tracking-[0.4px] text-deep">
            Eksperimen
          </span>
          <div className="flex flex-col gap-2">
            <h2 className="font-hand text-lg font-bold text-ink">Unggah foto resep untuk draf OCR</h2>
            <p className="text-base leading-[26px] text-muted">
              Jika pembacaan gagal, gunakan formulir manual di atas. Hasil OCR tidak pernah mengaktifkan reminder otomatis.
            </p>
          </div>
          <button type="button" className="py-2 text-base font-bold text-[#2f7d32]" onClick={() => navigate("/instruksi/tinjau")}>
            Coba OCR demo
          </button>
        </Card>

        <ClinicalNote />
      </main>

      <BottomNav />
    </Screen>
  );
}
