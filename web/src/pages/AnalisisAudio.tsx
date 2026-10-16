import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, ClinicalNote, GhostButton, PageHeading, Screen, SecondaryButton, StepHeader } from "../components/ui";
import { ICON } from "../components/icons";

const panduan = ["Pilih ruang yang tenang.", "Letakkan perangkat dekat dada.", "Tarik napas dalam 3 kali."];

export default function AnalisisAudio() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <Screen>
      <StepHeader label="Analisis awal" step={4} total={4} />

      <main className="flex flex-1 flex-col gap-4 px-[17.6px] pb-28 pt-9">
        <PageHeading eyebrow="Analisis suara napas (eksperimen)" title="Tambahkan rekaman napas?">
          Pilihan ini tidak wajib dan tidak mengubah pemeriksaan tanda bahaya.
        </PageHeading>

        <Card className="mt-5 flex items-start gap-4">
          <span className="grid size-16 shrink-0 place-items-center rounded-full border border-[rgba(100,221,218,0.2)] bg-[rgba(100,221,218,0.08)]">
            <img src={ICON.mic} alt="" className="size-7.5" />
          </span>
          <div className="flex flex-col gap-2.5">
            <h2 className="font-hand text-lg font-bold text-ink">Fitur eksperimen</h2>
            <p className="text-base leading-[26px] text-muted">
              Fitur ini hanya mengenali pola suara seperti mengi atau kerikil/crackle. Hasil bukan diagnosis dan tidak
              dapat membuktikan keadaan tubuh Anda.
            </p>
          </div>
        </Card>

        <Card className="flex flex-col gap-4">
          <h2 className="font-hand text-lg font-bold text-ink">Panduan rekam</h2>
          <ol className="flex flex-col gap-3">
            {panduan.map((teks, index) => (
              <li key={teks} className="flex items-center gap-3 text-base text-ink">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-steel text-xs font-extrabold text-white">
                  {index + 1}
                </span>
                {teks}
              </li>
            ))}
          </ol>
        </Card>

        <div className="flex flex-col gap-3">
          <SecondaryButton onClick={() => inputRef.current?.click()}>
            <img src={ICON.upload} alt="" className="size-5" />
            Unggah rekaman
          </SecondaryButton>
          <input
            ref={inputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) navigate("/audio/berhasil");
            }}
          />
          <SecondaryButton onClick={() => navigate("/audio/berhasil")}>
            <img src={ICON.micSmall} alt="" className="size-5" />
            Gunakan sampel riset (demo)
          </SecondaryButton>
        </div>

        <p className="flex items-center justify-center gap-2 text-xs text-muted">
          <img src={ICON.docSmall} alt="" className="size-5" />
          Sampel riset berlabel: ICBHI 2017
        </p>

        <GhostButton onClick={() => navigate("/hasil/konsultasi")}>Lewati, lanjut tanpa audio</GhostButton>

        <ClinicalNote />
      </main>
    </Screen>
  );
}
