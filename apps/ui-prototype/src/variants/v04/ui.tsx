// PROTOTYPE concept 04: small shared pieces.
import type { CSSProperties, ReactNode } from "react";
import { household, type MemberId } from "../../fixtures";

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export const member = (id: MemberId | undefined) => household.members.find((m) => m.id === id);

const berlin = "Europe/Berlin";
export const fmtTime = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: berlin }).format(new Date(iso));
export const fmtTimeSec = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: berlin }).format(new Date(iso));
export const fmtDay = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: berlin }).format(new Date(iso));
export const fmtDayLong = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: berlin }).format(new Date(iso));

export function Logo({ size = 28 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2 select-none" aria-label="hux">
      <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
        <rect x="5" y="7" width="22" height="21" rx="4" transform="rotate(-6 16 17)" fill="var(--paper)" stroke="var(--line-strong)" strokeWidth="1.2" />
        <path d="M11.5 23.5V11.5M11.5 18.5c0-2 1.4-3.3 3.2-3.3s3 1.3 3 3.3v5" transform="rotate(-6 16 17)" fill="none" stroke="var(--ink)" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="21.5" cy="8.5" r="4.2" fill="var(--honey)" />
        <circle cx="20.3" cy="7.3" r="1.3" fill="#fff" opacity=".7" />
      </svg>
      <span className="v4-serif text-[22px] font-semibold leading-none tracking-tight">hux</span>
    </span>
  );
}

export function Magnet({ color, className, title }: { color?: string; className?: string; title?: string }) {
  return <span className={cx("v4-pin", className)} style={{ "--pin": color } as CSSProperties} title={title} />;
}

export function Avatar({ id, size = 28, ring }: { id: MemberId; size?: number; ring?: boolean }) {
  const m = member(id)!;
  return (
    <span
      className="inline-grid place-items-center rounded-full font-semibold text-white flex-none"
      style={{ width: size, height: size, background: m.color, fontSize: size * 0.42, boxShadow: ring ? "0 0 0 2px var(--paper)" : undefined }}
      aria-label={m.name}
      title={m.name}
    >
      {m.initials}
    </span>
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
      className={cx(
        "relative inline-flex h-[26px] w-[44px] flex-none items-center rounded-full border transition-colors duration-200",
        on ? "border-transparent bg-[var(--ink)]" : "border-[var(--line-strong)] bg-[var(--paper-2)]",
      )}
    >
      <span
        className={cx(
          "absolute top-[2px] h-5 w-5 rounded-full shadow transition-transform duration-200",
          on ? "translate-x-[20px] bg-[var(--honey)]" : "translate-x-[2px] bg-[var(--paper)]",
        )}
      />
    </button>
  );
}

export function Label({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--ink-3)]", className)}>{children}</div>;
}

export function ExpertTag() {
  return (
    <span className="rounded-full border border-[var(--line-strong)] px-1.5 py-px text-[10px] font-semibold uppercase tracking-wider text-[var(--ink-3)]">
      Expert
    </span>
  );
}

export function Btn({
  children,
  onClick,
  kind = "quiet",
  className,
  title,
}: {
  children: ReactNode;
  onClick?: () => void;
  kind?: "primary" | "quiet" | "ghost" | "honey";
  className?: string;
  title?: string;
}) {
  const k = {
    primary: "bg-[var(--btn)] text-[var(--btn-ink)] hover:opacity-90",
    honey: "bg-[var(--honey)] text-[#2a2420] hover:brightness-105",
    quiet: "border border-[var(--line-strong)] bg-[var(--paper)] text-[var(--ink)] hover:bg-[var(--paper-2)]",
    ghost: "text-[var(--ink-2)] hover:bg-[var(--paper-2)] hover:text-[var(--ink)]",
  }[kind];
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={cx("inline-flex items-center justify-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold transition", k, className)}
    >
      {children}
    </button>
  );
}
