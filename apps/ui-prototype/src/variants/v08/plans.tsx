// PROTOTYPE - concept 08 plans: reminders, calendar, routines.
import { Bell, CalendarDays, Check, MapPin, Repeat, MessageCircle } from "lucide-react";
import { calendar, reminders, routines } from "../../fixtures";
import { useStore } from "./store";
import { Avatar, Btn, ExpertTag, Switch, Tag, cx, memberName } from "./ui";

const dayLabel = (iso: string) => {
  const d = new Date(iso);
  const key = d.toLocaleDateString("en-CA", { timeZone: "Europe/Berlin" });
  if (key === "2026-10-10") return "Tomorrow";
  return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short", timeZone: "Europe/Berlin" });
};
const time = (iso: string) => new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Berlin" });

const calTone: Record<string, string> = { Family: "bg-mint", Work: "bg-sky", Personal: "bg-lilac" };

function BlockHeader({ tone, icon, title, count }: { tone: string; icon: React.ReactNode; title: string; count: string }) {
  return (
    <div className={cx("on-block flex items-center gap-3 rounded-t-[13px] border-b-[3px] border-line px-4 py-3 md:px-5", tone)}>
      <span className="grid size-10 place-items-center rounded-xl border-[2.5px] border-[#161310] bg-[#fffbf4]">{icon}</span>
      <h2 className="font-display flex-1 text-2xl font-extrabold md:text-3xl">{title}</h2>
      <span className="font-display text-lg font-extrabold">{count}</span>
    </div>
  );
}

function Reminders() {
  const { reminderDone, toggleReminder, expert } = useStore();
  const open = reminders.filter((r) => !reminderDone[r.id]).length;
  return (
    <section className="bx sh rounded-2xl bg-surface">
      <BlockHeader tone="bg-sun" icon={<Bell size={20} strokeWidth={2.5} />} title="Reminders" count={`${open} open`} />
      <ul className="divide-line">
        {reminders.map((r) => {
          const done = !!reminderDone[r.id];
          return (
            <li key={r.id}>
              <button type="button" onClick={() => toggleReminder(r.id)} className="flex w-full items-start gap-4 px-4 py-4 text-left md:px-5">
                <span className={cx("mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg border-[3px] border-line", done ? "bg-ink" : "bg-surface")}>
                  {done && <Check size={18} strokeWidth={3.5} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={cx("block text-lg font-bold leading-snug", done && "line-through opacity-50")}>{r.title}</span>
                  <span className="mt-0.5 flex items-center gap-1.5 text-[15px] text-muted">
                    {r.whenKind === "place" && <MapPin size={15} strokeWidth={2.5} />}
                    {r.when}
                  </span>
                  {expert && (
                    <span className="mt-1.5 flex flex-wrap gap-1.5">
                      <ExpertTag>trigger: {r.whenKind}</ExpertTag>
                      {r.source && <ExpertTag>from: {r.source}</ExpertTag>}
                    </span>
                  )}
                </span>
                <span className="flex items-center gap-2">
                  {r.for !== "alex" && <span className="hidden text-sm font-semibold text-muted sm:inline">{memberName(r.for)}</span>}
                  <Avatar id={r.for} size={30} />
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Calendar() {
  const { expert } = useStore();
  const days: { label: string; items: typeof calendar }[] = [];
  for (const c of calendar) {
    const l = dayLabel(c.start);
    const last = days[days.length - 1];
    if (last && last.label === l) last.items.push(c);
    else days.push({ label: l, items: [c] });
  }
  return (
    <section className="bx sh rounded-2xl bg-surface">
      <BlockHeader tone="bg-sky" icon={<CalendarDays size={20} strokeWidth={2.5} />} title="Calendar" count="Next 5 days" />
      <div className="space-y-5 p-4 md:p-5">
        {days.map((d) => (
          <div key={d.label}>
            <div className="mb-2 text-xs font-extrabold uppercase tracking-[0.14em] text-muted">{d.label}</div>
            <ul className="space-y-2">
              {d.items.map((c) => (
                <li key={c.id} className="flex items-stretch gap-3">
                  <div className="w-16 shrink-0 pt-2 text-right font-display text-lg font-extrabold leading-none">{time(c.start)}</div>
                  <div className={cx("bx on-block flex-1 rounded-xl px-3 py-2.5", calTone[c.calendar] ?? "bg-sunk")}>
                    <div className="font-bold leading-snug">{c.title}</div>
                    <div className="text-sm on-block-muted">
                      until {time(c.end)} · {c.calendar}
                    </div>
                    {expert && <div className="mt-1 font-mono text-[11px] font-semibold">source: family calendar (CalDAV) · read only</div>}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

function Routines() {
  const { routineOn, setRoutine, expert, askAbout } = useStore();
  const on = routines.filter((r) => routineOn[r.id]).length;
  return (
    <section className="bx sh rounded-2xl bg-surface">
      <BlockHeader tone="bg-mint" icon={<Repeat size={20} strokeWidth={2.5} />} title="Routines" count={`${on} on`} />
      <ul className="space-y-3 p-4 md:p-5">
        {routines.map((r) => {
          const enabled = routineOn[r.id];
          return (
            <li key={r.id} className={cx("bx rounded-xl p-4 transition-colors", enabled ? "bg-surface sh-sm" : "bg-sunk")}>
              <div className="flex items-start gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className={cx("font-display text-xl font-extrabold leading-tight", !enabled && "opacity-60")}>{r.title}</h3>
                    {"oneOff" in r && r.oneOff && <Tag tone="lilac">Once</Tag>}
                  </div>
                  <div className="mt-1 text-[15px] font-semibold">{r.when}</div>
                  <p className="mt-1 text-[15px] leading-snug text-muted">{r.detail}</p>
                </div>
                <Switch on={enabled} onChange={(v) => setRoutine(r.id, v)} label={`${r.title} ${enabled ? "on" : "off"}`} />
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Tag tone="paper">{enabled ? `Next: ${r.nextRun}` : "Paused"}</Tag>
                {expert && (
                  <>
                    <ExpertTag>last run: {r.lastRun}</ExpertTag>
                    <ExpertTag>where: {r.where}</ExpertTag>
                    <ExpertTag>id: {r.id}</ExpertTag>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <div className="px-4 pb-5 md:px-5">
        <Btn tone="sun" icon={<MessageCircle size={18} strokeWidth={2.5} />} onClick={() => askAbout("Every Sunday evening, remind me to put the bins out")}>
          Ask hux for a new routine
        </Btn>
      </div>
    </section>
  );
}

export function PlansView() {
  return (
    <div className="mx-auto w-full max-w-[1280px] px-4 pb-28 pt-6 md:px-10 md:pt-12">
      <h1 className="font-display text-6xl font-extrabold leading-[0.9] md:text-8xl">Plans</h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div className="space-y-8">
          <Reminders />
          <Calendar />
        </div>
        <Routines />
      </div>
    </div>
  );
}
