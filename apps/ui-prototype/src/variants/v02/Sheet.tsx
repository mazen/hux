// PROTOTYPE - concept 02 "Hearth": sheets that slide over the hearth.
import { X } from "lucide-react";

export function Sheet({
  open,
  onClose,
  title,
  subtitle,
  from = "bottom",
  children,
  side,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  from?: "bottom" | "top";
  children: React.ReactNode;
  side?: React.ReactNode;
}) {
  const top = from === "top";
  return (
    <div className={`absolute inset-0 z-40 overflow-clip ${open ? "" : "pointer-events-none"}`} inert={!open} aria-hidden={!open}>
      <div className={`v02-scrim absolute inset-0 bg-[var(--scrim)] backdrop-blur-[2px] ${open ? "opacity-100" : "opacity-0"}`} onClick={onClose} />
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`v02-sheet absolute inset-x-0 mx-auto flex w-full max-w-[780px] flex-col overflow-clip bg-[var(--surface-solid)] shadow-[0_-20px_60px_-20px_rgba(0,0,0,0.45)] ${
          top ? "top-0 h-[90%] rounded-b-[32px]" : "bottom-0 h-[90%] rounded-t-[32px] md:h-[86%]"
        } ${open ? "translate-y-0 opacity-100" : top ? "-translate-y-full opacity-0" : "translate-y-full opacity-0"}`}
      >
        {!top && <div className="mx-auto mt-3 h-1.5 w-10 shrink-0 rounded-full bg-[var(--line)]" aria-hidden="true" />}
        <header className={`flex shrink-0 items-start gap-3 px-5 sm:px-8 ${top ? "pt-5" : "pt-3"} pb-3`}>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-[28px] leading-tight">{title}</h2>
            {subtitle && <p className="mt-0.5 text-[15px] text-[var(--ink-2)]">{subtitle}</p>}
          </div>
          {side}
          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--surface-sunk)] text-[var(--ink-2)] hover:text-[var(--ink)]"
            aria-label={`Close ${title}`}
          >
            <X size={18} />
          </button>
        </header>
        <div className="v02-scroll min-h-0 flex-1 overflow-y-auto px-5 pb-10 sm:px-8">{children}</div>
        {top && <div className="mx-auto mb-3 h-1.5 w-10 shrink-0 rounded-full bg-[var(--line)]" aria-hidden="true" />}
      </section>
    </div>
  );
}

export function Segments<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { id: T; label: string; count?: number }[] }) {
  return (
    <div className="v02-noscrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 py-1" role="tablist">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="tab"
          aria-selected={value === o.id}
          onClick={() => onChange(o.id)}
          className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-[15px] font-semibold transition ${
            value === o.id ? "bg-[var(--ink)] text-[var(--surface-solid)]" : "bg-[var(--surface-sunk)] text-[var(--ink-2)] hover:text-[var(--ink)]"
          }`}
        >
          {o.label}
          {o.count !== undefined && o.count > 0 && (
            <span className={`rounded-full px-1.5 text-[12px] ${value === o.id ? "bg-[var(--ember)] text-[var(--on-accent)]" : "bg-[var(--line)]"}`}>{o.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}

export function Switch({ on, onChange, label }: { on: boolean; onChange: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onChange}
      className={`relative h-8 w-[52px] shrink-0 rounded-full transition-colors ${on ? "bg-[var(--ember)]" : "bg-[color-mix(in_srgb,var(--ink)_24%,transparent)]"}`}
    >
      <span
        className={`absolute top-1 left-1 h-6 w-6 rounded-full bg-[var(--surface-solid)] shadow transition-transform ${on ? "translate-x-5" : ""}`}
      />
    </button>
  );
}
