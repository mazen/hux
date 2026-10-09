// PROTOTYPE - concept 02 "Hearth": Plans sheet (reminders, calendar, routines).
import { useState } from "react";
import { CalendarDays, ChevronDown, Clock, MapPin, Plus, Repeat } from "lucide-react";
import { calendar, portfolioBriefing, routines as routineFixtures, reminders as reminderFixtures, type Card } from "../../fixtures";
import { dayLabel, clock, member } from "./data";
import { PortfolioCard } from "./Cards";
import { Segments, Switch } from "./Sheet";

export type Routine = (typeof routineFixtures)[number];
export type Reminder = (typeof reminderFixtures)[number] & { fresh?: boolean };
type Tab = "reminders" | "calendar" | "routines";

const calColor: Record<string, string> = { Family: "#E07A5F", Work: "#3D7EA6", Personal: "#81B29A" };

export function PlansBody({
  tab,
  setTab,
  routines,
  toggleRoutine,
  reminders,
  expert,
  onAsk,
}: {
  tab: Tab;
  setTab: (t: Tab) => void;
  routines: Routine[];
  toggleRoutine: (id: string) => void;
  reminders: Reminder[];
  expert: boolean;
  onAsk: (prefill: string) => void;
}) {
  return (
    <div>
      <div className="sticky top-0 z-10 -mx-5 bg-[var(--surface-solid)] px-5 pb-3 sm:-mx-8 sm:px-8">
        <Segments
          value={tab}
          onChange={setTab}
          options={[
            { id: "reminders", label: "Reminders", count: reminders.length },
            { id: "calendar", label: "Calendar" },
            { id: "routines", label: "Routines", count: routines.filter((r) => r.enabled).length },
          ]}
        />
      </div>
      {tab === "reminders" && <Reminders reminders={reminders} expert={expert} onAsk={onAsk} />}
      {tab === "calendar" && <Calendar expert={expert} />}
      {tab === "routines" && <Routines routines={routines} toggle={toggleRoutine} expert={expert} onAsk={onAsk} />}
    </div>
  );
}

function AskRow({ text, prefill, onAsk }: { text: string; prefill: string; onAsk: (p: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onAsk(prefill)}
      className="mt-4 flex w-full items-center gap-3 rounded-[22px] border border-dashed border-[var(--line)] px-4 py-3.5 text-left text-[15px] text-[var(--ink-2)] hover:border-[var(--ember)] hover:text-[var(--ink)]"
    >
      <span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--surface-sunk)] text-[var(--accent-ink)]"><Plus size={16} /></span>
      <span>
        {text} <span className="font-display text-[var(--ink)] italic">"{prefill}…"</span>
      </span>
    </button>
  );
}

function Reminders({ reminders, expert, onAsk }: { reminders: Reminder[]; expert: boolean; onAsk: (p: string) => void }) {
  return (
    <div>
      <ul className="space-y-2">
        {reminders.map((r) => {
          const m = member(r.for);
          return (
            <li key={r.id} className={`flex items-start gap-3 rounded-[22px] bg-[var(--surface-sunk)] px-4 py-3.5 ${r.fresh ? "v02-rise-in" : ""}`}>
              <span
                className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-semibold text-white"
                style={{ background: m?.color }}
                title={m?.name}
              >
                {m?.initials}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[16px] font-medium">{r.title}</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-sm text-[var(--ink-2)]">
                  {r.whenKind === "place" ? <MapPin size={13} /> : <Clock size={13} />}
                  {r.when}
                  {m && m.id !== "alex" && <span> · for {m.name}</span>}
                </p>
                {expert && (
                  <p className="mt-1 text-[13px] text-[var(--ink-3)]">
                    Trigger: {r.whenKind === "place" ? "location (Alex's phone)" : "time"}
                    {"source" in r && r.source ? ` · from ${r.source}` : ""} · id {r.id}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <AskRow text="Say" prefill="Remind me to" onAsk={onAsk} />
    </div>
  );
}

function Calendar({ expert }: { expert: boolean }) {
  const days: { label: string; items: typeof calendar }[] = [];
  for (const e of calendar) {
    const base = dayLabel(e.start);
    const label = e.start.startsWith("2026-10-10") ? `Tomorrow · ${base}` : base;
    const d = days.find((x) => x.label === label);
    if (d) d.items.push(e);
    else days.push({ label, items: [e] });
  }
  return (
    <div className="space-y-5">
      {days.map((d) => (
        <section key={d.label}>
          <h3 className="mb-2 text-[13px] font-semibold tracking-[0.08em] text-[var(--ink-3)] uppercase">{d.label}</h3>
          <ul className="space-y-2">
            {d.items.map((e) => (
              <li key={e.id} className="flex items-center gap-4 rounded-[22px] bg-[var(--surface-sunk)] px-4 py-3.5">
                <span className="font-display w-14 shrink-0 text-lg">{clock(e.start)}</span>
                <span className="h-8 w-1 shrink-0 rounded-full" style={{ background: calColor[e.calendar] }} aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="text-[16px] font-medium">{e.title}</p>
                  <p className="text-sm text-[var(--ink-2)]">
                    Until {clock(e.end)} · {e.calendar}
                    {expert && <span className="text-[var(--ink-3)]"> · synced from Google Calendar 18:30</span>}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <p className="flex items-center gap-2 text-sm text-[var(--ink-3)]">
        <CalendarDays size={14} /> hux can read these calendars, not change them.
      </p>
    </div>
  );
}

function Routines({ routines, toggle, expert, onAsk }: { routines: Routine[]; toggle: (id: string) => void; expert: boolean; onAsk: (p: string) => void }) {
  const [openBrief, setOpenBrief] = useState(false);
  return (
    <div>
      <ul className="space-y-2">
        {routines.map((r) => (
          <li key={r.id} className={`rounded-[22px] bg-[var(--surface-sunk)] px-4 py-4 transition-opacity ${r.enabled ? "" : "opacity-70"}`}>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--surface-solid)] text-[var(--accent-ink)]">
                {"oneOff" in r && r.oneOff ? <Clock size={15} /> : <Repeat size={15} />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[16px] font-medium">
                  {r.title}
                  {"oneOff" in r && r.oneOff && <span className="ml-2 rounded-full bg-[var(--line)] px-2 py-0.5 align-middle text-[12px] font-semibold text-[var(--ink-2)]">Once</span>}
                </p>
                <p className="mt-0.5 text-sm text-[var(--ink-2)]">{r.detail}</p>
                <p className="mt-1.5 text-sm text-[var(--ink-2)]">
                  {r.when} · {r.where}
                </p>
                <p className="mt-0.5 text-sm font-medium text-[var(--accent-ink)]">{r.enabled ? `Next: ${r.nextRun}` : "Resting"}</p>
                {expert && <p className="mt-1 text-[13px] text-[var(--ink-3)]">Last run: {r.lastRun} · job {r.id} · runs on Desk PC</p>}
                {r.id === "j1" && (
                  <>
                    <button
                      type="button"
                      onClick={() => setOpenBrief((o) => !o)}
                      className="mt-2 flex items-center gap-1 text-sm font-semibold text-[var(--accent-ink)]"
                      aria-expanded={openBrief}
                    >
                      This morning's briefing <ChevronDown size={15} className={`transition-transform ${openBrief ? "rotate-180" : ""}`} />
                    </button>
                    {openBrief && (
                      <div className="mt-3">
                        <PortfolioCard card={portfolioBriefing as Extract<Card, { type: "portfolio" }>} />
                      </div>
                    )}
                  </>
                )}
              </div>
              <Switch on={r.enabled} onChange={() => toggle(r.id)} label={`${r.title}: ${r.enabled ? "on" : "off"}`} />
            </div>
          </li>
        ))}
      </ul>
      <AskRow text="Say" prefill="Every Sunday evening" onAsk={onAsk} />
    </div>
  );
}
