// PROTOTYPE - concept 10 "Instrument": settings as a well-labelled device menu.
import { useState } from "react";
import { ChevronLeft, ChevronRight, MessageSquare } from "lucide-react";
import { settingsGroups } from "../../fixtures";
import { askExamples, settingValues } from "./data";
import { Key, Label, Led, Switch, cx, useInstrument } from "./ui";

const code = (i: number) => String(i + 1).padStart(2, "0");

function QuietDial() {
  // 24h ring, quiet from 22:30 to 07:00.
  const R = 52;
  const toXY = (h: number, r: number) => {
    const a = (h / 24) * Math.PI * 2 - Math.PI / 2;
    return [64 + Math.cos(a) * r, 64 + Math.sin(a) * r];
  };
  const [sx, sy] = toXY(22.5, R);
  const [ex, ey] = toXY(31, R);
  const [nx, ny] = toXY(18 + 40 / 60, 40);
  return (
    <div className="flex items-center gap-5">
      <svg width="128" height="128" viewBox="0 0 128 128" aria-label="Quiet from 22:30 to 7:00">
        <circle cx="64" cy="64" r="60" fill="var(--raised)" stroke="var(--line)" />
        {Array.from({ length: 48 }, (_, i) => {
          const h = i / 2;
          const major = i % 12 === 0;
          const [x1, y1] = toXY(h, major ? 42 : 45);
          const [x2, y2] = toXY(h, 48);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--line-strong)" strokeWidth={major ? 1.5 : 0.8} />;
        })}
        <path d={`M ${sx} ${sy} A ${R} ${R} 0 0 1 ${ex} ${ey}`} fill="none" stroke="var(--signal)" strokeWidth="6" strokeLinecap="round" />
        <line x1="64" y1="64" x2={nx} y2={ny} stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" />
        <circle cx="64" cy="64" r="5" fill="var(--ink)" />
        {[0, 6, 12, 18].map((h) => {
          const [x, y] = toXY(h, 31);
          return (
            <text key={h} x={x} y={y + 3} textAnchor="middle" fontSize="8" fill="var(--muted)" fontFamily="JetBrains Mono, monospace">
              {String(h).padStart(2, "0")}
            </text>
          );
        })}
      </svg>
      <div>
        <Label>Quiet hours</Label>
        <div className="mono mt-1 text-[22px] font-medium tracking-[-0.03em]">22:30 – 07:00</div>
        <p className="mt-1 max-w-[220px] text-[12.5px] leading-snug text-[var(--muted)]">No sounds at night. Anything urgent still reaches your phone.</p>
      </div>
    </div>
  );
}

function Row({ label, num, expertRow }: { label: string; num: string; expertRow?: boolean }) {
  const { ask, openDrawer, expert } = useInstrument();
  const v = settingValues[label] ?? {};
  const [on, setOn] = useState(v.toggle ?? false);
  const clickable = !!v.opens;
  const body = (
    <>
      <span className={cx("mono w-[34px] shrink-0 text-[11px]", expertRow ? "text-[var(--signal-ink)]" : "text-[var(--faint)]")}>{num}</span>
      <span className="min-w-0 flex-1 text-[14.5px] leading-snug">{label}</span>
      {v.text && <span className={cx("min-w-0 truncate text-right text-[13px] text-[var(--muted)]", expert ? "max-w-[46%]" : "max-w-[40%]")}>{v.text}</span>}
    </>
  );
  return (
    <li className="group flex min-h-[52px] items-center gap-3 px-4 py-2 sm:px-5">
      {clickable ? (
        <button type="button" className="focusable flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => v.opens && openDrawer(v.opens)}>
          {body}
          <ChevronRight size={16} className="shrink-0 text-[var(--muted)]" />
        </button>
      ) : (
        <div className="flex min-w-0 flex-1 items-center gap-3">{body}</div>
      )}
      {v.toggle !== undefined && <Switch on={on} onChange={setOn} label={label} />}
      {v.action && <Key size="sm" onClick={() => ask(`${v.action}: ${label.toLowerCase()}`)}>{v.action}</Key>}
      {!clickable && v.toggle === undefined && !v.action && (
        <Key
          size="sm"
          tone="flat"
          className="shrink-0 !px-2 opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
          onClick={() => ask(`About “${label}”: `)}
          aria-label={`Ask hux to change: ${label}`}
          title="Ask hux to change this"
        >
          <MessageSquare size={13} />
        </Key>
      )}
    </li>
  );
}

export function Settings({ setExpert }: { setExpert: (v: boolean) => void }) {
  const { expert, ask } = useInstrument();
  const [sel, setSel] = useState<string | null>(null);
  const [desktopSel, setDesktopSel] = useState("people");
  const activeId = sel ?? desktopSel;
  const idx = settingsGroups.findIndex((g) => g.id === activeId);
  const g = settingsGroups[idx];

  const choose = (id: string) => {
    setSel(id);
    setDesktopSel(id);
  };

  return (
    <div className="h-full min-h-0 p-3 sm:p-4 lg:p-6">
      <div className="mx-auto grid h-full max-w-[1180px] grid-cols-1 gap-4 md:grid-cols-[320px_1fr]">
        {/* Menu */}
        <nav aria-label="Settings menu" className={cx("panel scroll min-h-0 flex-col overflow-y-auto", sel ? "hidden md:flex" : "flex")}>
          <div className="border-b hairline px-4 pt-4 pb-3">
            <h1 className="text-[24px] font-semibold tracking-[-0.03em]">Settings</h1>
            <button
              type="button"
              onClick={() => ask("")}
              className="focusable mt-3 flex w-full items-center gap-2.5 rounded-xl border border-dashed border-[var(--line-strong)] px-3 py-2.5 text-left text-[13px] hover:border-[var(--signal-line)] hover:bg-[var(--signal-soft)]"
            >
              <MessageSquare size={14} className="text-[var(--signal-ink)]" />
              <span>Ask hux to change any setting</span>
            </button>
          </div>
          <ul className="py-1">
            {settingsGroups.map((grp, i) => {
              const active = grp.id === activeId;
              return (
                <li key={grp.id}>
                  <button
                    type="button"
                    onClick={() => choose(grp.id)}
                    aria-current={active ? "true" : undefined}
                    className={cx(
                      "focusable relative flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors",
                      active ? "md:bg-[var(--inset)]/70" : "hover:bg-[var(--inset)]/40",
                    )}
                  >
                    {active && <span className="absolute top-2 bottom-2 left-0 hidden w-[3px] rounded-r bg-[var(--signal)] md:block" />}
                    <span className={cx("mono w-[22px] text-[12px]", active ? "md:text-[var(--signal-ink)]" : "text-[var(--faint)]")}>{code(i)}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[14.5px] font-medium">{grp.title}</span>
                      <span className="block truncate text-[12px] text-[var(--muted)]">{grp.summary}</span>
                    </span>
                    {expert && <span className="mono text-[10px] text-[var(--faint)]">{grp.simple.length}+{grp.expert.length}</span>}
                    <ChevronRight size={15} className="text-[var(--faint)] md:hidden" />
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Detail */}
        <section key={g.id} className={cx("panel scroll min-h-0 flex-col overflow-y-auto", sel ? "flex slide-in md:animate-none" : "hidden md:flex")}>
          <div className="border-b hairline px-4 pt-3 pb-4 sm:px-5">
            <button type="button" onClick={() => setSel(null)} className="focusable -ml-1 mb-2 flex items-center gap-1 text-[13px] text-[var(--muted)] md:hidden">
              <ChevronLeft size={16} /> Menu
            </button>
            <div className="flex items-start gap-4">
              <span className="mono pt-1 text-[28px] leading-none font-medium text-[var(--signal-ink)]">{code(idx)}</span>
              <div className="min-w-0 flex-1">
                <h2 className="text-[24px] font-semibold tracking-[-0.03em]">{g.title}</h2>
                <p className="text-[14px] text-[var(--muted)]">{g.summary}</p>
              </div>
            </div>
            {g.id === "notifications" && (
              <div className="well mt-4 rounded-2xl p-4">
                <QuietDial />
              </div>
            )}
          </div>

          <ul className="divide-y divide-[var(--line)]">
            {g.simple.map((s, i) => (
              <Row key={s} label={s} num={`${code(idx)}.${i + 1}`} />
            ))}
          </ul>

          {expert ? (
            <div className="fade">
              <div className="flex items-center gap-2 border-y hairline bg-[var(--inset)]/50 px-4 py-2 sm:px-5">
                <Led state="signal" />
                <Label className="flex-1 !text-[var(--ink-2)]">Expert</Label>
              </div>
              <ul className="divide-y divide-[var(--line)]">
                {g.expert.map((s, i) => (
                  <Row key={s} label={s} num={`${code(idx)}.${g.simple.length + i + 1}`} expertRow />
                ))}
              </ul>
            </div>
          ) : (
            <div className="flex items-center gap-3 border-t hairline px-4 py-3 sm:px-5">
              <span className="flex-1 text-[12.5px] text-[var(--muted)]">
                {g.expert.length} more in expert mode
              </span>
              <Key size="sm" onClick={() => setExpert(true)}>Show</Key>
            </div>
          )}

          <div className="mt-auto border-t hairline p-4 sm:p-5">
            <button
              type="button"
              onClick={() => ask(askExamples[g.id] ?? "")}
              className="focusable group flex w-full items-center gap-3 rounded-xl bg-[var(--inset)]/60 px-4 py-3 text-left hover:bg-[var(--signal-soft)]"
            >
              <MessageSquare size={16} className="shrink-0 text-[var(--signal-ink)]" />
              <span className="flex-1">
                <span className="block text-[13px] font-semibold">Ask hux to change this</span>
                <span className="block text-[13px] text-[var(--muted)]">“{askExamples[g.id]}”</span>
              </span>
              <ChevronRight size={16} className="text-[var(--muted)] transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
