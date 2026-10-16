import { useLocation, useNavigate } from "react-router-dom";
import { DemoTag, Screen } from "../components/ui";
import { ICON } from "../components/icons";

const alasanDefault = ["Sesak berat saat istirahat"];

export default function ArahanDarurat() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { alasan?: string[] } | null;
  const alasan = state?.alasan?.length ? state.alasan : alasanDefault;

  return (
    <Screen dark>
      <div
        className="flex min-h-dvh flex-1 flex-col"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 120% 60% at 50% 0%, rgba(255,83,83,0.25), rgba(255,83,83,0) 60%), linear-gradient(90deg, #13090e, #13090e)",
        }}
      >
        <header className="flex h-20 items-center justify-between border-b border-[rgba(255,107,107,0.2)] px-5">
          <div className="flex items-center gap-2">
            <img src={ICON.logo} alt="" className="size-5 brightness-200" />
            <span className="font-hand text-base font-bold text-cream">NapasCare</span>
          </div>
          <DemoTag />
        </header>

        <main className="flex flex-1 flex-col items-center px-[17.6px] py-12 text-center">
          <span className="grid size-20 place-items-center rounded-full border border-[rgba(255,107,107,0.3)] bg-[rgba(255,107,107,0.12)]">
            <img src={ICON.alertLarge} alt="" className="size-10" />
          </span>

          <span className="mt-5 rounded-full border border-[rgba(255,107,107,0.28)] bg-[rgba(255,107,107,0.12)] px-3 py-1 text-[11.5px] font-extrabold uppercase tracking-[0.4px] text-[#ffb4b4]">
            Perlu tindakan segera
          </span>

          <h1 className="mt-5 font-hand text-[33px] font-bold leading-[36px] tracking-[-1.5px] text-cream">
            Informasi yang Anda berikan menunjukkan perlunya pertolongan medis segera.
          </h1>

          <p className="mt-5 max-w-[368px] text-base leading-[26px] text-[#a9b4bf]">
            Jangan lanjutkan rekaman atau analisis lain. Hubungi layanan medis setempat atau minta bantuan orang di dekat
            Anda.
          </p>

          <div className="mt-6 w-full rounded-[20px] bg-white p-4 text-left text-ink shadow-[0_10px_14px_rgba(0,0,0,0.25)]">
            <p className="text-base font-bold">Alasan arahan</p>
            <ul className="mt-2 flex flex-col gap-1 py-2 text-base text-muted">
              {alasan.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
            <p className="text-xs text-muted">Aturan simulasi NC-SIM-1.0</p>
          </div>

          <div className="mt-6 flex w-full flex-col gap-2.5">
            <a
              href="tel:112"
              className="flex items-center justify-center gap-2.5 rounded-[14.4px] bg-[#b84444] px-4 py-3.5 text-base font-bold text-cream"
            >
              <img src={ICON.alertSmall} alt="" className="size-5" />
              Hubungi layanan medis
            </a>
            <button
              type="button"
              onClick={() => navigate("/ringkasan")}
              className="rounded-[14.4px] border border-line bg-mist px-4 py-3.5 text-base font-bold text-ink"
            >
              Lihat ringkasan untuk dibawa
            </button>
          </div>

          <p className="mt-3 max-w-[368px] text-xs leading-5 text-[#7890a8]">
            Nomor layanan dapat berbeda menurut lokasi. Pastikan nomor yang berlaku di wilayah Anda.
          </p>
        </main>
      </div>
    </Screen>
  );
}
