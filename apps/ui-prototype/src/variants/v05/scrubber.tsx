// PROTOTYPE concept 05 "River": jump through days and weeks.
import { useEffect, useRef } from "react";
import { DAYS, KINDS, TODAY_KEY, type Kind } from "./data";

type Props = { active: string; kindsByDay: Record<string, Set<Kind>>; onJump: (key: string) => void };

function Dots({ kinds }: { kinds?: Set<Kind> }) {
  return (
    <span className="flex h-1.5 items-center gap-[3px]">
      {KINDS.filter((k) => kinds?.has(k.id)).map((k) => (
        <span key={k.id} className="size-[5px] rounded-full" style={{ background: k.color }} />
      ))}
    </span>
  );
}

const WEEKS = ["This week", "Next week"];

export function RailScrubber({ active, kindsByDay, onJump }: Props) {
  return (
    <div className="space-y-5">
      {WEEKS.map((label, w) => (
        <div key={label}>
          <button onClick={() => onJump(DAYS[w * 7].key)} className="mb-1.5 px-2 text-[12px] font-medium text-[var(--muted)] hover:text-[var(--ink)]">{label}</button>
          <ul>
            {DAYS.filter((d) => d.week === w).map((d) => {
              const isActive = d.key === active;
              const isToday = d.key === TODAY_KEY;
              const past = d.key < TODAY_KEY;
              return (
                <li key={d.key}>
                  <button
                    onClick={() => onJump(d.key)}
                    className={`flex w-full items-center gap-3 rounded-xl px-2 py-[7px] text-left text-[13.5px] transition ${isActive ? "bg-[var(--surface)] shadow-[var(--shadow)]" : "hover:bg-[var(--surface-2)]"}`}
                  >
                    <span className={`w-8 ${past ? "text-[var(--muted)]" : "text-[var(--ink-2)]"}`}>{d.short}</span>
                    <span className={`mono w-5 text-right text-[12.5px] ${isToday ? "font-semibold text-[var(--now)]" : past ? "text-[var(--muted)]" : ""}`}>{d.num}</span>
                    <span className="flex-1 pl-1"><Dots kinds={kindsByDay[d.key]} /></span>
                    {isToday && <span className="text-[11px] font-semibold tracking-wider text-[var(--now)] uppercase">Now</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function StripScrubber({ active, kindsByDay, onJump }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const strip = ref.current;
    const el = strip?.querySelector<HTMLElement>(`[data-day="${active}"]`);
    if (!strip || !el) return;
    const left = el.offsetLeft - strip.clientWidth / 2 + el.clientWidth / 2;
    strip.scrollTo({ left, behavior: "smooth" });
  }, [active]);

  return (
    <div ref={ref} className="no-scrollbar relative flex items-stretch gap-1 overflow-x-auto px-3 py-2">
      {DAYS.map((d, i) => {
        const isActive = d.key === active;
        const isToday = d.key === TODAY_KEY;
        return (
          <div key={d.key} className="flex items-stretch">
            {i === 7 && <span className="mx-1.5 my-1 w-px bg-[var(--line-strong)]" aria-hidden />}
            <button
              data-day={d.key}
              onClick={() => onJump(d.key)}
              aria-label={`${d.weekday} ${d.num} ${d.month}`}
              className={`flex w-11 shrink-0 flex-col items-center gap-1 rounded-xl py-1.5 transition ${isActive ? "bg-[var(--surface)] shadow-[var(--shadow)]" : ""}`}
            >
              <span className={`text-[10.5px] ${isToday ? "font-semibold text-[var(--now)]" : "text-[var(--muted)]"}`}>{isToday ? "Now" : d.short}</span>
              <span className={`mono text-[14px] leading-none ${isToday ? "font-semibold text-[var(--now)]" : d.key < TODAY_KEY ? "text-[var(--muted)]" : ""}`}>{d.num}</span>
              <Dots kinds={kindsByDay[d.key]} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
