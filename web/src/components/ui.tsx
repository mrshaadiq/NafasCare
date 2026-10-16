import type { ButtonHTMLAttributes, ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { ICON } from "./icons";

/** Banner wajib untuk prototipe publik; tampil di setiap layar. */
export function SimulasiBanner() {
  return (
    <div role="note" className="border-b border-amber-300 bg-amber-100 px-4 py-2 text-center text-xs text-amber-900">
      <strong>SIMULASI.</strong> Data demo dan sintetis. Jangan isi data pribadi atau rekam medis asli.
    </div>
  );
}

/** Bingkai 400px seperti artboard Figma; di layar lebar konten tampil di tengah. */
export function Screen({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
  return (
    <div
      className={`mx-auto flex min-h-dvh w-full max-w-[400px] flex-col shadow-[0_0_24px_rgba(70,130,180,0.16)] ${
        dark ? "bg-[#13090e] text-cream" : "bg-cream"
      }`}
    >
      <SimulasiBanner />
      {children}
    </div>
  );
}

/** Logo NapasCare: lingkaran dasar dari Figma dengan tanda Breeze di atasnya. */
export function BrandLogo() {
  return (
    <span className="relative grid size-[30px] shrink-0 place-items-center">
      <img src={ICON.brandEllipse} alt="" className="absolute inset-0 size-full" />
      <img src={ICON.brandMark} alt="" className="relative size-[30px] object-cover" />
    </span>
  );
}

export function Brand({ light = false }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <BrandLogo />
      <span className={`text-base font-black tracking-[-0.4px] ${light ? "text-cream" : "text-ink"}`}>NapasCare</span>
    </div>
  );
}

export function DemoTag() {
  return (
    <span className="rounded-full border border-[rgba(70,130,180,0.28)] bg-sky/25 px-2.5 py-1 text-[11.5px] font-extrabold uppercase tracking-[0.4px] text-deep">
      Data demonstrasi
    </span>
  );
}

export function BackButton() {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => navigate(-1)}
      aria-label="Kembali"
      className="grid size-11 shrink-0 place-items-center rounded-full border border-line bg-frost"
    >
      <img src={ICON.back} alt="" className="size-5" />
    </button>
  );
}

export function TopBar({ back = false, tall = false }: { back?: boolean; tall?: boolean }) {
  return (
    <header
      className={`flex items-center justify-between border-b border-[rgba(70,130,180,0.2)] bg-gradient-to-br from-[#bfe8f7] to-[#87ceeb] px-4 ${
        tall ? "h-20" : "h-16"
      }`}
    >
      <div className="flex items-center gap-3">
        {back && <BackButton />}
        <Brand />
      </div>
      <DemoTag />
    </header>
  );
}

/** Header langkah alur skrining: tombol kembali, progres, dan label langkah. */
export function StepHeader({ label, step, total }: { label: string; step: number; total: number }) {
  return (
    <header className="border-b border-[rgba(70,130,180,0.2)] bg-gradient-to-br from-[#bfe8f7] to-[#87ceeb] px-4 pb-4 pt-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BackButton />
          <Brand />
        </div>
        <DemoTag />
      </div>
      <div className="mt-3.5">
        <div className="flex justify-between text-[11.5px]">
          <span className="text-muted">{label}</span>
          <span className="font-bold text-ink">
            Langkah {step} dari {total}
          </span>
        </div>
        <div
          className="mt-2 h-1.5 overflow-hidden rounded-full bg-mist"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={total}
          aria-valuenow={step}
        >
          <div className="h-full rounded-full bg-gradient-to-r from-sky to-steel" style={{ width: `${(step / total) * 100}%` }} />
        </div>
      </div>
    </header>
  );
}

export function PageHeading({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs font-extrabold uppercase tracking-[1.5px] text-steel">{eyebrow}</p>
      <h1 className="font-serif text-[35px] font-bold italic leading-[37px] tracking-[-1.2px] text-ink">{title}</h1>
      {children && <p className="text-base leading-[26px] text-muted">{children}</p>}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-[20px] border border-[rgba(70,130,180,0.17)] bg-white p-4 shadow-[0_10px_14px_rgba(70,130,180,0.08)] ${className}`}
    >
      {children}
    </div>
  );
}

const baseButton =
  "flex w-full items-center justify-center gap-2.5 rounded-[14.4px] px-4 py-3.5 text-base font-bold transition disabled:cursor-not-allowed disabled:opacity-40";
export const primaryClass = `${baseButton} bg-gradient-to-br from-sky to-steel text-[#23313d] shadow-[0_10px_15px_rgba(70,130,180,0.24)]`;
export const secondaryClass = `${baseButton} border border-line bg-mist text-ink`;
export const ghostClass = `${baseButton} text-steel`;

export function PrimaryButton({
  children,
  trailing = ICON.arrow,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { trailing?: string | null }) {
  return (
    <button type="button" {...props} className={`${primaryClass} ${className}`}>
      {children}
      {trailing && <img src={trailing} alt="" className="size-5" />}
    </button>
  );
}

export function SecondaryButton({ children, className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" {...props} className={`${secondaryClass} ${className}`}>
      {children}
    </button>
  );
}

export function GhostButton({ children, className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" {...props} className={`${ghostClass} ${className}`}>
      {children}
    </button>
  );
}

export function EmptyState({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-[20px] border border-dashed border-line bg-paper/50 p-6 text-center">
      <span className="grid size-11 place-items-center rounded-full bg-paper">
        <img src={ICON.empty} alt="" className="size-5" />
      </span>
      <p className="text-base font-bold text-ink">{title}</p>
      <p className="text-base leading-[26px] text-muted">{children}</p>
    </div>
  );
}

export function ClinicalNote() {
  return (
    <p className="mt-5 border-t border-line pt-4 text-[11.5px] leading-[18px] text-muted">
      Teks klinis ini adalah contoh simulasi dan perlu ditinjau tenaga medis sebelum digunakan nyata.
    </p>
  );
}

/** Baris pilihan bercentang (multi pilih), dipakai di daftar gejala dan kondisi. */
export function CheckOption({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onToggle}
      className="flex min-h-14.5 items-center justify-between rounded-[13.6px] border border-line bg-paper px-4 py-3.5 text-left"
    >
      <span className="text-base font-bold text-ink">{label}</span>
      <span
        className={`grid size-6 place-items-center rounded-[11.6px] border text-xs font-bold ${
          checked ? "border-steel bg-steel text-white" : "border-line text-transparent"
        }`}
      >
        ✓
      </span>
    </button>
  );
}

/** Tombol pilihan tunggal (Ya / Tidak), dengan status tertekan untuk aksesibilitas. */
export function ChoiceButton({
  selected,
  children,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { selected: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      {...props}
      className={`min-h-11 rounded-[11.2px] border px-2 text-base ${
        selected ? "border-steel bg-mist font-bold text-ink" : "border-line bg-paper text-ink"
      } ${className}`}
    >
      {children}
    </button>
  );
}

/** Label kolom isian; `required` menampilkan penanda "Wajib" seperti di desain. */
export function Field({ label, required = false, children }: { label: string; required?: boolean; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="flex items-center gap-2 text-[12.8px] font-bold text-muted">
        {label}
        {required && <span className="text-[10.4px] font-black uppercase text-[#a56417]">Wajib</span>}
      </span>
      {children}
    </label>
  );
}

export const inputClass =
  "w-full rounded-[12.8px] border border-line bg-paper px-4 py-3.5 text-[15px] font-bold text-ink placeholder:font-bold placeholder:text-[#8998a6] focus:outline-2 focus:outline-steel";

const navItems = [
  { to: "/beranda", label: "Beranda", icon: ICON.nav.beranda },
  { to: "/pantau", label: "Pantau", icon: ICON.nav.pantau },
  { to: "/ringkasan", label: "Ringkasan", icon: ICON.nav.ringkasan },
  { to: "/pengaturan", label: "Pengaturan", icon: ICON.nav.pengaturan },
];

export function BottomNav() {
  return (
    <nav
      aria-label="Navigasi utama"
      className="fixed inset-x-0 bottom-0 mx-auto grid h-[84px] max-w-[400px] grid-cols-4 gap-1 border-t border-cream/25 bg-steel/95 p-2 backdrop-blur-[20px]"
    >
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-1 rounded-lg text-[11.2px] ${
              isActive ? "font-bold text-cream" : "text-cream/70"
            }`
          }
        >
          <img src={item.icon} alt="" className="size-5" />
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
