// PROTOTYPE - Plans as a diary page, concept 01 "Paper".
import { calendar, reminders, routines, type MemberId } from "../../fixtures";
import { memberById, useStore } from "./store";
import { Switch } from "./ui";

type Line = { time: string; title: string; note?: string; expertNote?: string; kind: "calendar" | "reminder" | "routine"; who?: MemberId; past?: boolean };

const days = [9, 10, 11, 12, 13, 14, 15, 16].map((d) => {
  const date = new Date(`2026-10-${String(d).padStart(2, "0")}T12:00:00+02:00`);
  return { d, weekday: date.toLocaleDateString("en-GB", { weekday: "long", timeZone: "Europe/Berlin" }) };
});

const hm = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Berlin" }).replace(/^0/, "");
const dayOf = (iso: string) => Number(new Date(iso).toLocaleDateString("en-GB", { day: "numeric", timeZone: "Europe/Berlin" }));

// Where the fixture reminders fall in the week (their `when` is written for people, not machines).
const reminderSlot: Record<string, { day: number; time: string }> = {
  r2: { day: 16, time: "9:00" },
  r3: { day: 10, time: "8:15" },
  r4: { day: 12, time: "17:00" },
};

function linesFor(day: number, routineOn: Record<string, boolean>, approval: string): Line[] {
  const out: Line[] = [];
  for (const c of calendar) {
    if (dayOf(c.start) !== day) continue;
    out.push({ time: hm(c.start), title: c.title, note: `until ${hm(c.end)}`, expertNote: `${c.calendar} calendar`, kind: "calendar" });
  }
  for (const r of reminders) {
    const slot = reminderSlot[r.id];
    if (!slot || slot.day !== day) continue;
    const who = memberById(r.for);
    out.push({ time: slot.time, title: r.title, note: `reminds ${who?.name}`, expertNote: `on ${who?.name === "Alex" ? "Alex's phone" : "the kitchen tablet"}`, kind: "reminder", who: r.for });
  }
  const weekday = day !== 10 && day !== 11;
  if (routineOn.j1 && weekday) out.push({ time: "7:00", title: "Morning briefing", kind: "routine", past: day === 9, expertNote: "Kitchen tablet and phone" });
  if (routineOn.j2 && (day === 9 || day === 13 || day === 16)) out.push({ time: "22:00", title: "Check lottery tickets", kind: "routine", expertNote: "Phone, then speaker" });
  if (routineOn.j4 && day === 12)
    out.push({ time: "7:30", title: "Send the email to Todd", kind: "routine", note: approval === "approved" ? "approved" : "needs your approval", expertNote: "Writer · email" });
  const mins = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  return out.sort((a, b) => mins(a.time) - mins(b.time));
}

export function Plans() {
  const { routineOn, toggleRoutine, approval, expert, go } = useStore();
  const anytime = reminders.filter((r) => r.whenKind === "place");

  return (
    <div className="thin-scroll h-full overflow-y-auto">
      <div className="mx-auto w-full max-w-6xl px-5 pb-28 pt-10 sm:px-8 sm:pt-16">
        <header className="fade-slow max-w-2xl">
          <div className="caps text-(--faint)">Week 41 &middot; October 2026</div>
          <h1 className="display mt-3 text-[2.6rem] leading-none sm:text-[3.4rem]">Plans</h1>
        </header>

        <div className="mt-12 grid gap-14 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-0">
          {/* Left page: the diary */}
          <section className="fade-slow lg:border-r lg:border-(--rule) lg:pr-12" aria-label="The week">
            {days.map(({ d, weekday }) => {
              const lines = linesFor(d, routineOn, approval);
              const today = d === 9;
              return (
                <div key={d} className="grid grid-cols-[3.4rem_1fr] gap-4 border-t border-(--rule) py-5 sm:grid-cols-[4.5rem_1fr]">
                  <div>
                    <div className={"display lining text-[2.4rem] leading-none sm:text-[2.8rem] " + (today ? "text-(--accent)" : "")}>{d}</div>
                    <div className="caps mt-1.5 text-(--faint)">{today ? "Today" : weekday.slice(0, 3)}</div>
                  </div>
                  <div className="pt-1">
                    <div className="mb-2 italic text-(--faint)">{weekday}</div>
                    {lines.length === 0 && <p className="italic text-(--faint)">Nothing planned.</p>}
                    <ul className="space-y-2">
                      {lines.map((l, i) => {
                        const who = l.who ? memberById(l.who) : undefined;
                        return (
                          <li key={i} className={"grid grid-cols-[3.2rem_1fr] gap-3 " + (l.past ? "opacity-45" : "")}>
                            <span className="sans lining pt-[3px] text-[13px] text-(--ink-soft)">{l.time}</span>
                            <span className="text-[1.08rem] leading-snug">
                              {l.kind === "routine" ? <span className="italic text-(--ink-soft)">{l.title}</span> : l.title}
                              {who && <span className="ml-2 inline-block size-1.5 -translate-y-[3px] rounded-full" style={{ background: who.color }} />}
                              {(l.note || l.kind === "routine") && (
                                <span className="sans ml-2 text-[12px] text-(--faint)">
                                  {l.kind === "routine" ? (l.note ? `by hux, ${l.note}` : l.past ? "by hux, done" : "by hux") : l.note}
                                </span>
                              )}
                              {expert && l.expertNote && <span className="sans block text-[11.5px] text-(--faint)">{l.expertNote}</span>}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              );
            })}
            <div className="border-t border-(--rule) pt-6">
              <div className="caps text-(--faint)">Not tied to a day</div>
              {anytime.map((r) => (
                <p key={r.id} className="mt-2 text-[1.08rem]">
                  {r.title} <span className="italic text-(--ink-soft)">{r.when.charAt(0).toLowerCase() + r.when.slice(1)}</span>
                  {expert && r.source && <span className="sans ml-2 text-[11.5px] text-(--faint)">from the {r.source.toLowerCase()} &middot; uses Alex's location</span>}
                </p>
              ))}
              <button onClick={() => go("conversation", "Remind me to ")} className="sans link mt-6 text-[13px] text-(--ink-soft)">
                Add a reminder by asking hux
              </button>
            </div>
          </section>

          {/* Right page: routines */}
          <section className="fade-slow lg:pl-12" aria-label="Routines">
            <div className="lg:sticky lg:top-6">
              <h2 className="display text-[1.8rem] leading-tight">Routines</h2>
              <ul className="mt-4">
                {routines.map((r) => {
                  const on = routineOn[r.id];
                  return (
                    <li key={r.id} className="border-t border-(--rule) py-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className={"min-w-0 transition-opacity " + (on ? "" : "opacity-55")}>
                          <h3 className="text-[1.15rem] leading-snug">
                            {r.title}
                            {"oneOff" in r && r.oneOff && <span className="caps ml-2 text-(--faint)">Once</span>}
                          </h3>
                          <p className="mt-0.5 italic text-(--ink-soft)">{r.when}</p>
                          <p className="sans mt-1.5 text-[13px] leading-relaxed text-(--faint)">{r.detail}</p>
                        </div>
                        <Switch on={on} onChange={() => toggleRoutine(r.id)} label={r.title} />
                      </div>
                      {expert && (
                        <dl className="sans lining mt-3 grid grid-cols-[5.5rem_1fr] gap-y-0.5 text-[11.5px] text-(--faint)">
                          <dt>Where</dt>
                          <dd>{r.where}</dd>
                          <dt>Last run</dt>
                          <dd>{r.lastRun}</dd>
                          <dt>Next run</dt>
                          <dd>{on ? r.nextRun : "Paused"}</dd>
                        </dl>
                      )}
                    </li>
                  );
                })}
              </ul>
              <button onClick={() => go("conversation", "Every Sunday evening, ")} className="sans link mt-2 text-[13px] text-(--ink-soft)">
                Ask hux to take on something new
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
