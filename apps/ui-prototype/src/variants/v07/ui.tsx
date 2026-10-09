// PROTOTYPE - concept 07 "Glass": small shared pieces.
import type { ReactNode } from "react";
import { household, type MemberId } from "../../fixtures";

export function Mark({ size = 28 }: { size?: number }) {
  // A glass orb: two light discs overlapping, like a lens catching evening light.
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <defs>
        <linearGradient id="v07-mark-a" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8f7cff" />
          <stop offset="1" stopColor="#4a36c4" />
        </linearGradient>
        <linearGradient id="v07-mark-b" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffc59e" />
          <stop offset="1" stopColor="#e86f55" />
        </linearGradient>
      </defs>
      <circle cx="13" cy="13" r="10" fill="url(#v07-mark-a)" />
      <circle cx="19" cy="19" r="10" fill="url(#v07-mark-b)" opacity="0.82" />
      <path d="M9.5 8.5a7 7 0 0 1 6-2.6" stroke="#fff" strokeOpacity="0.85" strokeWidth="1.6" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function Wordmark() {
  return (
    <span className="flex items-center gap-2">
      <Mark />
      <span className="serif text-[28px] leading-none italic tracking-tight">hux</span>
    </span>
  );
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: () => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
      className={`relative inline-flex h-[30px] w-[50px] shrink-0 items-center rounded-full transition-colors duration-300 ${on ? "btn-accent" : "fill-2"}`}
      style={on ? undefined : { boxShadow: "inset 0 0 0 1px var(--glass-line)" }}
    >
      <span
        className="absolute top-[3px] left-[3px] h-6 w-6 rounded-full bg-white transition-transform duration-300"
        style={{ transform: on ? "translateX(20px)" : "none", boxShadow: "0 2px 6px rgba(0,0,0,.25)" }}
      />
    </button>
  );
}

export function Avatar({ id, size = 24 }: { id: MemberId; size?: number }) {
  const m = household.members.find((x) => x.id === id)!;
  return (
    <span
      title={m.name}
      className="inline-grid shrink-0 place-items-center rounded-full font-bold text-white"
      style={{ width: size, height: size, background: m.color, fontSize: size * 0.44, boxShadow: "inset 0 1px 0 rgba(255,255,255,.35)" }}
    >
      {m.initials}
    </span>
  );
}

export function memberName(id?: MemberId) {
  return household.members.find((m) => m.id === id)?.name ?? "Everyone";
}

export function PanelTitle({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 px-5 pt-4 pb-2">
      <h2 className="text-[13px] font-bold tracking-wide uppercase ink-3">{children}</h2>
      {aside}
    </div>
  );
}

export function PageHeader({ title, sub, aside }: { title: string; sub?: string; aside?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="serif text-[44px] leading-[1.05] md:text-[56px]">{title}</h1>
        {sub && <p className="mt-1 text-[15px] ink-2">{sub}</p>}
      </div>
      {aside}
    </div>
  );
}

export function Meta({ children }: { children: ReactNode }) {
  return <span className="font-mono text-[11px] leading-[1.45] tracking-tight ink-3">{children}</span>;
}
