// PROTOTYPE - concept 08 shared bits: logo, buttons, toggles, tags.
import type { ReactNode, ButtonHTMLAttributes } from "react";
import { household, type MemberId } from "../../fixtures";

export type Tone = "sun" | "coral" | "mint" | "sky" | "lilac" | "surface" | "ink" | "paper";

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { tone?: Tone; size?: "sm" | "md" | "lg"; icon?: ReactNode };
export function Btn({ tone = "surface", size = "md", icon, className, children, ...rest }: BtnProps) {
  const sz =
    size === "lg" ? "min-h-14 px-5 text-lg gap-2.5" : size === "md" ? "min-h-12 px-4 text-base gap-2" : "min-h-10 px-3 text-sm gap-1.5";
  return (
    <button
      type="button"
      {...rest}
      className={cx("press bx sh-sm inline-flex items-center justify-center rounded-xl font-bold", `bg-${tone}`, sz, className)}
    >
      {icon}
      {children}
    </button>
  );
}

export function Switch({ on, onChange, label, tone = "mint" }: { on: boolean; onChange: (v: boolean) => void; label: string; tone?: Tone }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={cx("bx relative inline-flex h-9 w-16 shrink-0 items-center rounded-full transition-colors", on ? `bg-${tone}` : "bg-sunk")}
    >
      <span
        className={cx(
          "bx absolute top-1/2 size-7 -translate-y-1/2 rounded-full bg-surface transition-all duration-150",
          on ? "left-[calc(100%-1.9rem)]" : "left-0.5",
        )}
        style={{ borderWidth: 2 }}
      />
    </button>
  );
}

export function Tag({ children, tone = "surface", className }: { children: ReactNode; tone?: Tone; className?: string }) {
  return (
    <span className={cx("inline-flex items-center gap-1 rounded-md border-2 border-line px-1.5 py-0.5 text-xs font-bold", `bg-${tone}`, className)}>
      {children}
    </span>
  );
}

export function ExpertTag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border-2 border-dashed border-line px-1.5 py-0.5 font-mono text-[11px] font-semibold">
      {children}
    </span>
  );
}

export function Avatar({ id, size = 36 }: { id: MemberId; size?: number }) {
  const m = household.members.find((x) => x.id === id)!;
  return (
    <span
      className="inline-grid shrink-0 place-items-center rounded-full border-2 border-line font-display font-extrabold text-[#161310]"
      style={{ width: size, height: size, background: m.color, fontSize: size * 0.45 }}
      title={m.name}
    >
      {m.initials}
    </span>
  );
}

export function memberName(id?: MemberId) {
  return household.members.find((m) => m.id === id)?.name ?? "Everyone";
}

export function SectionTitle({ children, aside, id }: { children: ReactNode; aside?: ReactNode; id?: string }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <h2 id={id} className="font-display text-3xl font-extrabold leading-none md:text-4xl">
        {children}
      </h2>
      {aside}
    </div>
  );
}

export function Panel({ tone = "surface", className, children }: { tone?: Tone; className?: string; children: ReactNode }) {
  return <section className={cx("bx sh rounded-2xl", `bg-${tone}`, className)}>{children}</section>;
}
