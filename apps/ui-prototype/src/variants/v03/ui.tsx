// PROTOTYPE concept 03 - small typographic primitives.
import type { ButtonHTMLAttributes, ReactNode } from "react";

/** Wordmark. The full stop is the product's only ornament: it turns signal red when something needs you. */
export function Wordmark({ alert, size = 28 }: { alert?: boolean; size?: number }) {
  return (
    <span className="inline-flex items-baseline select-none" style={{ fontSize: size, lineHeight: 1 }} aria-label="hux">
      <span className="font-[800]" style={{ letterSpacing: "-0.06em" }}>hux</span>
      <span
        aria-hidden
        className="ml-[0.06em] inline-block transition-colors duration-300"
        style={{ width: "0.2em", height: "0.2em", background: alert ? "var(--signal)" : "var(--ink)" }}
      />
    </span>
  );
}

export function Label({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`t-label ${className}`}>{children}</div>;
}

/** Square switch. Ink when on, outline when off. */
export function Switch({ on, onChange, label }: { on: boolean; onChange: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={(e) => { e.stopPropagation(); onChange(); }}
      className="relative h-[18px] w-[34px] shrink-0 border b-ink transition-colors"
      style={{ background: on ? "var(--ink)" : "transparent" }}
    >
      <span
        className="absolute top-[2px] h-[12px] w-[12px] transition-all duration-200"
        style={{ left: on ? 18 : 2, background: on ? "var(--paper)" : "var(--ink)" }}
      />
    </button>
  );
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { tone?: "ink" | "line" | "signal" | "plain" };

export function Btn({ tone = "line", className = "", children, ...rest }: BtnProps) {
  const tones = {
    ink: "bg-ink border b-ink hover:opacity-85",
    line: "border b-ink hover:bg-[var(--ink)] hover:text-[var(--paper)]",
    signal: "bg-sig border b-sig hover:opacity-90",
    plain: "act",
  } as const;
  const pad = tone === "plain" ? "" : "h-9 px-3.5";
  return (
    <button type="button" className={`inline-flex items-center gap-2 text-[13px] font-semibold transition-colors ${pad} ${tones[tone]} ${className}`} {...rest}>
      {children}
    </button>
  );
}

/** Section header: number, title, hairline rule underneath. */
export function SectionHead({ n, title, right, className = "" }: { n?: string; title: string; right?: ReactNode; className?: string }) {
  return (
    <div className={`flex items-end justify-between gap-4 border-b b-ink pb-2 ${className}`}>
      <div className="flex items-baseline gap-3">
        {n && <span className="t-label c-mute">{n}</span>}
        <h2 className="t-head text-[15px]">{title}</h2>
      </div>
      {right}
    </div>
  );
}

/** Page title for non-assistant views: very large, flush left. */
export function PageTitle({ title, kicker, children }: { title: string; kicker: string; children?: ReactNode }) {
  return (
    <header className="mb-8 lg:mb-12">
      <Label className="c-mute mb-3">{kicker}</Label>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="t-display text-[44px] sm:text-[64px] lg:text-[88px]">{title}</h1>
        {children}
      </div>
    </header>
  );
}

export function ExpertMeta({ children }: { children: ReactNode }) {
  return <div className="t-meta mt-1 flex flex-wrap gap-x-3 gap-y-0.5">{children}</div>;
}
