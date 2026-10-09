// PROTOTYPE - concept 09 "Grove": small shared pieces.
import { useEffect, type ReactNode } from "react";
import { X, type LucideIcon } from "lucide-react";
import type { MemberId } from "../../fixtures";
import { memberById } from "./data";

/** Growth rings: the hux mark. Off-centre, like a real tree's heart. */
export function RingMark({ size = 28, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={`g-mark ${className}`} aria-hidden>
      <ellipse cx="16" cy="16.4" rx="14" ry="13.4" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.45" />
      <ellipse cx="15.1" cy="15.9" rx="9.8" ry="9.3" fill="none" stroke="currentColor" strokeWidth="1.6" opacity="0.7" />
      <ellipse cx="14.3" cy="15.5" rx="5.6" ry="5.3" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="13.8" cy="15.2" r="2" fill="currentColor" />
    </svg>
  );
}

export function Wordmark() {
  return (
    <span className="flex items-center gap-2 text-(--moss)">
      <RingMark size={26} />
      <span className="g-display text-[26px] leading-none font-extrabold tracking-tight text-(--ink)">hux</span>
    </span>
  );
}

export function Toggle({ on, onChange, label, size = "md" }: { on: boolean; onChange: () => void; label: string; size?: "sm" | "md" }) {
  const w = size === "sm" ? "w-9 h-5" : "w-11 h-6";
  const k = size === "sm" ? "size-4" : "size-5";
  const tx = size === "sm" ? "translate-x-4" : "translate-x-5";
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
      className={`relative shrink-0 rounded-full p-0.5 transition-colors ${w} ${on ? "bg-(--moss)" : "bg-(--line-strong)"}`}
    >
      <span className={`g-toggle-knob block rounded-full bg-(--raised) shadow-sm ${k} ${on ? tx : "translate-x-0"}`} />
    </button>
  );
}

export function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: { id: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-full bg-(--sunk) p-1">
      {options.map((o) => (
        <button
          key={o.id}
          role="radio"
          aria-checked={value === o.id}
          onClick={() => onChange(o.id)}
          className={`rounded-full px-3 py-1 text-[13px] font-semibold transition ${value === o.id ? "bg-(--raised) text-(--ink) shadow-sm" : "text-(--ink-2) hover:text-(--ink)"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Avatar({ id, size = 22 }: { id?: MemberId; size?: number }) {
  const m = memberById(id);
  if (!m) return null;
  return (
    <span
      title={m.name}
      className="inline-grid shrink-0 place-items-center rounded-full font-bold text-white"
      style={{ width: size, height: size, background: m.color, fontSize: size * 0.48 }}
    >
      {m.initials}
    </span>
  );
}

export function IconTile({ icon: Icon, tone = "stone", size = 36 }: { icon: LucideIcon; tone?: "stone" | "moss" | "clay" | "ochre" | "rain"; size?: number }) {
  const tones = {
    stone: "bg-(--sunk) text-(--ink-2)",
    moss: "bg-(--moss-soft) text-(--moss-text)",
    clay: "bg-(--clay-soft) text-(--clay)",
    ochre: "bg-(--ochre-soft) text-(--ochre)",
    rain: "bg-(--rain-soft) text-(--rain)",
  } as const;
  return (
    <span className={`grid shrink-0 place-items-center rounded-[12px] ${tones[tone]}`} style={{ width: size, height: size }}>
      <Icon size={size * 0.5} strokeWidth={1.8} />
    </span>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-[22px] border border-(--line) bg-(--raised) shadow-(--shadow) ${className}`}>{children}</div>;
}

export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`text-[12px] font-semibold tracking-[0.08em] text-(--ink-3) uppercase ${className}`}>{children}</div>;
}

export function ExpertNote({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`g-mono g-fade text-(--ink-3) ${className}`}>{children}</div>;
}

export function Button({
  children, onClick, kind = "ghost", icon: Icon, className = "", small,
}: { children?: ReactNode; onClick?: () => void; kind?: "solid" | "soft" | "ghost" | "line"; icon?: LucideIcon; className?: string; small?: boolean }) {
  const kinds = {
    solid: "bg-(--moss) text-(--moss-ink) hover:bg-(--moss-hover)",
    soft: "bg-(--moss-soft) text-(--moss-text) hover:brightness-[0.97]",
    ghost: "text-(--ink-2) hover:bg-(--sunk) hover:text-(--ink)",
    line: "border border-(--line-strong) text-(--ink) hover:bg-(--sunk)",
  } as const;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-1.5 rounded-full font-semibold transition ${small ? "h-8 px-3 text-[13px]" : "h-10 px-4 text-[14.5px]"} ${kinds[kind]} ${className}`}
    >
      {Icon && <Icon size={small ? 15 : 17} strokeWidth={2} />}
      {children}
    </button>
  );
}

/** Right-hand drawer on wide screens, bottom sheet on phones. */
export function Sheet({ title, subtitle, onClose, children, footer }: { title: string; subtitle?: string; onClose: () => void; children: ReactNode; footer?: ReactNode }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-40 flex items-end md:items-stretch md:justify-end">
      <button aria-label="Close" className="g-fade absolute inset-0 bg-(--scrim) backdrop-blur-[2px]" onClick={onClose} />
      <section
        role="dialog"
        aria-label={title}
        className="g-sheet relative flex max-h-[88%] w-full flex-col rounded-t-[28px] border border-(--line) bg-(--surface) shadow-(--shadow-lift) md:m-3 md:max-h-none md:w-[440px] md:rounded-[28px]"
      >
        <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-(--line-strong) md:hidden" />
        <header className="flex items-start gap-3 px-6 pt-5 pb-3">
          <div className="min-w-0 flex-1">
            <h2 className="g-display text-[26px] leading-tight font-bold">{title}</h2>
            {subtitle && <p className="mt-1 text-[15px] text-(--ink-2)">{subtitle}</p>}
          </div>
          <button onClick={onClose} aria-label="Close" className="grid size-9 place-items-center rounded-full text-(--ink-2) hover:bg-(--sunk)">
            <X size={19} />
          </button>
        </header>
        <div className="g-scroll min-h-0 flex-1 overflow-y-auto px-6 pb-6">{children}</div>
        {footer && <footer className="border-t border-(--line) px-6 py-4">{footer}</footer>}
      </section>
    </div>
  );
}

/** Scroll an element into view and give it a soft flash when it is the jump target. */
export function useFlash(active: boolean, nonce: number | undefined, ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!active || !ref.current) return;
    const el = ref.current;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.remove("g-flash");
    void el.offsetWidth;
    el.classList.add("g-flash");
  }, [active, nonce, ref]);
}

export const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
export const shortcutLabel = isMac ? "⌘K" : "Ctrl K";
