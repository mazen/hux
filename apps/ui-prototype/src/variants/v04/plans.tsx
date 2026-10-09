// PROTOTYPE concept 04: Plans. Reminders, the family calendar and things hux does on its own.
import { CalendarDays, Clock, MapPin, Plus, Repeat } from "lucide-react";
import { calendar, household } from "../../fixtures";
import { Box } from "./conversation";
import { reminderList, useHux } from "./state";
import { Avatar, Btn, Label, Magnet, Switch, cx, fmtDay, fmtTime } from "./ui";

const dayName = (iso: string) => {
  const d = fmtDay(iso);
  return iso.startsWith("2026-10-10") ? `Tomorrow · ${d}` : d;
};

export function Plans() {
  const s = useHux();
  const days = [...new Set(calendar.map((c) => c.start.slice(0, 10)))];
  return (
    <div className="v4-board v4-scroll h-full overflow-y-auto">
      <div className="mx-auto max-w-[1180px] px-4 pb-36 pt-6 sm:px-6 lg:px-10 lg:pb-24 lg:pt-9">
        <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <Label>Friday 9 October</Label>
            <h1 className="v4-serif mt-1.5 text-[30px] font-medium leading-tight sm:text-[38px]">Plans</h1>
          </div>
          <Btn kind="quiet" onClick={() => s.askHux("Every Sunday at 18:00, ")}>
            <Plus size={15} /> Ask for a new routine
          </Btn>
        </header>

        <div className="grid gap-6 xl:grid-cols-2">
          <div className="space-y-6">
            <section className="v4-paper relative px-5 pb-4 pt-6">
              <Magnet className="absolute -top-[7px] left-6" />
              <h2 className="v4-serif text-xl font-semibold">Reminders</h2>
              <div className="mt-3 divide-y divide-[var(--line)]">
                {household.members.map((m) => {
                  const mine = reminderList.filter((r) => r.for === m.id);
                  return (
                    <div key={m.id} className="flex gap-3 py-3">
                      <Avatar id={m.id} size={28} />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold">{m.name}</div>
                        <ul className="mt-1 space-y-1">
                          {mine.map((r) => {
                            const done = s.remindersDone.includes(r.id);
                            return (
                              <li key={r.id}>
                                <button className="flex w-full items-start gap-2.5 py-1 text-left" onClick={() => s.toggleReminder(r.id)}>
                                  <span className="mt-0.5">
                                    <Box done={done} />
                                  </span>
                                  <span className="min-w-0 flex-1">
                                    <span className={cx("block text-[15px]", done && "text-[var(--ink-3)] line-through")}>{r.title}</span>
                                    <span className="flex items-center gap-1 text-xs text-[var(--ink-3)]">
                                      {r.whenKind === "place" ? <MapPin size={11} /> : <Clock size={11} />}
                                      {r.when}
                                      {r.source && ` · from the ${r.source.toLowerCase()}`}
                                    </span>
                                  </span>
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="v4-paper relative px-5 pb-4 pt-6">
              <Magnet color="var(--sam)" className="absolute -top-[7px] left-6" />
              <div className="flex items-baseline justify-between">
                <h2 className="v4-serif text-xl font-semibold">Calendar</h2>
                <span className="flex items-center gap-1 text-xs text-[var(--ink-3)]">
                  <CalendarDays size={12} /> {s.expert ? "Read only · synced 18:30 · 3 calendars" : "From your family calendar"}
                </span>
              </div>
              <div className="mt-3 space-y-4">
                {days.map((d) => (
                  <div key={d}>
                    <Label className="mb-1.5">{dayName(`${d}T12:00:00+02:00`)}</Label>
                    <ul className="space-y-1.5">
                      {calendar
                        .filter((c) => c.start.startsWith(d))
                        .map((c) => (
                          <li key={c.id} className="flex items-baseline gap-3 rounded-lg bg-[var(--paper-2)] px-3 py-2">
                            <span className="w-[92px] flex-none text-sm tabular-nums text-[var(--ink-2)]">
                              {fmtTime(c.start)}–{fmtTime(c.end)}
                            </span>
                            <span className="flex-1 text-[15px] font-medium">{c.title}</span>
                            <span className="text-xs text-[var(--ink-3)]">{c.calendar}</span>
                          </li>
                        ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section className="v4-paper relative self-start px-5 pb-3 pt-6">
            <Magnet color="var(--mia)" className="absolute -top-[7px] left-6" />
            <h2 className="v4-serif text-xl font-semibold">Things hux does on its own</h2>
            <ul className="mt-3 divide-y divide-[var(--line)]">
              {s.routines.map((r) => {
                const waiting = r.id === "j4" && s.approval === "pending";
                return (
                  <li key={r.id} className={cx("flex gap-4 py-4 transition-opacity", !r.enabled && "opacity-60")}>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[16px] font-semibold">{r.title}</span>
                        {"oneOff" in r && r.oneOff && <span className="rounded-full bg-[var(--paper-2)] px-2 py-0.5 text-[11px] font-semibold text-[var(--ink-2)]">Once</span>}
                        {waiting && (
                          <button
                            onClick={() => s.showOnBoard("approval")}
                            className="rounded-full bg-[var(--honey-soft)] px-2 py-0.5 text-[11px] font-semibold text-[var(--honey-ink)]"
                          >
                            Needs your okay
                          </button>
                        )}
                      </div>
                      <div className="mt-0.5 text-sm text-[var(--ink-2)]">{r.detail}</div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--ink-3)]">
                        <span className="flex items-center gap-1">
                          <Repeat size={11} /> {r.when}
                        </span>
                        <span>{r.enabled ? `Next: ${r.nextRun}` : "Paused"}</span>
                      </div>
                      {s.expert && (
                        <div className="mt-1 text-[11px] text-[var(--ink-3)]">
                          Where: {r.where} · Last run: {r.lastRun} · Job {r.id}
                        </div>
                      )}
                    </div>
                    <Switch on={r.enabled} onChange={() => s.toggleRoutine(r.id)} label={`${r.title} on or off`} />
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
