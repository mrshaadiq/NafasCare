import { useNavigate } from "react-router-dom";
import { PrimaryButton, Screen } from "../components/ui";
import { ICON } from "../components/icons";

export default function Opening() {
  const navigate = useNavigate();

  return (
    <Screen>
      <div className="relative flex min-h-dvh flex-1 flex-col overflow-hidden bg-[linear-gradient(117.8deg,#87ceeb_6%,#d8eff7_60%,#fffaf0_94%)] px-6 py-6">
        <div className="flex items-center gap-2.5">
          <span className="grid size-13 place-items-center rounded-2xl bg-white shadow-[0_12px_15px_rgba(70,130,180,0.22)]">
            <img src={ICON.brandMark} alt="" className="size-8.5 object-cover" />
          </span>
          <span className="text-lg font-black tracking-[-0.4px] text-ink">NapasCare</span>
        </div>

        <main className="flex flex-1 flex-col justify-center pb-24">
          <span className="w-fit rounded-full border border-[rgba(70,130,180,0.28)] bg-sky/25 px-2.5 py-1 text-[11.5px] font-extrabold uppercase tracking-[0.4px] text-deep">
            Prototipe hackathon
          </span>
          <h1 className="mt-5 font-hand text-[44px] font-bold leading-[46px] tracking-[-2px] text-ink">
            Pahami keluhan napas Anda, satu langkah pada satu waktu.
          </h1>
          <p className="mt-4 text-[16.8px] leading-7 text-muted">
            NapasCare membantu analisis awal, mencatat perubahan gejala, dan mengatur instruksi setelah konsultasi.
          </p>
          <PrimaryButton className="mt-8 w-fit min-w-44" onClick={() => navigate("/beranda")}>
            Lihat prototipe
          </PrimaryButton>
          <p className="mt-5 text-xs text-[#7890a8]">Prototipe demonstrasi, bukan pengganti tenaga medis.</p>
        </main>

        <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 -right-20 size-72 rounded-full border border-steel/20">
          <div className="absolute inset-9 rounded-full border border-steel/20" />
          <div className="absolute inset-[60px] rounded-full border border-steel/25 bg-cream/55" />
        </div>
      </div>
    </Screen>
  );
}
