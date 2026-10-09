// PROTOTYPE concept 05 "River": small shared pieces.
import type { ReactNode } from "react";
import type { MemberId } from "../../fixtures";
import { kindColor, memberColor, memberName, type EntryKind } from "./data";

export function Mark({ className = "" }: { className?: string }) {
  // A spine with the Now dot on it: solid above, dotted below.
  return (
    <svg viewBox="0 0 16 24" className={className} aria-hidden>
      <path d="M8 1v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 16.5v1.5M8 21.5v1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity=".55" />
      <circle cx="8" cy="12.5" r="3.6" fill="var(--now)" />
    </svg>
  );
}

export function Wordmark() {
  return (
    <span className="flex items-center gap-1.5 select-none">
      <Mark className="h-6 w-4 text-[var(--ink)]" />
      <span className="text-[21px] font-semibold leading-none tracking-[-0.04em]">hux</span>
    </span>
  );
}

export function Switch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={(e) => { e.stopPropagation(); onChange(!on); }}
      className={`relative inline-flex h-[22px] w-[38px] shrink-0 items-center rounded-full transition-colors ${on ? "bg-[var(--rout)]" : "bg-[var(--line-strong)]"}`}
    >
      <span className={`absolute left-[3px] size-4 rounded-full bg-white shadow transition-transform ${on ? "translate-x-4" : ""}`} />
    </button>
  );
}

export function Avatar({ id, size = 20 }: { id: MemberId; size?: number }) {
  return (
    <span
      title={memberName(id)}
      className="inline-grid shrink-0 place-items-center rounded-full font-semibold text-white"
      style={{ width: size, height: size, background: memberColor(id), fontSize: size * 0.48 }}
    >
      {memberName(id)[0]}
    </span>
  );
}

// Spine dots: shape says the kind, fill says past or ahead.
export function Dot({ kind, future }: { kind: EntryKind; future: boolean }) {
  const c = kindColor(kind);
  const base = "block ring-4 ring-[var(--bg)]";
  const style = future ? { border: `1.5px solid ${c}`, background: "var(--bg)" } : { background: c };
  if (kind === "routine") return <span className={`${base} size-[9px] rotate-45 rounded-[2px]`} style={style} />;
  if (kind === "calendar") return <span className={`${base} size-[10px] rounded-[3px]`} style={style} />;
  if (kind === "ambient") return <span className={`${base} size-[6px] rounded-full bg-[var(--line-strong)]`} />;
  if (kind === "reminder") return <span className={`${base} size-[10px] rounded-full`} style={{ border: `2px solid ${c}`, background: "var(--bg)" }} />;
  return <span className={`${base} size-[9px] rounded-full`} style={style} />;
}

export function Eyebrow({ kind, children }: { kind: EntryKind; children: ReactNode }) {
  return (
    <div className="mb-0.5 text-[11.5px] font-medium tracking-wide uppercase" style={{ color: kindColor(kind) }}>
      {children}
    </div>
  );
}

export function Meta({ children }: { children: ReactNode }) {
  return <div className="mono mt-1.5 text-[11px] leading-relaxed text-[var(--muted)]">{children}</div>;
}

export function Button({ children, onClick, tone = "plain", className = "", type = "button" }: { children: ReactNode; onClick?: () => void; tone?: "plain" | "solid" | "now" | "ghost"; className?: string; type?: "button" | "submit" }) {
  const tones = {
    solid: "bg-[var(--ink)] text-[var(--bg)] hover:opacity-90",
    now: "bg-[var(--now)] text-white hover:brightness-105",
    plain: "border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--line-strong)]",
    ghost: "text-[var(--ink-2)] hover:bg-[var(--surface-2)]",
  };
  return (
    <button type={type} onClick={onClick} className={`inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-[13.5px] font-medium transition ${tones[tone]} ${className}`}>
      {children}
    </button>
  );
}
