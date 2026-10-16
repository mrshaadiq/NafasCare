import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BottomNav, Card, ClinicalNote, PageHeading, Screen, SecondaryButton, TopBar } from "../components/ui";
import { ICON } from "../components/icons";

export default function Pengaturan() {
  const navigate = useNavigate();
  const [dicabut, setDicabut] = useState(false);

  return (
    <Screen>
      <TopBar />

      <main className="flex flex-1 flex-col gap-5 px-[17.6px] pb-32 pt-9">
        <PageHeading eyebrow="Data dan privasi" title="Anda memegang kendali">
          Tinjau persetujuan, akses berbagi, dan permintaan penghapusan data demo.
        </PageHeading>

        <div className="flex flex-col gap-3">
          <Card className="flex flex-col gap-4">
            <div className="flex gap-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-[12.8px] border border-[rgba(100,221,218,0.18)] bg-[rgba(100,221,218,0.09)]">
                <img src={ICON.shield} alt="" className="size-5" />
              </span>
              <div className="flex flex-col gap-1">
                <h2 className="font-hand text-lg font-bold text-ink">Persetujuan penggunaan data</h2>
                <p className="text-base leading-[26px] text-muted">Tujuan: evaluasi prototipe · Versi NC-PRIV-1.0</p>
              </div>
            </div>
            {dicabut && (
              <span className="w-fit rounded-full border border-line bg-[rgba(112,128,144,0.1)] px-2.5 py-1 text-[11.5px] font-extrabold uppercase tracking-[0.4px] text-[#596978]">
                Dicabut
              </span>
            )}
            <SecondaryButton onClick={() => setDicabut((v) => !v)}>
              {dicabut ? "Pulihkan persetujuan" : "Cabut persetujuan"}
            </SecondaryButton>
          </Card>

          <Card className="flex flex-col gap-3">
            <div className="flex gap-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-[12.8px] border border-[rgba(100,221,218,0.18)] bg-[rgba(100,221,218,0.09)]">
                <img src={ICON.share} alt="" className="size-5" />
              </span>
              <div className="flex flex-col gap-1">
                <h2 className="font-hand text-lg font-bold text-ink">Akses berbagi</h2>
                <p className="text-base leading-[26px] text-muted">Tidak ada akses berbagi aktif.</p>
              </div>
            </div>
          </Card>

          <Card className="flex flex-col gap-4">
            <div className="flex gap-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-[12.8px] border border-[rgba(100,221,218,0.18)] bg-[rgba(100,221,218,0.09)]">
                <img src={ICON.doc} alt="" className="size-5" />
              </span>
              <div className="flex flex-col gap-1">
                <h2 className="font-hand text-lg font-bold text-ink">Retensi dan penghapusan</h2>
                <p className="text-base leading-[26px] text-muted">
                  Permintaan penghapusan akan dicatat untuk diproses. Pada sistem nyata, sebagian catatan dapat disimpan
                  sementara sesuai kewajiban operasional dan hukum.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate("/pengaturan/hapus-data")}
              className="rounded-[14.4px] bg-[#b84444] px-4 py-3.5 text-base font-bold text-cream"
            >
              Minta penghapusan data
            </button>
          </Card>
        </div>

        <p className="rounded-xl bg-white/50 p-4 text-[12.8px] leading-[21px] text-muted">
          Log prototipe tidak memuat resep, gejala lengkap, atau rekaman audio.
        </p>

        <ClinicalNote />
      </main>

      <BottomNav />
    </Screen>
  );
}
