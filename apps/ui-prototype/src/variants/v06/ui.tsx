// PROTOTYPE - concept 06 "Canvas": small shared UI pieces.
import type { ReactNode } from "react";
import { cx } from "./model";

/** Two offset panes: a window resting on the canvas. */
export function Mark({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden>
      <rect x="1.5" y="1.5" width="11" height="11" rx="3" fill="none" stroke="currentColor" strokeOpacity=".45" strokeWidth="1.5" />
      <rect x="7" y="7" width="11.5" height="11.5" rx="3.2" fill="var(--accent)" />
      <circle cx="10" cy="10" r="0.9" fill="var(--accent-ink)" />
      <circle cx="12.6" cy="10" r="0.9" fill="var(--accent-ink)" />
    </svg>
  );
}

export function Wordmark() {
  return (
    <span className="flex items-center gap-2 select-none">
      <Mark />
      <span className="text-[17px] font-semibold tracking-[-0.04em] leading-none">hux</span>
    </span>
  );
}

export function Switch({ on, onChange, label }: { on: boolean; onChange: () => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={(e) => { e.stopPropagation(); onChange(); }}
      className={cx(
        "relative h-[20px] w-[34px] shrink-0 rounded-full transition-colors duration-200",
        on ? "bg-(--accent)" : "bg-(--line-2)",
      )}
    >
      <span
        className={cx(
          "absolute top-[2px] left-[2px] size-4 rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,.25)] transition-transform duration-200",
          on && "translate-x-[14px]",
        )}
      />
    </button>
  );
}

export function Label({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("text-[11px] font-medium uppercase tracking-[0.08em] text-(--ink-3)", className)}>{children}</div>;
}

export function Tag({ children, tone = "plain" }: { children: ReactNode; tone?: "plain" | "accent" | "amber" | "green" | "expert" }) {
  const tones = {
    plain: "bg-(--sunk) text-(--ink-2)",
    accent: "bg-(--accent-soft) text-(--accent)",
    amber: "bg-(--amber-soft) text-(--amber)",
    green: "bg-(--green-soft) text-(--green)",
    expert: "border border-dashed border-(--line-2) text-(--ink-3)",
  };
  return <span className={cx("inline-flex items-center gap-1 rounded-[6px] px-1.5 py-[2px] text-[11px] font-medium leading-4 whitespace-nowrap", tones[tone])}>{children}</span>;
}

export function Btn({
  children, onClick, kind = "ghost", className, title,
}: { children: ReactNode; onClick?: () => void; kind?: "primary" | "ghost" | "soft"; className?: string; title?: string }) {
  const kinds = {
    primary: "bg-(--ink) text-(--panel) hover:opacity-90",
    soft: "bg-(--sunk) text-(--ink) hover:bg-(--line-2)",
    ghost: "text-(--ink-2) hover:bg-(--hover) hover:text-(--ink)",
  };
  return (
    <button
      title={title}
      onClick={(e) => { e.stopPropagation(); onClick?.(); }}
      className={cx("inline-flex h-8 items-center justify-center gap-1.5 rounded-[9px] px-3 text-[13px] font-medium transition-colors", kinds[kind], className)}
    >
      {children}
    </button>
  );
}

/** A dashed hint shown only in expert mode. */
export function ExpertLine({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("v6-mono text-[11px] leading-4 text-(--ink-3)", className)}>{children}</div>;
}
