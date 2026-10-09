// PROTOTYPE - concept 04 "Scenes": the two predesigned screens, Schedule and Settings, as a calm side sheet.
import { useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { calendar, household, reminders, routines, settingsGroups } from "../../fixtures";

const muted = "text-[var(--mute)]";
const h2 = "mb-2 text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--faint)]";
const who = (id: string) => household.members.find((m) => m.id === id)!;

export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <button aria-label="Close" className="absolute inset-0 bg-black/20 dark:bg-black/40" onClick={onClose} />
      <aside className="relative flex h-full w-full max-w-md flex-col border-l border-[var(--line)] bg-[var(--card)] shadow-2xl">
        <header className="flex h-14 shrink-0 items-center justify-between px-5">
          <h1 className="text-lg font-semibold">{title}</h1>
          <button aria-label="Close" onClick={onClose} className="grid size-8 place-items-center rounded-full hover:bg-[var(--soft)]"><X size={18} /></button>
        </header>
        <div className="flex-1 overflow-y-auto px-5 pb-24">{children}</div>
      </aside>
    </div>
  );
}

export function Schedule({ expert }: { expert: boolean }) {
  const [on, setOn] = useState(() => Object.fromEntries(routines.map((r) => [r.id, r.enabled])));
  return (
    <div className="space-y-7">
      <section>
        <h2 className={h2}>Reminders</h2>
        <ul className="divide-y divide-[var(--line)]">
          {reminders.map((r) => (
            <li key={r.id} className="flex items-start gap-3 py-2.5">
              <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full text-[10px] font-semibold text-white" style={{ background: who(r.for).color }}>{who(r.for).initials}</span>
              <div className="min-w-0">
                <p className="text-sm">{r.title}</p>
                <p className={`text-xs ${muted}`}>{r.when}{expert && ` · ${r.whenKind} trigger${r.source ? ` · from ${r.source}` : ""}`}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className={h2}>Calendar</h2>
        <ul className="divide-y divide-[var(--line)]">
          {calendar.map((c) => {
            const d = new Date(c.start);
            return (
              <li key={c.id} className="flex gap-3 py-2.5 text-sm">
                <span className={`mono w-24 shrink-0 text-xs leading-5 ${muted}`}>{d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", timeZone: "Europe/Berlin" })} {d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Berlin" })}</span>
                <span className="flex-1">{c.title}</span>
                <span className={`text-xs ${muted}`}>{c.calendar}</span>
              </li>
            );
          })}
        </ul>
      </section>
      <section>
        <h2 className={h2}>Routines</h2>
        <ul className="divide-y divide-[var(--line)]">
          {routines.map((r) => (
            <li key={r.id} className="flex items-start gap-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="text-sm">{r.title}</p>
                <p className={`text-xs ${muted}`}>{r.when} · {r.where}</p>
                {expert && <p className="mono mt-0.5 text-[11px] text-[var(--faint)]">last {r.lastRun} · next {on[r.id] ? r.nextRun : "paused"}</p>}
              </div>
              <button
                role="switch"
                aria-checked={on[r.id]}
                aria-label={r.title}
                onClick={() => setOn({ ...on, [r.id]: !on[r.id] })}
                className={`relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors ${on[r.id] ? "bg-[var(--accent)]" : "bg-[var(--line)]"}`}
              >
                <span className={`absolute top-0.5 size-4 rounded-full bg-white shadow transition-[left] ${on[r.id] ? "left-[18px]" : "left-0.5"}`} />
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export function SettingsList({ expert, ask }: { expert: boolean; ask: (text: string) => void }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <ul className="divide-y divide-[var(--line)]">
      {settingsGroups.map((g) => (
        <li key={g.id}>
          <button onClick={() => setOpen(open === g.id ? null : g.id)} className="flex w-full items-center gap-3 py-3 text-left">
            <div className="flex-1">
              <p className="text-sm font-medium">{g.title}</p>
              <p className={`text-xs ${muted}`}>{g.summary}</p>
            </div>
            <ChevronDown size={16} className={`text-[var(--faint)] transition-transform ${open === g.id ? "rotate-180" : ""}`} />
          </button>
          {open === g.id && (
            <div className="space-y-1 pb-4">
              {g.simple.map((s) => <p key={s} className="rounded-lg px-2 py-1.5 text-sm hover:bg-[var(--soft)]">{s}</p>)}
              {expert && g.expert.map((s) => <p key={s} className={`rounded-lg px-2 py-1.5 text-sm ${muted} hover:bg-[var(--soft)]`}>{s} <span className="mono text-[10px] text-[var(--faint)]">expert</span></p>)}
              <button onClick={() => ask(`Change my ${g.title.toLowerCase()} settings: `)} className="mt-2 rounded-full border border-[var(--line)] px-3 py-1.5 text-sm hover:bg-[var(--soft)]">Ask hux to change this</button>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
