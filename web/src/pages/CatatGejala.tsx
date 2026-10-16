import { useState } from "react";
import { BottomNav, Card, EmptyState, Field, inputClass, PageHeading, PrimaryButton, Screen, TopBar } from "../components/ui";

export default function CatatGejala() {
  const [gejala, setGejala] = useState("");
  const [tingkat, setTingkat] = useState(2);
  const [catatan, setCatatan] = useState("");
  const [riwayat, setRiwayat] = useState<{ gejala: string; tingkat: number; catatan: string }[]>([]);

  const simpan = () => {
    setRiwayat((prev) => [{ gejala: gejala.trim(), tingkat, catatan: catatan.trim() }, ...prev]);
    setGejala("");
    setCatatan("");
    setTingkat(2);
  };

  return (
    <Screen>
      <TopBar />

      <main className="flex flex-1 flex-col gap-6 px-[17.6px] pb-32 pt-9">
        <PageHeading eyebrow="Check-in singkat" title="Catat gejala hari ini">
          Catatan berasal dari laporan Anda dan tidak menjadi bukti kondisi klinis.
        </PageHeading>

        <Card className="flex flex-col gap-5">
          <Field label="Gejala hari ini" required>
            <textarea
              className={`${inputClass} min-h-22 resize-none`}
              placeholder="Apa yang Anda rasakan?"
              value={gejala}
              onChange={(e) => setGejala(e.target.value)}
            />
          </Field>

          <label className="flex flex-col gap-2">
            <span className="flex items-center gap-2 text-[12.8px] font-bold text-muted">
              Tingkat keluhan:
              <span className="text-[10.4px] font-black text-[#a56417]">{tingkat} dari 5</span>
            </span>
            <input
              type="range"
              min={1}
              max={5}
              value={tingkat}
              onChange={(e) => setTingkat(Number(e.target.value))}
              className="accent-steel"
            />
            <span className="flex justify-between text-[11.2px] font-bold text-muted">
              <span>Ringan</span>
              <span>Berat</span>
            </span>
          </label>

          <Field label="Catatan tambahan">
            <textarea
              className={`${inputClass} min-h-22 resize-none`}
              placeholder="Opsional"
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
            />
          </Field>

          <PrimaryButton disabled={gejala.trim() === ""} onClick={simpan}>
            Simpan catatan
          </PrimaryButton>
        </Card>

        <section className="flex flex-col gap-3">
          <h2 className="font-hand text-lg font-bold italic text-ink">Riwayat catatan</h2>
          {riwayat.length === 0 ? (
            <EmptyState title="Belum ada catatan">
              Catatan pertama Anda akan tampil di sini beserta tanggal dan sumbernya.
            </EmptyState>
          ) : (
            <ul className="flex flex-col gap-3">
              {riwayat.map((item, index) => (
                <li key={index}>
                  <Card className="flex flex-col gap-1.5">
                    <p className="text-base font-bold text-ink">{item.gejala}</p>
                    <p className="text-[12.8px] text-muted">Tingkat {item.tingkat} dari 5 · Sumber: input manual</p>
                    {item.catatan && <p className="text-base leading-[26px] text-muted">{item.catatan}</p>}
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      <BottomNav />
    </Screen>
  );
}
