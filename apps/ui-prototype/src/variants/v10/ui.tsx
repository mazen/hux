// PROTOTYPE - concept 10 "Instrument": shared hardware-like primitives.
import { createContext, useContext, type ButtonHTMLAttributes, type ReactNode } from "react";
import type { Drawer } from "./data";

export type Ctx = {
  expert: boolean;
  ask: (text: string) => void;
  openDrawer: (d: Drawer) => void;
};
export const InstrumentCtx = createContext<Ctx>({ expert: false, ask: () => {}, openDrawer: () => {} });
export const useInstrument = () => useContext(InstrumentCtx);

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

export function Label({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("lbl", className)}>{children}</div>;
}

export function Led({ state = "off", className }: { state?: "off" | "on" | "signal" | "pulse"; className?: string }) {
  return (
    <span
      aria-hidden
      className={cx("led", state === "on" && "led-on", (state === "signal" || state === "pulse") && "led-signal", state === "pulse" && "led-pulse", className)}
    />
  );
}

type KeyProps = ButtonHTMLAttributes<HTMLButtonElement> & { tone?: "plain" | "signal" | "ink" | "flat"; size?: "sm" | "md" | "lg" };
export function Key({ tone = "plain", size = "md", className, children, ...rest }: KeyProps) {
  const sizes = { sm: "h-7 px-2.5 text-[12px]", md: "h-9 px-3.5 text-[13px]", lg: "h-11 px-5 text-[14px]" };
  return (
    <button
      type="button"
      {...rest}
      className={cx("key font-medium", tone === "signal" && "key-signal", tone === "ink" && "key-ink", tone === "flat" && "key-flat", sizes[size], className)}
    >
      {children}
    </button>
  );
}

export function Switch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} className="switch" onClick={() => onChange(!on)}>
      <span className="knob" />
    </button>
  );
}

/** A labelled module, like a section of a device faceplate. */
export function Module({
  title,
  right,
  children,
  className,
  code,
  led,
}: {
  title: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
  code?: string;
  led?: "off" | "on" | "signal" | "pulse";
}) {
  const { expert } = useInstrument();
  return (
    <section className={cx("panel overflow-hidden", className)}>
      <header className="flex items-center gap-2 border-b hairline px-4 py-2.5">
        {led && <Led state={led} />}
        <Label className="flex-1 !text-[var(--ink-2)]">{title}</Label>
        {expert && code && <span className="mono text-[10px] text-[var(--faint)]">{code}</span>}
        {right}
      </header>
      <div>{children}</div>
    </section>
  );
}

/** The hux mark: a speaker-grille square with one lit dot. */
export function Mark({ size = 28 }: { size?: number }) {
  const dots = [];
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 3; c++) {
      const lit = r === 0 && c === 2;
      dots.push(<circle key={`${r}${c}`} cx={9 + c * 7} cy={9 + r * 7} r={lit ? 2.6 : 1.9} fill={lit ? "var(--signal)" : "currentColor"} opacity={lit ? 1 : 0.85} />);
    }
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden className="text-[var(--ink)]">
      <rect x="1" y="1" width="30" height="30" rx="8" fill="none" stroke="currentColor" strokeWidth="1.6" />
      {dots}
    </svg>
  );
}

export function Wordmark() {
  return (
    <div className="flex items-center gap-2.5">
      <Mark />
      <div className="leading-none">
        <div className="text-[21px] font-bold tracking-[-0.04em]">hux</div>
      </div>
    </div>
  );
}

/** Two-position slide selector with engraved labels, like a mode switch on a radio. */
export function Selector<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: ReactNode; title?: string }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="well relative flex rounded-[10px] p-[3px]">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            title={o.title}
            onClick={() => onChange(o.value)}
            className={cx(
              "focusable relative flex h-7 items-center justify-center gap-1.5 rounded-[7px] px-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] transition-colors",
              active ? "key !rounded-[7px] text-[var(--ink)]" : "text-[var(--muted)] hover:text-[var(--ink-2)]",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** A small bar meter, used for trust levels. */
export function Meter({ level, max = 3 }: { level: number; max?: number }) {
  return (
    <span className="inline-flex items-end gap-[2px]" aria-label={`${level} of ${max}`}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className="w-[4px] rounded-[1px]" style={{ height: 5 + i * 3, background: i < level ? "var(--ink-2)" : "var(--line)" }} />
      ))}
    </span>
  );
}

/** Key/value row used in the expert spec plates. */
export function Spec({ k, v }: { k: string; v: ReactNode }) {
  return (
    <div className="flex items-baseline gap-3 py-[3px]">
      <span className="lbl w-[74px] shrink-0 !text-[9px]">{k}</span>
      <span className="mono min-w-0 flex-1 text-[11px] text-[var(--ink-2)]">{v}</span>
    </div>
  );
}
