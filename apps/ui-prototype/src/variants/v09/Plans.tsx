// PROTOTYPE - concept 09 "Grove": Plans. Coming up (calendar + reminders) and what hux does on its own.
import { useRef } from "react";
import { Bell, Check, MapPin, Plus, Repeat, Send } from "lucide-react";
import { calendar, reminders, routines } from "../../fixtures";
import { reminderAt } from "./data";
import { useGrove } from "./store";
import { Avatar, Button, Eyebrow, ExpertNote, Toggle, useFlash } from "./ui";

const TZ = "Europe/Berlin";
const dayKey = (iso: string) => new Date(iso).toLocaleDateString("en-CA", { timeZone: TZ });
const hm = (iso: string) => new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: TZ });
const dayLabel = (key: string) => {
  const d = new Date(`${key}T12:00:00+02:00`);
  const base = d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: TZ });
  return key === "2026-10-10" ? `Tomorrow · ${base}` : base;
};
const calTone: Record<string, string> = { Family: "var(--moss)", Work: "var(--rain)", Personal: "var(--clay)" };

type Entry =
  | { kind: "event"; id: string; at: string; end: string; title: string; cal: string }
  | { kind: "reminder"; id: string; at: string; title: string; who: (typeof reminders)[number]["for"]; source?: string }
  | { kind: "job"; id: string; at: string; title: string };

function useFocusRef(id: string) {
  const { focus } = useGrove();
  const ref = useRef<HTMLLIElement>(null);
  useFlash(focus?.kind === "plan" && focus.id === id, focus?.nonce, ref);
  return ref;
}

function EntryRow({ e }: { e: Entry }) {
  const g = useGrove();
  const ref = useFocusRef(e.id);
  if (e.kind === "event")
    return (
      <li ref={ref} className="flex items-center gap-3 rounded-[16px] px-3 py-2.5">
        <span className="g-num w-12 shrink-0 text-[14px] font-semibold text-(--ink-2)">{hm(e.at)}</span>
        <span className="h-8 w-1 shrink-0 rounded-full" style={{ background: calTone[e.cal] }} />
        <span className="min-w-0 flex-1">
          <span className="block text-[15.5px] font-semibold">{e.title}</span>
          <span className="block text-[13px] text-(--ink-3)">
            until {hm(e.end)}
            {g.expert && ` · ${e.cal} calendar`}
          </span>
        </span>
      </li>
    );
  if (e.kind === "job") {
    const pending = g.approval === "pending";
    return (
      <li ref={ref} className="flex items-center gap-3 rounded-[16px] px-3 py-2.5">
        <span className="g-num w-12 shrink-0 text-[14px] font-semibold text-(--ink-2)">{hm(e.at)}</span>
        <Send size={16} className="shrink-0 text-(--moss)" />
        <span className="min-w-0 flex-1">
          <span className="block text-[15.5px] font-semibold">{e.title}</span>
          <span className={`block text-[13px] ${pending ? "font-semibold text-(--ochre)" : "text-(--ink-3)"}`}>
            {g.approval === "approved" ? "Approved" : g.approval === "declined" ? "Not sending" : "Waiting for your OK"}
          </span>
        </span>
      </li>
    );
  }
  const done = !!g.remindersDone[e.id];
  return (
    <li ref={ref} className="flex items-center gap-3 rounded-[16px] px-3 py-2.5">
      <span className="g-num w-12 shrink-0 text-[14px] font-semibold text-(--ink-2)">{e.at ? hm(e.at) : ""}</span>
      <button
        onClick={() => g.toggleReminder(e.id)}
        aria-label={done ? "Mark as not done" : "Mark as done"}
        className={`grid size-5 shrink-0 place-items-center rounded-full border-[1.5px] transition ${done ? "border-(--moss) bg-(--moss) text-(--moss-ink)" : "border-(--line-strong) hover:border-(--moss)"}`}
      >
        {done && <Check size={12} strokeWidth={3} />}
      </button>
      <span className="min-w-0 flex-1">
        <span className={`block text-[15.5px] font-semibold ${done ? "text-(--ink-3) line-through" : ""}`}>{e.title}</span>
        <span className="flex items-center gap-1 text-[13px] text-(--ink-3)">
          <Bell size={12} /> Reminder for {e.who === "alex" ? "you" : e.who === "sam" ? "Sam" : "Mia"}
          {g.expert && e.source && ` · from ${e.source}`}
        </span>
      </span>
      <Avatar id={e.who} size={24} />
    </li>
  );
}

function RoutineCard({ r }: { r: (typeof routines)[number] }) {
  const g = useGrove();
  const ref = useRef<HTMLDivElement>(null);
  useFlash(g.focus?.kind === "plan" && g.focus.id === r.id, g.focus?.nonce, ref);
  const on = g.routineOn[r.id];
  return (
    <div ref={ref} className={`rounded-[22px] border border-(--line) bg-(--raised) p-4 transition-opacity ${on ? "" : "opacity-60"}`}>
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="g-display text-[19px] leading-tight font-bold">{r.title}</h3>
            {"oneOff" in r && r.oneOff && <span className="rounded-full bg-(--sunk) px-2 py-0.5 text-[11.5px] font-semibold text-(--ink-2)">Once</span>}
          </div>
          <p className="mt-1 text-[14.5px] leading-snug text-(--ink-2)">{r.detail}</p>
        </div>
        <Toggle on={on} onChange={() => g.toggleRoutine(r.id)} label={`${r.title} on or off`} />
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[13.5px] text-(--ink-2)">
        <span className="flex items-center gap-1.5"><Repeat size={14} className="text-(--ink-3)" /> {r.when}</span>
        <span className="flex items-center gap-1.5"><MapPin size={14} className="text-(--ink-3)" /> {r.where}</span>
      </div>
      {g.expert && (
        <ExpertNote className="mt-2">
          last run: {r.lastRun} · next: {on ? r.nextRun : "paused"} · id {r.id}
        </ExpertNote>
      )}
    </div>
  );
}

export function Plans() {
  const g = useGrove();
  const entries: Entry[] = [
    ...calendar.map((c) => ({ kind: "event" as const, id: c.id, at: c.start, end: c.end, title: c.title, cal: c.calendar })),
    ...reminders.filter((r) => reminderAt[r.id]).map((r) => ({ kind: "reminder" as const, id: r.id, at: reminderAt[r.id]!, title: r.title, who: r.for, source: r.source })),
    { kind: "job" as const, id: "j4-agenda", at: "2026-10-12T07:30:00+02:00", title: "hux sends the email to Todd" },
  ].sort((a, b) => a.at.localeCompare(b.at));
  const days = [...new Set(entries.map((e) => dayKey(e.at)))];
  const anytime = reminders.filter((r) => !reminderAt[r.id]);

  return (
    <div className="mx-auto w-full max-w-[1120px] px-4 pt-6 pb-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="g-display text-[36px] leading-none font-bold">Plans</h1>
        <Button kind="soft" icon={Plus} small onClick={() => { g.setQuery("Remind me to "); g.setLifted(true); }}>
          New reminder
        </Button>
      </div>

      <div className="mt-7 grid gap-8 lg:grid-cols-[1.15fr_1fr] lg:gap-10">
        <section>
          <Eyebrow className="mb-3 px-1">Coming up</Eyebrow>
          <div className="space-y-5">
            {anytime.length > 0 && (
              <div>
                <div className="mb-1 px-3 text-[14px] font-semibold text-(--ink-2)">When you're out</div>
                <ul className="rounded-[22px] border border-(--line) bg-(--raised) p-1">
                  {anytime.map((r) => (
                    <AnytimeRow key={r.id} r={r} />
                  ))}
                </ul>
              </div>
            )}
            {days.map((d) => (
              <div key={d}>
                <div className="mb-1 px-3 text-[14px] font-semibold text-(--ink-2)">{dayLabel(d)}</div>
                <ul className="rounded-[22px] border border-(--line) bg-(--raised) p-1">
                  {entries.filter((e) => dayKey(e.at) === d).map((e) => (
                    <EntryRow key={e.id} e={e} />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section>
          <Eyebrow className="mb-3 px-1">On its own</Eyebrow>
          <div className="space-y-3">
            {routines.map((r) => (
              <RoutineCard key={r.id} r={r} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function AnytimeRow({ r }: { r: (typeof reminders)[number] }) {
  const g = useGrove();
  const ref = useFocusRef(r.id);
  const done = !!g.remindersDone[r.id];
  return (
    <li ref={ref} className="flex items-center gap-3 rounded-[16px] px-3 py-2.5">
      <MapPin size={16} className="w-12 shrink-0 text-(--clay)" />
      <button
        onClick={() => g.toggleReminder(r.id)}
        aria-label={done ? "Mark as not done" : "Mark as done"}
        className={`grid size-5 shrink-0 place-items-center rounded-full border-[1.5px] transition ${done ? "border-(--moss) bg-(--moss) text-(--moss-ink)" : "border-(--line-strong) hover:border-(--moss)"}`}
      >
        {done && <Check size={12} strokeWidth={3} />}
      </button>
      <span className="min-w-0 flex-1">
        <span className={`block text-[15.5px] font-semibold ${done ? "text-(--ink-3) line-through" : ""}`}>{r.title}</span>
        <span className="block text-[13px] text-(--ink-3)">
          {r.when}
          {g.expert && r.source && ` · from ${r.source} · geofence: any supermarket`}
        </span>
      </span>
      <Avatar id={r.for} size={24} />
    </li>
  );
}
