// PROTOTYPE - small shared pieces for concept 01 "Paper".
import type { ReactNode } from "react";

export function Switch({ on, onChange, label, offLabel = "Paused" }: { on: boolean; onChange: () => void; label: string; offLabel?: string }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onChange}
      className="sans group flex shrink-0 items-center gap-2 pt-1 text-[12px] text-(--faint)"
    >
      <span className="w-10 text-right">{on ? "On" : offLabel}</span>
      <span
        className={
          "relative h-[18px] w-8 rounded-full border transition-colors duration-300 " +
          (on ? "border-(--ink) bg-(--ink)" : "border-(--rule-strong) bg-transparent")
        }
      >
        <span
          className={
            "absolute top-[2px] size-3 rounded-full transition-all duration-300 " +
            (on ? "left-[16px] bg-(--paper)" : "left-[2px] bg-(--rule-strong)")
          }
        />
      </span>
    </button>
  );
}

export function PageHeader({ kicker, title, dek, children }: { kicker: string; title: string; dek?: string; children?: ReactNode }) {
  return (
    <header className="fade-slow max-w-2xl">
      <div className="caps text-(--faint)">{kicker}</div>
      <h1 className="display mt-3 text-[2.6rem] leading-none sm:text-[3.4rem]">{title}</h1>
      {dek && <p className="mt-4 text-[1.15rem] italic leading-relaxed text-(--ink-soft)">{dek}</p>}
      {children}
    </header>
  );
}
